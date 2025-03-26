function validate(executionContext) {

    function checkAccess(executionContext) {
    // Show loading message
        const formContext = executionContext.getFormContext();
        Xrm.Utility.showProgressIndicator("Checking access...");
        
        try {        
            // API endpoint with user ID as query param
            const apiEndpoint = "https://scheidingsdesktest.azurewebsites.net/api/subscription/validator";
            
            // Make the API call
            fetch(apiEndpoint, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                },
                credentials: 'include' 
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                Xrm.Utility.closeProgressIndicator();
                Xrm.Navigation.openAlertDialog({
                    text: `Hallo de data is: ${data}`,
                    title: "Hoi"
                });
                // If subscription is true, do nothing and allow app to continue loading
            })
            .catch(error => {
                console.error("Subscription check error:", error);
                Xrm.Utility.closeProgressIndicator();
                
                // Show error message
                Xrm.Navigation.openAlertDialog({
                    text: `Error checking subscription: ${error.message}`,
                    title: "Error"
                });
            });
        } catch (ex) {
            // Catch any synchronous errors
            Xrm.Utility.closeProgressIndicator();
            console.error("Exception in checkAccess:", ex);
            
            Xrm.Navigation.openAlertDialog({
                text: `Error initializing subscription check: ${ex.message}`,
                title: "Error"
            });
        }
    }
    checkAccess(executionContext);
}