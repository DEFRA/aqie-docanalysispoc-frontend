import inert from '@hapi/inert'
import { health } from './health/index.js'
import { upload } from './upload/index.js'
import { ssoAuth } from './auth/sso.js'
import { home } from './home/index.js'
import { errorPages } from './error/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])
      await server.register([health])
      await server.register([errorPages])
      await server.register([ssoAuth])
      await server.register([home, upload])
      await server.register([serveStaticFiles])
    }
  }
}
