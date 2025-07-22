import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { getWindowsUsername } from '../utils/windowsUser.js'

const logger = createLogger()

// This is a simplified SSO implementation
// In a real-world scenario, you would integrate with your organization's SSO provider
export const ssoAuth = {
  plugin: {
    name: 'ssoAuth',
    register: async (server) => {
      server.auth.scheme('sso', (server, options) => {
        return {
          authenticate: async (request, h) => {
            if (request.state['sso-session']) {
              try {
                const user = JSON.parse(request.state['sso-session']);
                return h.authenticated({ credentials: { user } });
              } catch (e) {
                h.unstate('sso-session');
              }
            }
            
            const username = getWindowsUsername();

            // Get allowed domains from config
            const allowedDomains = config.get('auth.allowedDomains');
            
            // Extract domain from Windows username if available
            let domain = '';
            if (username.includes('\\')) {
              domain = username.split('\\')[0].toLowerCase();
            }
            
            // Check if domain is in the allowed domains list
            const isAllowedDomain = allowedDomains.some(allowedDomain => 
              domain.toLowerCase() === allowedDomain.toLowerCase()
            );
            
            // For development environments, allow 'unknown' username
            const isDev = !config.get('isProduction');
            const isAllowedUser = isAllowedDomain || (isDev && username === 'unknown');
            
            const emailDomain = 'defra.gov.uk';
            const email = `${username}@${emailDomain}`;
            
            // Log authentication attempt
            logger.info(`Authentication attempt: ${username}, Domain: ${domain}, Allowed: ${isAllowedUser}`);
            
            if (!isAllowedUser) {
              logger.warn(`Unauthorized access attempt by: ${username} from domain: ${domain}`);
              // Use a direct response instead of redirect
              return h.view('error/401', {
                pageTitle: 'Unauthorized Access',
                serviceName: 'Defra Policy Summarisation (POC)',
                allowedDomains: allowedDomains.join(', ')
              }).code(401).takeover();
            }
            
            // Format Windows username for display (capitalize and remove domain if present)
            let displayName = username;
            if (displayName.includes('\\')) {
              displayName = displayName.split('\\').pop();
            }
            
            displayName = displayName.split(/[\s_-]+/).map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            
            // Create user object with Windows username
            const user = {
              id: username,
              name: displayName,
              email: email,
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
      
      server.auth.strategy('sso', 'sso', {})
      server.auth.default('sso')
      
      // Add logout route
      server.route({
        method: 'GET',
        path: '/logout',
        handler: (request, h) => {
          h.unstate('sso-session')
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