import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { getWindowsUsername } from '../utils/windowsUser.js'
import { getMicrosoftAccountInfo } from '../utils/msAccountInfo.js'

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

            // Try to get Microsoft account information first
            const msAccountInfo = getMicrosoftAccountInfo(request);
            logger.info(`Microsoft account info: ${JSON.stringify(msAccountInfo)}`);
            
            // Get allowed domains from config
            const allowedDomains = config.get('auth.allowedDomains');
            const isProduction = config.get('isProduction');
            
            let username, email, domain, isAllowedUser;
            
            // If we have Microsoft account information, use it
            if (msAccountInfo && msAccountInfo.email) {
              email = msAccountInfo.email;
              username = email.split('@')[0];
              domain = email.split('@')[1];
              
              // Check if email domain is allowed
              const emailDomain = domain.toLowerCase();
              const isAllowedEmailDomain = allowedDomains.some(allowedDomain => 
                emailDomain.endsWith(allowedDomain.toLowerCase())
              );
              
              isAllowedUser = isProduction ? true : isAllowedEmailDomain;
              
              logger.info(`Using Microsoft account: ${email}, Domain: ${domain}, Allowed: ${isAllowedUser}`);
            } else {
              // Fall back to Windows username
              username = getWindowsUsername();
              
              // Extract domain from Windows username if available
              domain = '';
              if (username.includes('\\')) {
                domain = username.split('\\')[0].toLowerCase();
              }
              
              // Check if domain is in the allowed domains list
              const isAllowedDomain = domain ? allowedDomains.some(allowedDomain =>
                domain.toLowerCase() === allowedDomain.toLowerCase()
              ) : false;
              
              isAllowedUser = isProduction ?
                (username && username !== 'unknown') :
                (isAllowedDomain || username === 'unknown');
              
              // Create email with domain
              const emailDomain = 'defra.gov.uk';
              email = `${username}@${emailDomain}`;
              
              logger.info(`Using Windows username: ${username}, Domain: ${domain}, Allowed: ${isAllowedUser}`);
            }

           
            if (!isAllowedUser) {
              logger.warn(`Unauthorized access attempt by: ${username} from domain: ${domain}`);
              // Use a direct response instead of redirect
              return h.view('error/401', {
                pageTitle: 'Unauthorized Access',
                serviceName: 'Defra Policy Summarisation (POC)',
                allowedDomains: allowedDomains.join(', ')
              }).code(401).takeover();
            }

            // Format display name
            let displayName;
            
            if (msAccountInfo && msAccountInfo.name) {
              // Use Microsoft account display name if available
              displayName = msAccountInfo.name;
            } else {
              // Format Windows username for display
              displayName = username;
              if (displayName.includes('\\')) {
                displayName = displayName.split('\\').pop();
              }
              
              displayName = displayName.split(/[\s_-]+/).map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ');
            }
            
            // Create user object
            const user = {
              id: msAccountInfo?.id || username,
              name: displayName,
              email: email,
              source: msAccountInfo ? 'microsoft-account' : 'windows-user',
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