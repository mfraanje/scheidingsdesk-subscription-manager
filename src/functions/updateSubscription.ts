import {app} from "@azure/functions";
import type { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

//Webhook for mollie
async function updateSubscription(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(request.body);
    return {
        status: 200,
        jsonBody: { message: "Subscription updated successfully", requestBody: request.body }
    };
}

// Register the function with Azure Functions
app.http('updateSubscription', {
    methods: ['POST'],
    route: 'subscription/update/payments/webhook',
    authLevel: 'anonymous',
    handler: updateSubscription
});