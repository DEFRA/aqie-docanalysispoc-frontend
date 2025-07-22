const health = {
  plugin: {
    name: 'health',
    register: async (server) => {
      server.route({
        method: 'GET',
        path: '/health',
        handler: (request, h) => {
          return {
            status: 'ok',
            timestamp: new Date().toISOString()
          };
        }
      });
    }
  }
};

export { health };