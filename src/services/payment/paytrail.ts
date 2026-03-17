import {
  CallbackUrl,
  CreatePaymentRequest,
  CreatePaymentResponse,
  Customer,
  Item,
  PaytrailClient,
} from '@paytrail/paytrail-js-sdk';

// Initialize Paytrail client with credentials from environment variables.
// These are fetched from the .env.local file.
// The default values are for Paytrail's test environment.
const secretKey = process.env.PAYTRAIL_SECRET_KEY || 'SAIPPUAKAUPPIAS';
export const paytrail = new PaytrailClient({
  merchantId: parseInt(process.env.PAYTRAIL_MERCHANT_ID || '375917', 10),
  secretKey: secretKey,
  platformName: 'TehtäväMestari', // Add platform name as required by SDK
});

/**
 * Represents a payment request.
 */
export interface PaymentRequest {
  /**
   * The amount to pay in cents.
   */
  amountCents: number;
  /**
   * The currency of the payment.
   */
  currency: string;
  /**
   * The order ID from the payments table.
   */
  orderId: string;
  /**
   * The customer's email.
   */
  customerEmail: string;
  /**
   * The task ID.
   */
  taskId: string;

  /**
   * Optional base URL for redirect/callback URLs.
   * When provided, it should be the exact origin the user is currently on
   * (e.g. https://taskmvp-wo1w.vercel.app). This prevents cross-domain redirects
   * that would otherwise drop auth cookies and "log out" the user.
   */
  appUrl?: string;
}

/**
 * Represents a payment response.
 */
export interface PaymentResponse {
  /**
   * The transaction ID.
   */
  transactionId: string;
  /**
   * The URL to redirect the user to for payment.
   */
  paymentUrl: string;
}

export async function initiatePayment(
  paymentRequest: PaymentRequest
): Promise<PaymentResponse> {
  const { amountCents, currency, orderId, customerEmail, taskId } =
    paymentRequest;

  // Determine base app URL (used for Paytrail redirectUrls and callbackUrls).
  let appUrl =
    paymentRequest.appUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';

  // If caller didn't provide appUrl, fall back to Vercel deployment URL when available.
  // Vercel provides VERCEL_URL as a hostname (no protocol). Users sometimes
  // mistakenly set it to a full URL. Normalize both cases.
  if (!paymentRequest.appUrl) {
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      appUrl = vercelUrl.startsWith('http://') || vercelUrl.startsWith('https://')
        ? vercelUrl
        : `https://${vercelUrl}`;
    }
  }

  // ============================================================================
  // When PAYTRAIL_MOCK or NEXT_PUBLIC_PAYTRAIL_MOCK is set to "true",
  // skip the real Paytrail API call and return a fake payment URL.
  // ============================================================================
  const isMockMode =
    process.env.PAYTRAIL_MOCK === 'true' ||
    process.env.NEXT_PUBLIC_PAYTRAIL_MOCK === 'true';

  if (isMockMode) {
    console.log(
      `[Paytrail Service] Mock mode enabled. Using appUrl: ${appUrl}. Skipping real Paytrail call for order ${orderId}.`
    );

    return {
      transactionId: `mock-tx-${orderId}`,
      paymentUrl: `${appUrl}/dashboard/tasks/${taskId}?payment=success&orderId=${orderId}&mock=1`,
    };
  }

  console.log(
    `[Paytrail Service] VERCEL_ENV: ${process.env.VERCEL_ENV}. Using appUrl: ${appUrl} for callbacks.`
  );

  // Create an instance of the main request object
  const payload = new CreatePaymentRequest();

  // Populate the top-level properties
  payload.stamp = orderId;
  payload.reference = taskId;
  payload.amount = amountCents;
  payload.currency = currency;
  payload.language = 'FI';

  // Create and populate the Item instance
  const item = new Item();
  item.unitPrice = amountCents;
  item.units = 1;
  item.vatPercentage = 0;
  item.productCode = 'TASK_PAYMENT';
  item.description = `Tehtävän ${taskId} maksu`;
  payload.items = [item];

  // Create and populate the Customer instance
  const customer = new Customer();
  customer.email = customerEmail;
  payload.customer = customer;

  // Create and populate the redirect and callback URLs
  const redirectUrls = new CallbackUrl();
  redirectUrls.success = `${appUrl}/dashboard/tasks/${taskId}?payment=success&orderId=${orderId}`;
  redirectUrls.cancel = `${appUrl}/dashboard/tasks/${taskId}?payment=cancel&orderId=${orderId}`;
  payload.redirectUrls = redirectUrls;

  const callbackUrls = new CallbackUrl();
  callbackUrls.success = `${appUrl}/api/paytrail-callback`;
  callbackUrls.cancel = `${appUrl}/api/paytrail-callback`;
  payload.callbackUrls = callbackUrls;

  try {
    const paymentResponse: CreatePaymentResponse =
      await paytrail.createPayment(payload);

    // The SDK's response object has a `data` property containing the actual response
    if (paymentResponse.data) {
      return {
        transactionId: paymentResponse.data.transactionId,
        paymentUrl: paymentResponse.data.href,
      };
    } else {
      // Handle cases where the response is not successful
      console.error('Paytrail payment creation failed:', paymentResponse.message);
      throw new Error(
        `Failed to create Paytrail payment: ${paymentResponse.message || 'Invalid response.'}`
      );
    }
  } catch (error) {
    // Preserve the original error details for debugging.
    // The caller decides what (if anything) to show to the end user.
    console.error('Exception caught during Paytrail payment creation:', {
      hasSecretKey: Boolean(process.env.PAYTRAIL_SECRET_KEY),
      orderId,
      taskId,
      amountCents,
      currency,
      error,
    });

    const message =
      error instanceof Error ? error.message : 'Unknown Paytrail error';

    throw new Error(`Paytrail createPayment failed: ${message}`, { cause: error });
  }
}

/**
 * Validates the Paytrail callback to ensure it's authentic.
 * This uses the modern HMAC validation for the new API.
 *
 * @param headers The incoming request headers.
 * @param body The raw request body as a string.
 * @returns A boolean indicating whether the callback is valid.
 */
export function validatePaytrailCallback(
  headers: Record<string, string | undefined>,
  body: string
): boolean {
  const signature = headers['signature'];

  // Extract all 'checkout-' headers for validation
  const checkoutHeaders: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key.startsWith('checkout-') && value) {
      checkoutHeaders[key] = value;
    }
  }

  if (!signature) {
    console.error('Paytrail callback validation failed: Missing signature header.');
    return false;
  }

  try {
    // The SDK's type signature expects a parsed object for the body.
    const bodyParam = body ? JSON.parse(body) : '';
    paytrail.validateHmac(checkoutHeaders, bodyParam, signature, secretKey);
    return true; // If it doesn't throw, it's valid
  } catch (error) {
    console.error('Error during Paytrail HMAC validation:', error);
    return false;
  }
}
