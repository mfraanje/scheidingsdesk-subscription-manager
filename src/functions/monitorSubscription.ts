import { app } from "@azure/functions";
import createMollieClient, { SequenceType } from '@mollie/api-client';

const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY as string;

async function monitorSubscription() {
  console.log('monitorSubscription function started');
  const mollieClient = createMollieClient({ apiKey: MOLLIE_API_KEY });

  try {
    const subscriptionsawait = await mollieClient.subscription.page();
    for (const subscription of subscriptionsawait) {
      console.log(subscription);
    }
  } catch (error) {
    console.error('Error in monitorSubscription function:', error);
  }
}

// Register the function with Azure Functions
app.timer('monitorSubscription', {
  schedule: '0 0 7 * * *',
  handler: monitorSubscription
});