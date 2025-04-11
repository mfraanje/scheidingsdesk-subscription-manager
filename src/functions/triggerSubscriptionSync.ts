import { app } from "@azure/functions";
import axios from "axios";

const recurringPaymentWebhook = process.env.RECURRING_PAYMENT_WEBHOOK as string;

async function triggerSubscriptionSync() {
    try {
        await axios.post(recurringPaymentWebhook, {
            source: 'timer-trigger'
        });
    } catch (error) {
        console.error('Error during syncDataverseSubscriptionStatus execution:', error);
    }
}

// --- Register the Timer Function ---
app.timer('triggerSubscriptionSync', {
  schedule: '0 */1 * * * *', 
  runOnStartup: true,        // Set to false if you don't want it to run immediately on deploy/restart
  handler: triggerSubscriptionSync,
});
