import { config } from '../config/config.js';

const configPlugin = {
  plugin: {
    name: 'config',
    register: async (server) => {
      // Make config available to all handlers
      server.decorate('server', 'config', config);
      server.decorate('request', 'config', config);
    }
  }
};

export { configPlugin };