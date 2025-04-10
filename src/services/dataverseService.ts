import type { InvocationContext } from "@azure/functions";
import { ClientSecretCredential } from "@azure/identity";
// import { updateProperty, WebApiConfig } from "dataverse-webapi";
import { DynamicsWebApi } from "dynamics-web-api";

const tenantId = process.env.TENANT_ID;
const appId = process.env.APPLICATION_ID;
const clientSecret = process.env.CLIENT_SECRET;
let dataverseUrl = process.env.DATAVERSE_URL; // e.g., https://yourorg.crm.dynamics.com
const entityName = process.env.ENTITY_NAME || "contacts"; // The table/entity name in Dataverse
const clientIdField = process.env.CLIENT_ID_FIELD || "mollie_customer_id"; // Field that will store the Mollie customer ID
const subscriptionField = process.env.SUBSCRIPTION_FIELD || "subscription"
const emailField = process.env.EMAIL_FIELD || "emailaddress1"; // Field that will store the email

interface Account {
    clientid?: string,
    email: string,
    subscription: boolean
}

export async function updateDataverseSubscription(customerId: string, status: boolean, context: InvocationContext) {


    if (!tenantId || !appId || !clientSecret || !dataverseUrl) {
        throw new Error("Missing required environment variables for Dataverse connection");
    }
    // If URL doesn't start with https://, add it
    if (!dataverseUrl.startsWith("https://")) {
        dataverseUrl = `https://${dataverseUrl}`;
    }
    
    // Make sure the URL is valid
    try {
        new URL(dataverseUrl);
    } catch (e) {
        context.error(`Invalid Dataverse URL format: ${dataverseUrl}`);
        throw new Error(`Invalid Dataverse URL: ${dataverseUrl}. Please provide a valid URL like "https://yourorg.crm.dynamics.com"`);
    }

    // Create the token acquisition function
    const acquireToken = async () => {
        try {
            const credential = new ClientSecretCredential(tenantId, appId, clientSecret);
            const tokenResponse = await credential.getToken(`${dataverseUrl}/.default`);
            return tokenResponse.token;
        } catch (error) {
            context.error("Error acquiring token:", error);
            throw error;
        }
    };

    // Initialize DynamicsWebApi with proper configuration
    const dynamicsWebApi = new DynamicsWebApi({
        serverUrl: dataverseUrl,
        onTokenRefresh: acquireToken
    }); 

    
        

    try {
        // const config = new WebApiConfig('9.1', dataverseUrl);

        // await updateProperty(config, entityName, 'test', subscriptionField, true)
        // .then(() => {
        //     // do something
        // }, (error: any) => {
        //     console.log(error);
        // });
        // First, find the contact by email
        const filter = `${clientIdField} eq '${customerId}'`;
        
        const searchResult = await dynamicsWebApi.retrieveMultiple({
            collection: entityName,
            select: [clientIdField], // Get the primary key of the entity
            filter: filter
        });
        
        // // Check if contact was found
        if (!searchResult.value || searchResult.value.length === 0) {
            context.log(`No contact found with id: ${customerId}`);
            throw new Error(`No contact found with id: ${customerId}`);
        }
        
        context.info(`List of contacts with id: ${searchResult.value}`);

        // // Get the record ID
        const recordId = searchResult.value[0].id || searchResult.value[0][`${entityName}id`];
        context.info(`Found contact with id: ${recordId}`);
        // Update the record with new subscription status and customer ID
        const updateData: Record<string, any> = {};
        updateData[subscriptionField] = status;
        
        // Update the record
        const updateResult = await dynamicsWebApi.update({
            collection: entityName,
            key: recordId,
            bypassCustomPluginExecution: true,
            data: updateData
        });
        
        context.log(`Successfully updated subscription status for contact with id: ${clientIdField}`);
        return updateResult;
    } catch (error) {
        context.error("Error updating record in Dataverse:", error);
        throw error;
    }  
}  


export async function writeCustomerToDataverse(customerId: string, email: string, context: InvocationContext) {
   

    if (!tenantId || !appId || !clientSecret || !dataverseUrl) {
        throw new Error("Missing required environment variables for Dataverse connection");
    }

    // If URL doesn't start with https://, add it
    if (!dataverseUrl.startsWith("https://")) {
        dataverseUrl = `https://${dataverseUrl}`;
    }
    
    // Make sure the URL is valid
    try {
        new URL(dataverseUrl);
    } catch (e) {
        context.error(`Invalid Dataverse URL format: ${dataverseUrl}`);
        throw new Error(`Invalid Dataverse URL: ${dataverseUrl}. Please provide a valid URL like "https://yourorg.crm.dynamics.com"`);
    }

    // Create the token acquisition function
    const acquireToken = async () => {
        try {
            const credential = new ClientSecretCredential(tenantId, appId, clientSecret);
            const tokenResponse = await credential.getToken(`${dataverseUrl}/.default`);
            return tokenResponse.token;
        } catch (error) {
            context.error("Error acquiring token:", error);
            throw error;
        }
    };

    // Initialize DynamicsWebApi with proper configuration
    const dynamicsWebApi = new DynamicsWebApi({
        serverUrl: dataverseUrl,
        onTokenRefresh: acquireToken,
    });

    try {
        // Prepare the record to be created in Dataverse
        const record: Record<string, any> = {};
        record[clientIdField] = customerId;
        record[emailField] = email;
        
        
        // Create the record in Dataverse
        const createResult = await dynamicsWebApi.create({
            collection: entityName,
            data: record
        });
        
        context.log(`Successfully created record in Dataverse with ID: ${createResult}`);
        return createResult;
    } catch (error) {
        context.error("Error creating record in Dataverse:", error);
        throw error;
    }
}