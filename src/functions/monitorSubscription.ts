import {app} from "@azure/functions";
import type { InvocationContext, Timer } from "@azure/functions";
import createMollieClient, { SequenceType } from '@mollie/api-client';

const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY as string;

async function monitorSubscription(context: InvocationContext) {
  context.info('monitorSubscription function started');
  const mollieClient = createMollieClient({ apiKey: MOLLIE_API_KEY });

  try {
    const subscriptionsawait = await mollieClient.subscription.page();
    for (const subscription of subscriptionsawait) {
      context.info(subscription);
    }
  } catch (error) {
    context.error('Error in monitorSubscription function:', error);
  }
}

// Register the function with Azure Functions
app.timer('monitorSubscription', {
  schedule: '0 */1 * * * *',
  runOnStartup: true,
  handler: async (myTimer: Timer) => {monitorSubscription}
});