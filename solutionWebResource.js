/**
 * Power App Authentication Web Resource
 * This web resource makes an API call on Power App startup to determine user access.
 */

// Define the main function that will be called from Power Apps
function checkUserAccess(context) {
    // Return a promise to handle the asynchronous API call
    return new Promise((resolve, reject) => {
        // Get the current user's information from context
        const userId = context.parameters.userId.raw || "";
        const apiEndpoint = context.parameters.apiEndpoint.raw || "";
        const apiKey = context.parameters.apiKey.raw || "";
        
        // Create the request options
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        };
        
        // Add query parameters if needed
        const queryUrl = `${apiEndpoint}?userId=${encodeURIComponent(userId)}`;
        
        // Make the API call
        fetch(queryUrl, requestOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Determine if user has access based on API response
                // This assumes the API returns an object with hasAccess property
                const hasAccess = data.hasAccess === true;
                
                // Return the result to Power Apps
                resolve({
                    hasAccess: hasAccess,
                    errorMessage: hasAccess ? "" : (data.message || "Access denied"),
                    userData: data.userData || {}
                });
            })
            .catch(error => {
                console.error("Error checking user access:", error);
                
                // Return error information to Power Apps
                resolve({
                    hasAccess: false,
                    errorMessage: `Failed to check access: ${error.message}`,
                    userData: {}
                });
            });
    });
}

// PCF Component definition to expose the function to Power Apps
const PowerAppAuth = {
    getMetadata: () => {
        return {
            boundParameter: null,
            parameterTypes: {
                userId: {
                    typeName: "string",
                    description: "Current user ID"
                },
                apiEndpoint: {
                    typeName: "string",
                    description: "API endpoint URL"
                },
                apiKey: {
                    typeName: "string",
                    description: "API key or token for authentication"
                }
            },
            outputs: [
                {
                    outputName: "hasAccess",
                    outputType: "boolean"
                },
                {
                    outputName: "errorMessage",
                    outputType: "string"
                },
                {
                    outputName: "userData",
                    outputType: "object"
                }
            ]
        };
    },
    
    execute: (context) => {
        return checkUserAccess(context);
    }
};