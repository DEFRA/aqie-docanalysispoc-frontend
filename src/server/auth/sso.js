import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

// This is a simplified SSO implementation
// In a real-world scenario, you would integrate with your organization's SSO provider
export const ssoAuth = {
  plugin: {
    name: 'ssoAuth',
    register: async (server) => {
      // Register the SSO authentication scheme
      server.auth.scheme('sso', (server, options) => {
        return {
          authenticate: async (request, h) => {
            // In a real implementation, this would validate tokens from your SSO provider
            // For this example, we're auto-authenticating all users
            
            // Check if user is already authenticated via cookie
            if (request.state['sso-session']) {
              try {
                // Parse the JSON string from the cookie
                const user = JSON.parse(request.state['sso-session']);
                return h.authenticated({ credentials: { user } });
              } catch (e) {
                // If parsing fails, clear the invalid cookie
                h.unstate('sso-session');
              }
            }
            
            // For demo purposes, auto-authenticate with a default user
            // In a real implementation, this would redirect to your SSO provider
            const user = {
              id: 'default-user',
              name: 'Default User',
              email: 'user@example.com',
              roles: ['user']
            }
            
            // Set the session cookie with stringified user object
            h.state('sso-session', JSON.stringify(user), {
              ttl: 24 * 60 * 60 * 1000, // 24 hours
              isSecure: config.get('isProduction'),
              path: '/'
            })
            
            return h.authenticated({ credentials: { user } })
          }
        }
      })
      
      // Register the SSO strategy
      server.auth.strategy('sso', 'sso', {})
      
      // Set as default authentication strategy
      server.auth.default('sso')
      
      // Add logout route
      server.route({
        method: 'GET',
        path: '/logout',
        handler: (request, h) => {
          // Clear the SSO session cookie
          h.unstate('sso-session')
          
          // In a real implementation, you might need to call your SSO provider's logout endpoint
          logger.info('User logged out')
          
          return h.redirect('/')
        },
        options: {
          auth: false
        }
      })
    }
  }
}