import mongoose from "mongoose";
import { dbConnect } from "@/service/mongo";
import { SalesTargetModel } from "@/model/sales-target-model";
import { PaymentModel } from "@/model/payment-model";
import { StudentModel } from "@/model/student-model";
import { UserModel } from "@/model/user-model";

/**
 * Helper to get Bangladesh Time (UTC+6) normalized day boundaries
 */
function getDayBounds(date = new Date()) {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/**
 * Check if a user role or designation is authorized to set/update sales targets:
 * Superadmin, Admin, Operations Lead, Head of Sales, Software Engineer.
 */
export function isAuthorizedSalesTargetEditor(role = "", designation = "") {
  const normalize = (str) =>
    (str || "").toLowerCase().replace(/[\s\-_]+/g, "").trim();

  const allowed = [
    "superadmin",
    "admin",
    "operationslead",
    "headofsales",
    "softwareengineer",
  ];

  const normRole = normalize(role);
  const normDesig = normalize(designation);

  return allowed.includes(normRole) || allowed.includes(normDesig);
}

export async function checkUserSalesTargetPermission(userId, userRole = "") {
  if (isAuthorizedSalesTargetEditor(userRole)) return true;
  if (!userId || !mongoose.isValidObjectId(userId)) return false;

  try {
    await dbConnect();
    const user = await UserModel.findById(userId).select("role designation").lean();
    if (user && isAuthorizedSalesTargetEditor(user.role, user.designation)) {
      return true;
    }

    const { StaffModel } = await import("@/model/staff-model");
    const staff = await StaffModel.findById(userId).select("department designation").lean();
    if (staff && isAuthorizedSalesTargetEditor(staff.department, staff.designation)) {
      return true;
    }
  } catch (err) {
    console.error("checkUserSalesTargetPermission error:", err);
  }

  return false;
}


/**
 * Get active Sales Target and real-time calculated achievements based on Student creation (Admission + Monthly Fee)
 */
export async function getSalesTargetSummary({ userId = "all", month, year } = {}) {
  await dbConnect();

  const now = new Date();
  const currentYear = year ? parseInt(year, 10) : now.getFullYear();
  const currentMonthNum = month ? parseInt(month, 10) : now.getMonth() + 1;
  const currentMonthKey = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;

  // 1. Time Boundaries
  // Daily: Today
  const todayBounds = getDayBounds(now);

  // Month bounds
  const monthStart = new Date(currentYear, currentMonthNum - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(currentYear, currentMonthNum, 0, 23, 59, 59, 999);

  // 2. Fetch list of ONLY users from UserModel whose role is "New Sales"
  const newSalesRoleRegex = /^(new[-_\s]?sales|newsales|new_sales|new[-_\s]?sale|newsale)$/i;

  const rawNewSalesUsers = await UserModel.find({
    $or: [
      {
        role: {
          $in: [
            "new-sales",
            "new sales",
            "newsales",
            "new_sales",
            "newsale",
            "new-sale",
            "New Sales",
            "New-Sales",
          ],
        },
      },
      { role: newSalesRoleRegex },
    ],
    isActive: true,
  })
    .select("_id fullName email role department designation avatar")
    .lean();

  const salesTeamList = rawNewSalesUsers.map((u) => ({
    _id: u._id.toString(),
    fullName: u.fullName,
    email: u.email,
    role: u.role || "new-sales",
    department: u.department || "New Sales",
    designation: u.designation || "New Sales Executive",
    avatar: u.avatar || "",
  }));

  const allNewSalesUserIds = salesTeamList.map((u) => u._id);
  const allNewSalesObjectIds = allNewSalesUserIds
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  // 3. Fetch or create default Sales Target Record
  const isIndividual = userId && userId !== "all" && mongoose.isValidObjectId(userId);
  const targetFilter = isIndividual
    ? { targetType: "user", user: new mongoose.Types.ObjectId(userId), month: currentMonthKey }
    : { targetType: "organization", month: currentMonthKey };

  let targetDoc = await SalesTargetModel.findOne(targetFilter).lean();

  if (!targetDoc) {
    const latestDoc = await SalesTargetModel.findOne(
      isIndividual ? { targetType: "user", user: new mongoose.Types.ObjectId(userId) } : { targetType: "organization" }
    )
      .sort({ createdAt: -1 })
      .lean();

    if (latestDoc) {
      targetDoc = {
        ...latestDoc,
        _id: null,
        month: currentMonthKey,
        year: currentYear,
      };
    } else {
      const defaultFrom = new Date(currentYear, currentMonthNum - 1, 1);
      const defaultTo = new Date(currentYear, currentMonthNum - 1, 15, 23, 59, 59);

      targetDoc = {
        targetType: isIndividual ? "user" : "organization",
        user: isIndividual ? new mongoose.Types.ObjectId(userId) : null,
        daily: isIndividual ? 2500 : 5000,
        fifteenDays: isIndividual ? 37500 : 75000,
        custom: isIndividual ? 37500 : 75000,
        from_date: defaultFrom,
        to_date: defaultTo,
        monthly: isIndividual ? 75000 : 150000,
        month: currentMonthKey,
        year: currentYear,
      };
    }
  }

  // Determine Custom / 15-day Range boundaries
  let customStart = targetDoc.from_date ? new Date(targetDoc.from_date) : new Date(currentYear, currentMonthNum - 1, 1);
  let customEnd = targetDoc.to_date
    ? new Date(targetDoc.to_date)
    : new Date(currentYear, currentMonthNum - 1, 15, 23, 59, 59);

  customEnd = new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate(), 23, 59, 59, 999);
  customStart = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate(), 0, 0, 0, 0);

  // 4. Student Create-Wise Revenue Calculation Helper for CRM In Charge (New Sales)
  const computeStudentSalesForWindow = async (startDate, endDate) => {
    // Build match condition for student creation date
    const studentMatch = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (isIndividual) {
      studentMatch.$or = [
        { crmRefId: userId },
        { crmRefId: new mongoose.Types.ObjectId(userId) },
        { crmRefId: String(userId) },
      ];
    } else {
      // For overall team, match all students created with CRM In Charge belonging to New Sales
      if (allNewSalesUserIds.length > 0) {
        studentMatch.$or = [
          { crmRefId: { $in: [...allNewSalesUserIds, ...allNewSalesObjectIds] } },
        ];
      }
    }

    // Also check completed payments for extra safety/reconciliation
    const paymentMatch = {
      status: "completed",
      createdAt: { $gte: startDate, $lte: endDate },
    };
    if (isIndividual) {
      paymentMatch.$or = [
        { processedBy: new mongoose.Types.ObjectId(userId) },
      ];
    }

    const [studentAgg, paymentAgg] = await Promise.all([
      StudentModel.aggregate([
        { $match: studentMatch },
        {
          $group: {
            _id: null,
            studentCount: { $sum: 1 },
            totalAdmissionFee: { $sum: { $ifNull: ["$admissionFee", 0] } },
            totalMonthlyFee: { $sum: { $ifNull: ["$monthlyFee", 0] } },
          },
        },
      ]),
      PaymentModel.aggregate([
        { $match: paymentMatch },
        {
          $group: {
            _id: null,
            totalPayment: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const studentCount = studentAgg[0]?.studentCount || 0;
    const admissionFee = studentAgg[0]?.totalAdmissionFee || 0;
    const monthlyFee = studentAgg[0]?.totalMonthlyFee || 0;
    const paymentTotal = paymentAgg[0]?.totalPayment || 0;

    // Overall achievement is the sum of Admission Fee + Monthly Fee agreed on student creation
    const calculatedTotal = admissionFee + monthlyFee;
    const finalTotal = Math.max(calculatedTotal, paymentTotal);

    return {
      total: Math.round(finalTotal),
      admissionFee: Math.round(admissionFee),
      monthlyFee: Math.round(monthlyFee),
      studentCount,
      paymentTotal: Math.round(paymentTotal),
    };
  };

  const [dailyData, customData, monthlyData] = await Promise.all([
    computeStudentSalesForWindow(todayBounds.start, todayBounds.end),
    computeStudentSalesForWindow(customStart, customEnd),
    computeStudentSalesForWindow(monthStart, monthEnd),
  ]);

  const dailyTarget = Number(targetDoc.daily) || 1;
  const customTarget = Number(targetDoc.custom || targetDoc.fifteenDays) || 1;
  const monthlyTarget = Number(targetDoc.monthly) || 1;

  const daily_completed = Number(Math.min((dailyData.total / dailyTarget) * 100, 999).toFixed(1));
  const custom_completed = Number(Math.min((customData.total / customTarget) * 100, 999).toFixed(1));
  const monthly_completed = Number(Math.min((monthlyData.total / monthlyTarget) * 100, 999).toFixed(1));

  // 5. Compute Individual Performance Breakdown for each New Sales User
  const userBreakdown = await Promise.all(
    salesTeamList.map(async (member) => {
      const memObjId = new mongoose.Types.ObjectId(member._id);

      const [mStudentAgg, memTargetDoc] = await Promise.all([
        StudentModel.aggregate([
          {
            $match: {
              createdAt: { $gte: monthStart, $lte: monthEnd },
              $or: [
                { crmRefId: member._id },
                { crmRefId: memObjId },
                { crmRefId: String(member._id) },
              ],
            },
          },
          {
            $group: {
              _id: null,
              studentCount: { $sum: 1 },
              totalAdmissionFee: { $sum: { $ifNull: ["$admissionFee", 0] } },
              totalMonthlyFee: { $sum: { $ifNull: ["$monthlyFee", 0] } },
            },
          },
        ]),
        SalesTargetModel.findOne({ targetType: "user", user: memObjId, month: currentMonthKey }).lean(),
      ]);

      const repStudentCount = mStudentAgg[0]?.studentCount || 0;
      const repAdmissionFee = mStudentAgg[0]?.totalAdmissionFee || 0;
      const repMonthlyFee = mStudentAgg[0]?.totalMonthlyFee || 0;
      const repAchieved = repAdmissionFee + repMonthlyFee;

      const memMonthlyTarget =
        memTargetDoc?.monthly || Math.round(monthlyTarget / Math.max(salesTeamList.length, 1));
      const pct =
        memMonthlyTarget > 0 ? Number(Math.min((repAchieved / memMonthlyTarget) * 100, 999).toFixed(1)) : 0;

      return {
        ...member,
        achievement: Math.round(repAchieved),
        admissionFee: Math.round(repAdmissionFee),
        monthlyFee: Math.round(repMonthlyFee),
        studentCount: repStudentCount,
        target: memMonthlyTarget,
        percentage: pct,
      };
    })
  );

  return {
    salesTarget: {
      _id: targetDoc._id || null,
      targetType: targetDoc.targetType || (isIndividual ? "user" : "organization"),
      userId: isIndividual ? userId : "all",
      daily: targetDoc.daily,
      fifteenDays: targetDoc.fifteenDays || targetDoc.custom,
      custom: targetDoc.custom || targetDoc.fifteenDays,
      from_date: targetDoc.from_date || customStart,
      to_date: targetDoc.to_date || customEnd,
      monthly: targetDoc.monthly,
      month: currentMonthKey,
      year: currentYear,
      notes: targetDoc.notes || "",
      daily_completed,
      custom_completed,
      monthly_completed,
      amounts: {
        daily_total: dailyData.total,
        daily_admission: dailyData.admissionFee,
        daily_monthly: dailyData.monthlyFee,
        custom_total: customData.total,
        custom_admission: customData.admissionFee,
        custom_monthly: customData.monthlyFee,
        monthly_total: monthlyData.total,
        monthly_admission: monthlyData.admissionFee,
        monthly_monthly: monthlyData.monthlyFee,
      },
      counts: {
        daily_sales_count: dailyData.studentCount,
        custom_sales_count: customData.studentCount,
        monthly_sales_count: monthlyData.studentCount,
      },
    },
    salesUsers: salesTeamList,
    userBreakdown: userBreakdown.sort((a, b) => b.achievement - a.achievement),
  };
}

/**
 * Upsert Sales Target
 */
export async function updateSalesTargetData(data, userContext = {}) {
  await dbConnect();

  const now = new Date();
  const targetType = data.targetType === "user" && data.userId && data.userId !== "all" ? "user" : "organization";
  const userObjId = targetType === "user" && mongoose.isValidObjectId(data.userId) ? new mongoose.Types.ObjectId(data.userId) : null;

  const currentYear = data.year ? parseInt(data.year, 10) : now.getFullYear();
  const currentMonth = data.month || `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const daily = Math.max(0, parseInt(data.daily, 10) || 0);
  const fifteenDays = Math.max(0, parseInt(data.fifteenDays || data.custom, 10) || 0);
  const custom = Math.max(0, parseInt(data.custom || data.fifteenDays, 10) || 0);
  const monthly = Math.max(0, parseInt(data.monthly, 10) || 0);

  const from_date = data.from_date ? new Date(data.from_date) : null;
  const to_date = data.to_date ? new Date(data.to_date) : null;

  const validContextUserId = userContext?.userId && mongoose.isValidObjectId(userContext.userId)
    ? new mongoose.Types.ObjectId(userContext.userId)
    : null;

  const filter = {
    targetType,
    user: userObjId,
    month: currentMonth,
  };

  const update = {
    targetType,
    user: userObjId,
    daily,
    fifteenDays,
    custom,
    from_date,
    to_date,
    monthly,
    month: currentMonth,
    year: currentYear,
    notes: data.notes || "",
    updatedBy: validContextUserId,
  };

  if (validContextUserId) {
    update.$setOnInsert = {
      createdBy: validContextUserId,
    };
  }

  const updatedDoc = await SalesTargetModel.findOneAndUpdate(
    filter,
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return updatedDoc;
}
