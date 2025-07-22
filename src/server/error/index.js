import { createLogger } from '../common/helpers/logging/logger.js'

const logger = createLogger()

export const errorPages = {
  plugin: {
    name: 'errorPages',
    register: async (server) => {
      // Make sure these routes are registered before authentication
      server.route([
        {
          method: 'GET',
          path: '/error/401',
          handler: (request, h) => {
            logger.info('Unauthorized access attempt')
            return h.view('error/401', {
              pageTitle: 'Unauthorized Access',
              serviceName: 'Defra Policy Summarisation (POC)',
              isAuthenticated: false
            }).code(401)
          },
          options: {
            auth: false
          }
        }
      ])
    }
  }
}