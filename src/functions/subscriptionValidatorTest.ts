import { app } from "@azure/functions";
import type { HttpRequest, InvocationContext } from "@azure/functions";

export async function subscriptionValidatorTest(
    req: HttpRequest,
    context: InvocationContext
): Promise<any> {
    context.log(req.body);
    return {
        status: 200,
        body: { subscription: false }
    };
}

app.http('subscriptionvalidatortest', {
    route: 'subscription/validatortest',
    handler: subscriptionValidatorTest,
    authLevel: 'anonymous'
});