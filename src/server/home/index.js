import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

export const home = {
  plugin: {
    name: 'home',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/',
          handler: (request, h) => {
            // Get user info from credentials
            const user = request.auth.credentials.user
            // Redirect directly to upload page
            return h.redirect('/upload')
          },
          options: {
            auth: 'sso'
          }
        }
      ])
    }
  }
}