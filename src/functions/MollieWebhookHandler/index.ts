// src/MollieWebhookHandler/index.ts
import { app } from "@azure/functions";
import type { HttpRequest, InvocationContext } from "@azure/functions";
import {  createMollieClient, type Payment, PaymentStatus } from "@mollie/api-client";

// Mollie webhook response interface
interface MollieWebhookPayload {
  id: string;
}

// Initialize Mollie client with API key
const initMollieClient = () => {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error("MOLLIE_API_KEY environment variable is not set");
  }
  return createMollieClient({ apiKey });
};

// Process different payment statuses
const processPaymentStatus = (payment: Payment): void => {
  const paymentId = payment.id;
  const status = payment.status;

  switch (status) {
    case PaymentStatus.paid:
      // Handle successful payment
      console.log(`Payment ${paymentId} was paid`);
      // Here you would update your database, mark subscription as active, etc.
      break;
    case PaymentStatus.failed:
      // Handle failed payment
      console.log(`Payment ${paymentId} failed`);
      // Here you could notify the customer or retry the payment
      break;
    case PaymentStatus.expired:
      // Handle expired payment
      console.log(`Payment ${paymentId} expired`);
      // You might want to create a new payment or notify the customer
      break;
    case PaymentStatus.canceled:
      // Handle canceled payment
      console.log(`Payment ${paymentId} was canceled`);
      // Update subscription status or take appropriate action
      break;
    default:
      // Handle other statuses
      console.log(`Payment ${paymentId} has status: ${status}`);
      // Take appropriate action based on the status
      break;
  }
};

// The actual Azure Function handler
export async function MollieWebhookHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<any> {
  context.log("Mollie webhook function processed a request");

  try {
    // const payload = req.body as MollieWebhookPayload;
    
    // if (!payload || !payload.id) {
    //   context.res = {
    //     status: 400,
    //     body: { message: "Invalid webhook payload" }
    //   };
    //   return;
    // }

    // const paymentId = payload.id;
    // const mollieClient = initMollieClient();

    // // Get the payment details from Mollie
    // const payment = await mollieClient.payments.get(paymentId);
    
    // // Process the payment status
    // processPaymentStatus(payment);

    // Always respond with 200 OK to Mollie
    return {
      status: 200,
      body: { received: true }
    };
  } catch (error) {
    context.error(error);
    return {
      status: 500,
      body: { message: "Internal server error" }
    };
  }
};

app.http('molliewebhookhandler', {
    route: 'hello/world',
    handler: MollieWebhookHandler,
    authLevel: 'anonymous'
});