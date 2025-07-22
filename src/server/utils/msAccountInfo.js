/**
 * Gets Microsoft account information from request headers
 * @param {Object} request - Hapi request object
 * @returns {Object} Microsoft account information
 */
export function getMicrosoftAccountInfo(request) {
  // Check for Microsoft account headers
  // These headers might be set by a reverse proxy or authentication middleware
  const msHeaders = {
    email: request.headers['x-ms-client-principal-name'] || 
           request.headers['x-ms-client-email'] ||
           request.headers['x-ms-client-principal-id'],
    name: request.headers['x-ms-client-display-name'] || 
          request.headers['x-ms-client-name'],
    id: request.headers['x-ms-client-principal-id'] || 
        request.headers['x-ms-client-id']
  };
  
  // Check if we have any Microsoft account information
  const hasMsInfo = msHeaders.email || msHeaders.name || msHeaders.id;
  
  if (hasMsInfo) {
    return {
      email: msHeaders.email || '',
      name: msHeaders.name || '',
      id: msHeaders.id || '',
      source: 'microsoft-account'
    };
  }
  
  // Check for Azure AD headers
  const azureAdHeaders = {
    email: request.headers['x-ms-token-aad-preferred-username'] ||
           request.headers['x-ms-token-aad-email'],
    name: request.headers['x-ms-token-aad-name'] ||
          request.headers['x-ms-token-aad-given-name'],
    id: request.headers['x-ms-token-aad-oid']
  };
  
  const hasAzureAdInfo = azureAdHeaders.email || azureAdHeaders.name || azureAdHeaders.id;
  
  if (hasAzureAdInfo) {
    return {
      email: azureAdHeaders.email || '',
      name: azureAdHeaders.name || '',
      id: azureAdHeaders.id || '',
      source: 'azure-ad'
    };
  }
  
  // No Microsoft account information found
  return null;
}