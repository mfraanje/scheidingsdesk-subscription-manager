import { app } from "@azure/functions";
import type { InvocationContext, Timer } from "@azure/functions";
import createMollieClient, { SubscriptionStatus } from '@mollie/api-client'; // Import SubscriptionStatus
import type { DynamicsWebApi } from "dynamics-web-api";

// --- Environment Variables (Keep as they are) ---
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY as string;
const entityName = process.env.ENTITY_NAME || "accounts";
const entityNameSingular = process.env.ENTITY_NAME_SINGULAR || "account";
const clientIdField = process.env.CLIENT_ID_FIELD || "mollie_customer_id"; // Field that stores the Mollie customer ID
const subscriptionField = process.env.SUBSCRIPTION_FIELD || "subscription";
const subscriptionIdField = process.env.SUBSCRIPTION_ID_FIELD || "subscriptionId";


async function syncDataverseSubscriptionStatus(context: InvocationContext) {
    context.log('syncDataverseSubscriptionStatus function started');

    if (!MOLLIE_API_KEY) {
        context.error("MOLLIE_API_KEY environment variable is not set.");
        return; // Exit if Mollie key is missing
    }

    let dynamicsWebApi: DynamicsWebApi;
    try {
        // 1. Initialize Dataverse Context
        dynamicsWebApi = await initializeContext(context);
    } catch (error) {
        context.error("Failed to initialize Dataverse context:", error);
        return; // Exit if Dataverse connection fails
    }

    const mollieClient = createMollieClient({ apiKey: MOLLIE_API_KEY });
    const actualPrimaryKeyFieldName = `${entityNameSingular}id`; // Standard convention for the GUID field

    try {
        context.log(`Workspaceing records from Dataverse entity: ${entityName}`);

        // 2. Fetch Records from Dataverse that have a Subscription ID
        // Select the actual primary key (GUID) and the subscription ID field
        // Filter for records where the subscription ID field is not null
        const retrieveOptions = {
            collection: entityName,
            select: [actualPrimaryKeyFieldName, subscriptionIdField],
            filter: `${subscriptionIdField} ne null`,
        };

        // Handle potential pagination if you have many records
        let records: any[] = [];
        let result = await dynamicsWebApi.retrieveMultiple(retrieveOptions);
        records = records.concat(result.value);

        while (result["@odata.nextLink"]) {
            context.log("Fetching next page of Dataverse records...");
            result = await dynamicsWebApi.retrieveMultiple(retrieveOptions, result["@odata.nextLink"]);
            records = records.concat(result.value);
        }

        context.log(`Retrieved ${records.length} records from Dataverse with a subscription ID.`);

        // 3. Iterate through Dataverse Records and Check Mollie Status
        for (const record of records) {
            const recordGuid = record[actualPrimaryKeyFieldName];
            const mollieSubscriptionId = record[subscriptionIdField];
            const customerSubscriptionId = record[clientIdField];


            if (!recordGuid || !mollieSubscriptionId) {
                context.warn(`Skipping record due to missing GUID or Subscription ID. GUID: ${recordGuid}, Subscription ID: ${mollieSubscriptionId}`);
                continue;
            }

            context.log(`Processing record GUID: ${recordGuid}, Mollie Subscription ID: ${mollieSubscriptionId}`);

            try {
                // 4. Get Subscription Status from Mollie
                const mollieSubscription = await mollieClient.customerSubscriptions.get(mollieSubscriptionId, { customerId: customerSubscriptionId });

                // 5. Determine desired Dataverse status
                const isMollieActive = mollieSubscription.status === SubscriptionStatus.active;
                context.log(`Mollie subscription ${mollieSubscriptionId} status: ${mollieSubscription.status}. Setting Dataverse status to: ${isMollieActive}`);

                // 6. Update Dataverse Record
                const updateData: Record<string, unknown> = {};
                updateData[subscriptionField] = isMollieActive; // Set boolean field

                await dynamicsWebApi.update({
                    collection: entityName,
                    key: recordGuid, // Use the actual GUID
                    data: updateData
                });
                context.log(`Successfully updated Dataverse record ${recordGuid}`);

            } catch (mollieError: any) {
                 // Handle cases where the subscription might not exist in Mollie anymore
                 if (mollieError?.statusCode === 404) {
                     context.warn(`Subscription ${mollieSubscriptionId} not found in Mollie for Dataverse record ${recordGuid}. Setting status to false.`);
                     // Update Dataverse record to inactive if subscription doesn't exist in Mollie
                     const updateData: Record<string, unknown> = {};
                     updateData[subscriptionField] = false;
                     try {
                        await dynamicsWebApi.update({
                            collection: entityName,
                            key: recordGuid,
                            data: updateData
                        });
                        context.log(`Set Dataverse record ${recordGuid} subscription status to false as Mollie subscription was not found.`);
                     } catch (updateError) {
                        context.error(`Failed to update Dataverse record ${recordGuid} after Mollie 404 error:`, updateError);
                     }
                 } else {
                    context.error(`Error processing Mollie subscription ${mollieSubscriptionId} for Dataverse record ${recordGuid}:`, mollieError);
                    // Decide if you want to skip this record or stop the process
                 }
            }
        }

        context.log('syncDataverseSubscriptionStatus function finished successfully.');

    } catch (error) {
        context.error('Error during syncDataverseSubscriptionStatus execution:', error);
    }
}

// --- Register the Timer Function ---
app.timer('syncDataverseSubscriptionStatus', {
  schedule: '0 */5 * * * *', // Changed to every 5 minutes - adjust as needed
  runOnStartup: true,        // Set to false if you don't want it to run immediately on deploy/restart
  handler: async () => {syncDataverseSubscriptionStatus},
});
function initializeContext(context: InvocationContext): DynamicsWebApi | PromiseLike<DynamicsWebApi> {
    throw new Error("Function not implemented.");
}

