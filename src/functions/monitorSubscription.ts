import { app } from "@azure/functions";
import createMollieClient, { SubscriptionStatus } from '@mollie/api-client'; // Import SubscriptionStatus
import { getClientDataFromDataverse, updateDataverseSubscription } from "../services/dataverseService";

// --- Environment Variables (Keep as they are) ---
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY as string;
const entityName = process.env.ENTITY_NAME || "accounts";
const entityNameSingular = process.env.ENTITY_NAME_SINGULAR || "account";
const clientIdField = process.env.CLIENT_ID_FIELD || "mollie_customer_id"; // Field that stores the Mollie customer ID
const subscriptionField = process.env.SUBSCRIPTION_FIELD || "subscription";
const subscriptionIdField = process.env.SUBSCRIPTION_ID_FIELD || "subscriptionId";


async function syncDataverseSubscriptionStatus() {
    console.log('syncDataverseSubscriptionStatus function started');

    if (!MOLLIE_API_KEY) {
        console.error("MOLLIE_API_KEY environment variable is not set.");
        return; // Exit if Mollie key is missing
    }

    const mollieClient = createMollieClient({ apiKey: MOLLIE_API_KEY });
    const actualPrimaryKeyFieldName = `${entityNameSingular}id`; // Standard convention for the GUID field

    try {
        const records = await getClientDataFromDataverse();

        // 3. Iterate through Dataverse Records and Check Mollie Status
        for (const record of records) {
            const recordGuid = record[actualPrimaryKeyFieldName];
            const mollieSubscriptionId = record[subscriptionIdField];
            const customerSubscriptionId = record[clientIdField];


            if (!recordGuid || !mollieSubscriptionId) {
                console.warn(`Skipping record due to missing GUID or Subscription ID. GUID: ${recordGuid}, Subscription ID: ${mollieSubscriptionId}`);
                continue;
            }

            console.log(`Processing record GUID: ${recordGuid}, Mollie Subscription ID: ${mollieSubscriptionId}`);

            try {
                // 4. Get Subscription Status from Mollie
                const mollieSubscription = await mollieClient.customerSubscriptions.get(mollieSubscriptionId, { customerId: customerSubscriptionId });

                // 5. Determine desired Dataverse status
                const isMollieActive = mollieSubscription.status === SubscriptionStatus.active;
                console.log(`Mollie subscription ${mollieSubscriptionId} status: ${mollieSubscription.status}. Setting Dataverse status to: ${isMollieActive}`);

                // 6. Update Dataverse Record
                const updateData: Record<string, unknown> = {};
                updateData[subscriptionField] = isMollieActive; // Set boolean field

                await updateDataverseSubscription(customerSubscriptionId, mollieSubscriptionId, isMollieActive);
                console.log(`Successfully updated Dataverse record ${recordGuid}`);

            } catch (mollieError: any) {
                 // Handle cases where the subscription might not exist in Mollie anymore
                 if (mollieError?.statusCode === 404) {
                     console.warn(`Subscription ${mollieSubscriptionId} not found in Mollie for Dataverse record ${recordGuid}. Setting status to false.`);
                     // Update Dataverse record to inactive if subscription doesn't exist in Mollie
                     const updateData: Record<string, unknown> = {};
                     updateData[subscriptionField] = false;
                     try {
                        await updateDataverseSubscription(customerSubscriptionId, mollieSubscriptionId, false);
                        console.log(`Set Dataverse record ${recordGuid} subscription status to false as Mollie subscription was not found.`);
                     } catch (updateError) {
                        console.error(`Failed to update Dataverse record ${recordGuid} after Mollie 404 error:`, updateError);
                     }
                 } else {
                    console.error(`Error processing Mollie subscription ${mollieSubscriptionId} for Dataverse record ${recordGuid}:`, mollieError);
                    // Decide if you want to skip this record or stop the process
                 }
            }
        }

        console.log('syncDataverseSubscriptionStatus function finished successfully.');

    } catch (error) {
        console.error('Error during syncDataverseSubscriptionStatus execution:', error);
    }
}

// --- Register the Timer Function ---
app.timer('syncDataverseSubscriptionStatus', {
  schedule: '0 */5 * * * *', // Changed to every 5 minutes - adjust as needed
  runOnStartup: true,        // Set to false if you don't want it to run immediately on deploy/restart
  handler: syncDataverseSubscriptionStatus,
});
