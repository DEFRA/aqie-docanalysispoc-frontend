import inert from '@hapi/inert'
import { about } from './about/index.js'
import { health } from './health/index.js'
import { login } from './login/index.js'
import { upload } from './upload/index.js'
import { dashboard } from './dashboard/index.js'
import { progress } from './progress/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Application specific routes, add your own routes here
      await server.register([login, upload, dashboard, progress, about])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
