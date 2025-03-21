import logging
import azure.functions as func
import json


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Python HTTP trigger function processed a Mollie webhook request.")

    try:
        # Get the request body (Mollie sends payment data as JSON)
        req_body = req.get_json()

        # Log the payment ID received from Mollie
        payment_id = req_body.get("id")
        logging.info(f"Received webhook for payment ID: {payment_id}")

        # At this point, you would typically:
        # 1. Verify the payment with Mollie API
        # 2. Update your database with the payment status
        # 3. Handle subscription logic

        # For this basic version, we'll just log the data and return success
        logging.info(f"Payment data received: {json.dumps(req_body)}")

        # Return a success response (Mollie expects a 200 OK response)
        return func.HttpResponse("Webhook received successfully", status_code=200)

    except Exception as e:
        # Log any errors
        logging.error(f"Error processing Mollie webhook: {str(e)}.")

        # Return an error response
        return func.HttpResponse(f"Error processing webhook: {str(e)}", status_code=500)
