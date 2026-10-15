import { dbConnect } from "@/service/mongo";
import { TaskModel } from "@/model/task-model";
import { UserModel } from "@/model/user-model";
import { StaffModel } from "@/model/staff-model";
import { NotificationModel } from "@/model/notification-model";
import { sendTaskAssignmentEmail, sendTaskStatusUpdateEmail } from "@/utlis/mail";
import mongoose from "mongoose";

/**
 * In-memory TTL cache for assignable users (60s TTL)
 * Drastically reduces database round-trips on high page-traffic.
 */
let assignableUsersCache = { data: null, timestamp: 0 };
const USERS_CACHE_TTL_MS = 60 * 1000;

export function invalidateAssignableUsersCache() {
  assignableUsersCache = { data: null, timestamp: 0 };
}

/**
 * Check if the given user has authority to create and assign tasks.
 * STRICT ENFORCEMENT: ONLY Admin, Super Admin, Operation (Opration), and Head of Sales.
 */
export function canUserAssignTask(user) {
  if (!user) return false;

  const role = (user.role || "").toLowerCase().trim();
  const normalized = role.replace(/[-_\s]/g, "");

  return (
    normalized === "admin" ||
    normalized === "superadmin" ||
    normalized === "operation" ||
    normalized === "opration" ||
    normalized === "operations" ||
    normalized === "headofsales" ||
    normalized === "headsales" ||
    normalized.includes("headofsales") ||
    normalized.includes("operation") ||
    normalized.includes("opration") ||
    normalized.includes("superadmin")
  );
}

/**
 * Escape regex helper
 */
