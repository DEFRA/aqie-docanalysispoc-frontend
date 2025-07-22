import { createLogger } from './logging/logger.js'

const logger = createLogger()

export const headerLogger = {
  plugin: {
    name: 'headerLogger',
    register: async (server) => {
      server.ext('onRequest', (request, h) => {
        // Log all headers for debugging
        logger.info(`Request headers: ${JSON.stringify(request.headers)}`)
        return h.continue
      })
    }
  }
}