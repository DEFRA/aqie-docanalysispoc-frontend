import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * Gets Azure AD user information from request headers
 * @param {Object} request - Hapi request object
 * @returns {Object} Azure AD user information or null
 */
export function getAzureUserInfo(request) {
  // Log all headers for debugging
  logger.info(`Headers for Azure auth: ${JSON.stringify(request.headers)}`)
  
  const headers = request.headers || {}
  
  // Check for Azure AD headers
  const azureHeaders = {
    // Standard Azure AD headers
    name: headers['x-ms-client-display-name'] || 
          headers['x-ms-client-principal-name'] ||
          headers['x-ms-token-aad-name'],
    email: headers['x-ms-client-principal-name'] || 
           headers['x-ms-token-aad-preferred-username'] ||
           headers['x-ms-client-principal-id'],
    id: headers['x-ms-client-principal-id'] || 
        headers['x-ms-token-aad-oid']
  }
  
  // Check if we have any Azure AD information
  if (azureHeaders.email || azureHeaders.name || azureHeaders.id) {
    logger.info(`Found Azure AD user: ${JSON.stringify(azureHeaders)}`)
    return {
      name: azureHeaders.name || '',
      email: azureHeaders.email || '',
      id: azureHeaders.id || '',
      source: 'azure-ad'
    }
  }
  
  // Check for proxy headers that might contain Azure info
  if (headers['x-forwarded-user'] || headers['remote-user']) {
    const proxyUser = headers['x-forwarded-user'] || headers['remote-user']
    logger.info(`Found proxy user: ${proxyUser}`)
    
    // If it looks like an email, use it
    if (proxyUser && proxyUser.includes('@')) {
      const [username, domain] = proxyUser.split('@')
      return {
        name: username,
        email: proxyUser,
        id: proxyUser,
        source: 'proxy-headers'
      }
    }
  }
  
  // For production, provide a default Azure user
  if (process.env.NODE_ENV === 'production') {
    logger.info('Using default Azure user for production')
    return {
      name: 'Defra User',
      email: 'defra.user@defra.gov.uk',
      id: 'defra-user',
      source: 'default-production'
    }
  }
  
  return null
}