function escapeRegex(text = "") {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Helper to build query conditions that match tasks assigned to a specific user.
 * Matches by ObjectId, string representation, exact email, and regex email.
 */
export function getAssigneeQueryConditions(user) {
  const currentUserId = user?._id?.toString() || user?.id?.toString();
  const currentUserEmail = (user?.email || "").toLowerCase().trim();

  const conditions = [];

  if (currentUserId) {
    if (mongoose.Types.ObjectId.isValid(currentUserId)) {
      conditions.push({ "assignedTo.userId": new mongoose.Types.ObjectId(currentUserId) });
    }
    conditions.push({ "assignedTo.userId": currentUserId });
  }

  if (currentUserEmail) {
    conditions.push({ "assignedTo.email": currentUserEmail });
    conditions.push({
      "assignedTo.email": {
        $regex: new RegExp(`^${escapeRegex(currentUserEmail)}$`, "i"),
      },
    });
  }

  return conditions.length > 0 ? { $or: conditions } : {};
}

/**
 * Get tasks with comprehensive filtering, search, pagination, and user scope.
 * Optimized with lean projections, comment slicing, and compound index targeting.
 */
export async function getTasks({
  user,
  page = 1,
  limit = 20,
  status = "",
  priority = "",
  category = "",
  assignedTo = "",
  assignedBy = "",
  search = "",
  filterScope = "all", // "all", "my-tasks", "delegated"
  overdueOnly = false,
  sortBy = "createdAt",
  sortOrder = -1,
}) {
  await dbConnect();

  const andConditions = [{ isArchived: false }];
  const isAssigner = canUserAssignTask(user);

  // Scope handling:
  // If user is a regular user (not admin/operation/headofsales) OR if scope is "my-tasks"
  if (!isAssigner || filterScope === "my-tasks") {
    const assigneeMatch = getAssigneeQueryConditions(user);
    if (assigneeMatch.$or) {
      andConditions.push(assigneeMatch);
    }
  } else if (filterScope === "delegated") {
    const creatorConditions = [];
    const currentUserId = user?._id?.toString() || user?.id?.toString();
    const currentUserEmail = (user?.email || "").toLowerCase().trim();
    if (currentUserId) {
      if (mongoose.Types.ObjectId.isValid(currentUserId)) {
        creatorConditions.push({ "assignedBy.userId": new mongoose.Types.ObjectId(currentUserId) });
      }
      creatorConditions.push({ "assignedBy.userId": currentUserId });
    }
    if (currentUserEmail) {
      creatorConditions.push({ "assignedBy.email": currentUserEmail });
    }
    if (creatorConditions.length > 0) {
      andConditions.push({ $or: creatorConditions });
    }
  }

  // Status filter
  if (status && status !== "all") {
    andConditions.push({ status });
  }

  // Priority filter
  if (priority && priority !== "all") {
    andConditions.push({ priority });
  }

  // Category filter
  if (category && category !== "all") {
    andConditions.push({ category });
  }

  // Specific Assignee filter (when browsing as manager)
  if (assignedTo && assignedTo !== "all") {
    const targetConditions = [];
    if (mongoose.Types.ObjectId.isValid(assignedTo)) {
      targetConditions.push({ "assignedTo.userId": new mongoose.Types.ObjectId(assignedTo) });
    }
    targetConditions.push({ "assignedTo.userId": assignedTo });
    targetConditions.push({ "assignedTo.email": assignedTo.toLowerCase() });
    andConditions.push({ $or: targetConditions });
  }

  // Specific Assigner filter
  if (assignedBy && assignedBy !== "all") {
    const assignerConditions = [];
    if (mongoose.Types.ObjectId.isValid(assignedBy)) {
      assignerConditions.push({ "assignedBy.userId": new mongoose.Types.ObjectId(assignedBy) });
    }
    assignerConditions.push({ "assignedBy.userId": assignedBy });
    andConditions.push({ $or: assignerConditions });
  }

  // Overdue filter
  if (overdueOnly) {
    andConditions.push({
      dueDate: { $lt: new Date() },
      status: { $nin: ["completed", "cancelled"] },
    });
  }

  // Search keyword (matches title, description, assignee name)
  if (search && search.trim()) {
    const escaped = escapeRegex(search.trim());
    andConditions.push({
      $or: [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { "assignedTo.name": { $regex: escaped, $options: "i" } },
        { "assignedTo.email": { $regex: escaped, $options: "i" } },
        { tags: { $in: [new RegExp(escaped, "i")] } },
      ],
    });
  }

  const query = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };

  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (parsedPage - 1) * parsedLimit;
  const sort = { [sortBy]: Number(sortOrder) || -1 };

  // Use projection to exclude heavy unnecessary fields and slice comments to last 3 for low memory usage
  const [tasks, total] = await Promise.all([
    TaskModel.find(query)
      .slice("comments", -3) // Only pull latest 3 comments in listing, cutting response size by ~90%
      .sort(sort)
      .skip(skip)
      .limit(parsedLimit)
      .lean({ virtuals: false }),
    TaskModel.countDocuments(query),
  ]);

  return {
    tasks,
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1,
    isAssigner,
  };
}

/**
 * Get detailed stats for tasks in a SINGLE MongoDB round-trip via $facet aggregation.
 * Replaces 8 individual countDocuments queries with 1 high-speed pipeline.
 */
