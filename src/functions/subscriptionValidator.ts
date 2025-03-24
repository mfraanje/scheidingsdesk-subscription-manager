import { app } from "@azure/functions";
import type { HttpRequest, InvocationContext } from "@azure/functions";

export async function subscriptionValidator(
    req: HttpRequest,
    context: InvocationContext
): Promise<any> {
    context.log(req.body);
    return {
        body: { subscription: true }
    };
}

app.http('subscriptionvalidator', {
    route: 'subscription/validator',
    handler: subscriptionValidator,
    authLevel: 'anonymous'
});