/**
 * Sets up the routes used in the home page.
 * These routes are registered in src/server/router.js.
 */
export const progress = {
  plugin: {
    name: 'progress',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/progress',
          handler: (request, h) => {
            console.log('inside progress handler')
            const file = request.query.file
            console.log('file:', file)
            return h.view('progress/index', { file })
          },
          options: { auth: { strategy: 'login', mode: 'required' } }
        }
      ])
    }
  }
}
