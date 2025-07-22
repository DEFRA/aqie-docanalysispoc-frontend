import Inert from '@hapi/inert';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const staticFiles = {
  plugin: {
    name: 'staticFiles',
    register: async (server) => {
      // Serve static files from the public directory
      server.route({
        method: 'GET',
        path: '/public/{param*}',
        handler: {
          directory: {
            path: './public',
            redirectToSlash: true,
            index: true
          }
        }
      });
      
      // Serve static files directly from root
      server.route({
        method: 'GET',
        path: '/{filename}.{ext}',
        handler: {
          directory: {
            path: './public',
            redirectToSlash: false
          }
        }
      });
    }
  }
};

export { staticFiles };