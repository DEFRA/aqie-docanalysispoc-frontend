/**
 * Sets up the routes used in the home page.
 * These routes are registered in src/server/router.js.
 */
export const dashboard = {
  plugin: {
    name: 'dashboard',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/dashboard',
          handler: (request, h) => {
            return h.view('dashboard/index')
          },
          options: { auth: { strategy: 'login', mode: 'required' } }
        }
      ])
    }
  }
}