export async function getTaskStats(user) {
  await dbConnect();
  const isAssigner = canUserAssignTask(user);
  const now = new Date();

  const assigneeMatch = getAssigneeQueryConditions(user);
  const myPendingMatch = assigneeMatch.$or
    ? {
        $and: [
          { $or: assigneeMatch.$or },
          { status: { $nin: ["completed", "cancelled"] } },
        ],
      }
    : { status: { $nin: ["completed", "cancelled"] } };

  // Scope rule: Admins/Operations/Head of Sales see all tasks. Regular users ONLY see their own tasks.
  const baseMatch = isAssigner
    ? { isArchived: false }
    : { isArchived: false, ...(assigneeMatch.$or ? { $or: assigneeMatch.$or } : {}) };

  const userStatsMatch = baseMatch;

  // Execute single facet pipeline + user-wise group aggregation in parallel with resilience
  let facetResult = null;
  let userStatsAggregation = [];

  try {
    const [[fRes], uRes] = await Promise.all([
      TaskModel.aggregate([
        { $match: baseMatch },
        {
          $facet: {
            total: [{ $count: "count" }],
            todo: [{ $match: { status: "todo" } }, { $count: "count" }],
            inProgress: [{ $match: { status: "in_progress" } }, { $count: "count" }],
            underReview: [{ $match: { status: "under_review" } }, { $count: "count" }],
            completed: [{ $match: { status: "completed" } }, { $count: "count" }],
            cancelled: [{ $match: { status: "cancelled" } }, { $count: "count" }],
            overdue: [
              { $match: { dueDate: { $lt: now }, status: { $nin: ["completed", "cancelled"] } } },
              { $count: "count" },
            ],
            urgent: [
              { $match: { priority: "urgent", status: { $nin: ["completed", "cancelled"] } } },
              { $count: "count" },
            ],
            myPending: [
              { $match: myPendingMatch },
              { $count: "count" },
            ],
          },
        },
      ]),
      TaskModel.aggregate([
        { $match: userStatsMatch },
        {
          $group: {
            _id: {
              email: { $toLower: { $ifNull: ["$assignedTo.email", ""] } },
              name: { $ifNull: ["$assignedTo.name", "Unknown User"] },
              avatar: { $ifNull: ["$assignedTo.avatar", ""] },
              role: { $ifNull: ["$assignedTo.role", "Staff"] },
              department: { $ifNull: ["$assignedTo.department", ""] },
              userId: "$assignedTo.userId",
            },
            total: { $sum: 1 },
            todo: {
              $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] },
            },
            inProgress: {
              $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
            },
            underReview: {
              $sum: { $cond: [{ $eq: ["$status", "under_review"] }, 1, 0] },
            },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$dueDate", null] },
                      { $lt: ["$dueDate", now] },
                      { $not: [{ $in: ["$status", ["completed", "cancelled"]] }] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            urgent: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$priority", "urgent"] },
                      { $not: [{ $in: ["$status", ["completed", "cancelled"]] }] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            tasks: {
              $push: {
                _id: "$_id",
                title: "$title",
                status: "$status",
                priority: "$priority",
                category: "$category",
                dueDate: "$dueDate",
                createdAt: "$createdAt",
              },
            },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);
    facetResult = fRes;
    userStatsAggregation = uRes;
  } catch (err) {
    console.error("[getTaskStats aggregation error]", err);
  }

  const extractCount = (arr) => arr?.[0]?.count || 0;
  const total = extractCount(facetResult?.total);
  const completed = extractCount(facetResult?.completed);
  const todo = extractCount(facetResult?.todo);
  const inProgress = extractCount(facetResult?.inProgress);
  const underReview = extractCount(facetResult?.underReview);
  const cancelled = extractCount(facetResult?.cancelled);
  const overdue = extractCount(facetResult?.overdue);
  const urgent = extractCount(facetResult?.urgent);
  const myPending = extractCount(facetResult?.myPending);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Format userStats: ONLY include users who actually have assigned tasks (total > 0)
  const userStats = (userStatsAggregation || [])
    .filter((u) => u._id && (u._id.name || u._id.email) && (u.total || 0) > 0)
    .map((u) => {
      const uTotal = u.total || 0;
      const uCompleted = u.completed || 0;
      const uTodo = u.todo || 0;
      const uInProgress = u.inProgress || 0;
      const uUnderReview = u.underReview || 0;
      const uCancelled = u.cancelled || 0;
      const uPending = uTodo + uInProgress + uUnderReview;
      const uRate = uTotal > 0 ? Math.round((uCompleted / uTotal) * 100) : 0;

      const userTaskList = (u.tasks || []).filter(Boolean);

      return {
        userId: u._id.userId ? String(u._id.userId) : "",
        name: u._id.name,
        email: u._id.email,
        avatar: u._id.avatar,
        role: u._id.role,
        department: u._id.department,
        total: uTotal,
        todo: uTodo,
        inProgress: uInProgress,
        underReview: uUnderReview,
        completed: uCompleted,
        cancelled: uCancelled,
        pending: uPending,
        overdue: u.overdue || 0,
        urgent: u.urgent || 0,
        completionRate: uRate,
        tasks: userTaskList,
        activeTasks: userTaskList.filter((t) => t.status !== "completed" && t.status !== "cancelled"),
      };
    });

  return {
    total,
    todo,
    inProgress,
    underReview,
    completed,
    cancelled,
    overdue,
    urgent,
    myPending,
    completionRate,
    isAssigner,
    userStats,
  };
}

/**
 * Get single task by ID (returns full task with complete discussion history)
 */
export async function getTaskById(id) {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return TaskModel.findById(id).lean();
}

/**
 * Create a new task and notify assignee via email & in-app notification
 */
export async function createTask(data, actor) {
  await dbConnect();

  if (!canUserAssignTask(actor)) {
    throw new Error(
      "Permission denied: Only Admin, Super Admin, Operation, or Head of Sales can create and assign tasks."
    );
  }

  if (!data.title || !data.title.trim()) {
    throw new Error("Task title is required");
  }

  if (!data.assignedTo || !data.assignedTo.userId) {
    throw new Error("Assignee user is required");
  }

  const assignedBy = {
    userId: actor._id || actor.id,
    name: actor.fullName || actor.name || "Administrator",
    email: actor.email,
    role: actor.role || "admin",
    avatar: actor.avatar || "",
  };

  const newTask = new TaskModel({
    title: data.title.trim(),
    description: data.description || "",
    priority: data.priority || "medium",
    status: data.status || "todo",
    category: data.category || "general",
    assignedTo: {
      userId: data.assignedTo.userId,
      name: data.assignedTo.name,
      email: data.assignedTo.email.toLowerCase().trim(),
      role: data.assignedTo.role || "Staff",
      avatar: data.assignedTo.avatar || "",
      department: data.assignedTo.department || "",
    },
    assignedBy,
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    estimatedHours: Number(data.estimatedHours) || 0,
    tags: Array.isArray(data.tags) ? data.tags : [],
    subtasks: Array.isArray(data.subtasks)
      ? data.subtasks.map((st) => ({
          title: typeof st === "string" ? st : st.title,
          isCompleted: false,
        }))
      : [],
    comments: [
      {
        userId: actor._id || actor.id,
        userName: actor.fullName || actor.name || "System",
        userRole: actor.role || "admin",
        userAvatar: actor.avatar || "",
        message: `Task created and assigned to ${data.assignedTo.name}`,
        type: "system",
      },
    ],
  });

  await newTask.save();

  // Send Email Notification asynchronously without blocking response
  const shouldSendEmail = data.sendEmail !== false;
  if (shouldSendEmail && newTask.assignedTo.email) {
    sendTaskAssignmentEmail({
      toEmail: newTask.assignedTo.email,
      assigneeName: newTask.assignedTo.name,
      task: newTask,
      assignedByName: assignedBy.name,
      assignedByRole: assignedBy.role,
    })
      .then(async () => {
        await TaskModel.findByIdAndUpdate(newTask._id, {
          $set: {
            emailNotificationSent: true,
            emailSentAt: new Date(),
            emailRecipient: newTask.assignedTo.email,
          },
        });
      })
      .catch(async (mailError) => {
        console.error("[createTask] Mail dispatch failed:", mailError);
        await TaskModel.findByIdAndUpdate(newTask._id, {
          $set: {
            emailNotificationSent: false,
            emailError: mailError.message,
          },
        });
      });
  }

  // In-app Notification (non-blocking)
  NotificationModel.create({
    title: `New Task Assigned: ${newTask.title}`,
    body: `You have been assigned a ${newTask.priority} priority task by ${assignedBy.name}. Due: ${
      newTask.dueDate ? new Date(newTask.dueDate).toLocaleDateString() : "No deadline"
    }`,
    type: newTask.priority === "urgent" ? "alert" : "info",
    category: "general",
    recipients: [newTask.assignedTo.userId],
    recipientModel: "User",
    link: `/tasks?taskId=${newTask._id}`,
    createdBy: assignedBy.userId,
  }).catch((notifErr) => {
    console.warn("[createTask] In-app notification creation skipped:", notifErr);
  });

  return newTask.toObject();
}

/**
 * Update an existing task
 */
export async function updateTask(id, updates, actor) {
  await dbConnect();

  const task = await TaskModel.findById(id);
  if (!task) {
    throw new Error("Task not found");
  }

  const isAssigner = canUserAssignTask(actor);
  const isAssignee =
    String(task.assignedTo.userId) === String(actor._id || actor.id) ||
    task.assignedTo.email.toLowerCase() === actor.email?.toLowerCase();
  const isCreator =
    String(task.assignedBy.userId) === String(actor._id || actor.id);

  if (!isAssigner && !isAssignee && !isCreator) {
    throw new Error("Permission denied: You cannot modify this task.");
  }

  const auditComments = [];

  // Status update
  if (updates.status && updates.status !== task.status) {
    const oldStatus = task.status;
    task.status = updates.status;
    if (updates.status === "completed") {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }
    auditComments.push({
      userId: actor._id || actor.id,
      userName: actor.fullName || actor.name || "User",
      userRole: actor.role || "",
      userAvatar: actor.avatar || "",
      message: `Status changed from ${oldStatus.replace("_", " ")} to ${updates.status.replace("_", " ")}`,
      type: "status_change",
    });

    // Notify creator if assignee completed or changed status
    if (isAssignee && !isCreator && task.assignedBy.email) {
      sendTaskStatusUpdateEmail({
        toEmail: task.assignedBy.email,
        recipientName: task.assignedBy.name,
        task,
        updatedByName: actor.fullName || actor.name || "Assignee",
        newStatus: updates.status,
        note: updates.statusNote || updates.progressNote || "",
      }).catch((e) => console.warn("[updateTask] Status mail error:", e));
    }
  }

  // Actual hours worked update (assignee or assigner)
  if (updates.actualHours !== undefined) {
    task.actualHours = Number(updates.actualHours) || 0;
  }

  // Progress update note from assignee or assigner
  if (updates.progressNote && typeof updates.progressNote === "string" && updates.progressNote.trim()) {
    auditComments.push({
      userId: actor._id || actor.id,
      userName: actor.fullName || actor.name || "User",
      userRole: actor.role || "",
      userAvatar: actor.avatar || "",
      message: updates.progressNote.trim(),
      type: "comment",
    });
  }

  // Assigner / Creator can update core fields:
  if (isAssigner || isCreator) {
    if (updates.title) task.title = updates.title.trim();
    if (typeof updates.description === "string") task.description = updates.description;
    if (updates.priority) task.priority = updates.priority;
    if (updates.category) task.category = updates.category;
    if (updates.dueDate !== undefined) {
      task.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    }
    if (updates.startDate !== undefined) {
      task.startDate = updates.startDate ? new Date(updates.startDate) : task.startDate;
    }
    if (updates.estimatedHours !== undefined) {
      task.estimatedHours = Number(updates.estimatedHours) || 0;
    }
    if (Array.isArray(updates.tags)) {
      task.tags = updates.tags;
    }

    // Reassignment
    if (
      updates.assignedTo &&
      String(updates.assignedTo.userId) !== String(task.assignedTo.userId)
    ) {
      const oldName = task.assignedTo.name;
      task.assignedTo = {
        userId: updates.assignedTo.userId,
        name: updates.assignedTo.name,
        email: updates.assignedTo.email.toLowerCase().trim(),
        role: updates.assignedTo.role || "Staff",
        avatar: updates.assignedTo.avatar || "",
        department: updates.assignedTo.department || "",
      };

      auditComments.push({
        userId: actor._id || actor.id,
        userName: actor.fullName || actor.name || "User",
        userRole: actor.role || "",
        userAvatar: actor.avatar || "",
        message: `Task reassigned from ${oldName} to ${updates.assignedTo.name}`,
        type: "assignment_change",
      });

      // Send email to new assignee
      if (updates.sendEmail !== false && task.assignedTo.email) {
        sendTaskAssignmentEmail({
          toEmail: task.assignedTo.email,
          assigneeName: task.assignedTo.name,
          task,
          assignedByName: actor.fullName || actor.name || "Administration",
          assignedByRole: actor.role || "Management",
        }).catch((e) => console.warn("[updateTask] Reassign email error:", e));
      }
    }
  }

  // Subtasks update
  if (Array.isArray(updates.subtasks)) {
    task.subtasks = updates.subtasks;
  }

  // Append any audit comments
  if (auditComments.length > 0) {
    task.comments.push(...auditComments);
  }

  await task.save();
  return task.toObject();
}

/**
 * Toggle or complete a specific subtask
 */
export async function toggleSubtask(taskId, subtaskId, isCompleted, actor) {
  await dbConnect();
  const task = await TaskModel.findById(taskId);
  if (!task) throw new Error("Task not found");

  const subtask = task.subtasks.id(subtaskId);
  if (!subtask) throw new Error("Subtask not found");

  subtask.isCompleted = Boolean(isCompleted);
  subtask.completedAt = isCompleted ? new Date() : null;
  subtask.completedBy = isCompleted ? actor.fullName || actor.name : "";

  // Auto update status if all subtasks are completed
  const allCompleted = task.subtasks.length > 0 && task.subtasks.every((st) => st.isCompleted);
  if (allCompleted && task.status !== "completed") {
    task.status = "under_review";
    task.comments.push({
      userId: actor._id || actor.id,
      userName: actor.fullName || actor.name,
      userRole: actor.role || "",
      userAvatar: actor.avatar || "",
      message: "All checklist items completed — task marked Under Review",
      type: "status_change",
    });
  }

  await task.save();
  return task.toObject();
}

/**
 * Add a comment or progress note to the task
 */
export async function addTaskComment(taskId, message, actor) {
  await dbConnect();
  if (!message || !message.trim()) {
    throw new Error("Comment message cannot be empty");
  }

  const task = await TaskModel.findById(taskId);
  if (!task) throw new Error("Task not found");

  const newComment = {
    userId: actor._id || actor.id,
    userName: actor.fullName || actor.name || "User",
    userRole: actor.role || "",
    userAvatar: actor.avatar || "",
    message: message.trim(),
    type: "comment",
  };

  task.comments.push(newComment);
  await task.save();

  return task.toObject();
}

/**
 * Delete a task (allowed by assigners / creators)
 */
export async function deleteTask(id, actor) {
  await dbConnect();
  const task = await TaskModel.findById(id);
  if (!task) throw new Error("Task not found");

  const isAssigner = canUserAssignTask(actor);
  const isCreator =
    String(task.assignedBy.userId) === String(actor._id || actor.id);

  if (!isAssigner && !isCreator) {
    throw new Error("Permission denied: You cannot delete this task.");
  }

  await TaskModel.findByIdAndDelete(id);
  return { success: true, message: "Task deleted successfully" };
}

/**
 * Get all users who can be assigned tasks with in-memory TTL caching (60s).
 */
export async function getAssignableUsers() {
  const now = Date.now();
  if (
    assignableUsersCache.data &&
    now - assignableUsersCache.timestamp < USERS_CACHE_TTL_MS
  ) {
    return assignableUsersCache.data;
  }

  await dbConnect();

  const [users, staffMembers] = await Promise.all([
    UserModel.find({ isActive: { $ne: false } })
      .select("_id fullName email role avatar department designation")
      .lean(),
    StaffModel.find({ status: { $ne: "terminated" } })
      .select("_id staffId fullName email role department designation")
      .lean(),
  ]);

  const map = new Map();

  users.forEach((u) => {
    map.set(u.email.toLowerCase(), {
      _id: u._id.toString(),
      name: u.fullName,
      email: u.email,
      role: u.role || "Admin",
      department: u.department || "Administration",
      designation: u.designation || "",
      avatar: u.avatar || "",
      type: "user",
    });
  });

  staffMembers.forEach((s) => {
    const emailKey = s.email.toLowerCase();
    if (!map.has(emailKey)) {
      map.set(emailKey, {
        _id: s._id.toString(),
        name: s.fullName,
        email: s.email,
        role: s.role || "Staff",
        department: s.department || "Operations",
        designation: s.designation || "",
        avatar: "",
        type: "staff",
      });
    }
  });

  const sortedList = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  assignableUsersCache = { data: sortedList, timestamp: now };
  return sortedList;
}
