/**
 * SSLCommerz Payment Gateway Integration Helper
 * FAJR Academy ERP
 */

export function getSSLCommerzConfig() {
  const storeId = (
    process.env.SSLCOMMERZ_STORE_ID ||
    process.env.SSL_STORE_ID ||
    "fajracademyio0live"
  ).trim();

  const storePass = (
    process.env.SSLCOMMERZ_STORE_PASSWORD ||
    process.env.SSL_STORE_PASS ||
    "6A65D4DE5CABA47064"
  ).trim();

  const isLive =
    process.env.SSLCOMMERZ_IS_LIVE === "true" ||
    process.env.SSLCOMMERZ_IS_LIVE === true;

  const initUrl = isLive
    ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
    : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

  const validationUrl = isLive
    ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
    : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

  return {
    storeId,
    storePass,
    isLive,
    initUrl,
    validationUrl,
  };
}

/**
 * Initiate a payment session with SSLCommerz
 * @param {Object} paymentData
 * @returns {Promise<{success: boolean, GatewayPageURL?: string, sessionkey?: string, error?: string}>}
 */
export async function initiateSSLPayment(paymentData) {
  const config = getSSLCommerzConfig();

  const postData = new URLSearchParams();

  // Store credentials
  postData.append("store_id", config.storeId);
  postData.append("store_passwd", config.storePass);

  // Transaction details
  postData.append("total_amount", String(paymentData.amount));
  postData.append("currency", paymentData.currency || "BDT");
  postData.append("tran_id", paymentData.transactionId);

  // Return callbacks
  postData.append("success_url", paymentData.successUrl);
  postData.append("fail_url", paymentData.failUrl);
  postData.append("cancel_url", paymentData.cancelUrl);
  postData.append("ipn_url", paymentData.ipnUrl);

  // Customer info
  postData.append("cus_name", paymentData.name || "Student / Patron");
  postData.append("cus_email", paymentData.email || "hellofajracdemy@gmail.com");
  postData.append("cus_phone", paymentData.phone || "01410764581");
  postData.append("cus_add1", "55/2, West Panthapath");
  postData.append("cus_city", "Dhaka");
  postData.append("cus_state", "Dhaka");
  postData.append("cus_postcode", "1205");
  postData.append("cus_country", "Bangladesh");

  // Product info
  postData.append("shipping_method", "NO");
  postData.append("product_name", paymentData.purpose || "Educational Fee");
  postData.append("product_category", "Education");
  postData.append("product_profile", "non-physical-goods");

  // Custom values for tracking
  if (paymentData.studentId) {
    postData.append("value_a", paymentData.studentId);
  }
  if (paymentData.purpose) {
    postData.append("value_b", paymentData.purpose);
  }
  if (paymentData.name) {
    postData.append("value_c", paymentData.name);
  }
  if (paymentData.phone) {
    postData.append("value_d", paymentData.phone);
  }

  try {
    const response = await fetch(config.initUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: postData.toString(),
      cache: "no-store",
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid gateway response: ${responseText.slice(0, 100)}`);
    }

    if (data.status === "SUCCESS" && data.GatewayPageURL) {
      return {
        success: true,
        GatewayPageURL: data.GatewayPageURL,
        sessionkey: data.sessionkey,
        raw: data,
      };
    } else {
      return {
        success: false,
        error: data.failedreason || "Unable to initiate payment session with SSLCommerz",
        raw: data,
      };
    }
  } catch (err) {
    console.error("SSLCommerz Init Error:", err);
    return {
      success: false,
      error: err.message || "Failed to reach payment gateway",
    };
  }
}

/**
 * Validate payment with SSLCommerz server
 * @param {string} valId
 * @returns {Promise<{isValid: boolean, data?: any, error?: string}>}
 */
export async function validateSSLPayment(valId) {
  const config = getSSLCommerzConfig();

  const url = `${config.validationUrl}?val_id=${encodeURIComponent(
    valId
  )}&store_id=${encodeURIComponent(
    config.storeId
  )}&store_passwd=${encodeURIComponent(
    config.storePass
  )}&v=1&format=json`;

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json();

    if (data.status === "VALID" || data.status === "VALIDATED") {
      return {
        isValid: true,
        data,
      };
    } else {
      return {
        isValid: false,
        data,
        error: data.failedreason || `Payment status is ${data.status}`,
      };
    }
  } catch (err) {
    console.error("SSLCommerz Validation Error:", err);
    return {
      isValid: false,
      error: err.message || "Failed to validate payment with gateway",
    };
  }
}
