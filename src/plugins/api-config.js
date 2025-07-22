const apiConfig = {
  plugin: {
    name: 'apiConfig',
    register: async (server) => {
      server.route({
        method: 'GET',
        path: '/api/config',
        handler: (request, h) => {
          return {
            backendUrl: server.config.get('backend.url')
          };
        }
      });
    }
  }
};

export { apiConfig };