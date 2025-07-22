import Hapi from '@hapi/hapi';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import path from 'path';
import { fileURLToPath } from 'url';
import { staticFiles } from './plugins/static-files.js';
import { health } from './plugins/health.js';
import { configPlugin } from './plugins/config.js';
import { config } from './config/config.js';
import { upload } from './server/upload/index.js';
import { home } from './server/home/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const init = async () => {
  // Create Hapi server
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    routes: {
      files: {
        relativeTo: path.join(__dirname, '../public')
      },
      state: {
        parse: false,
        failAction: 'ignore'
      },
      cors: {
        origin: ['*'],
        credentials: true,
        additionalHeaders: ['cache-control', 'x-requested-with']
      }
    }
  });
  
  // Store config in server app object for access in routes
  server.app.config = config;
  
  // For debugging
  server.events.on('response', (request) => {
    console.log(`${request.info.remoteAddress}: ${request.method.toUpperCase()} ${request.path} --> ${request.response.statusCode}`);
  });

  // Register plugins
  await server.register(Inert);
  await server.register(Vision);
  await server.register(configPlugin);
  await server.register(staticFiles);
  await server.register(health);
  await server.register(home);
  await server.register(upload);
  
  // Configure Nunjucks
  // Import nunjucks dynamically
  const nunjucks = await import('nunjucks');
  
  server.views({
    engines: {
      njk: {
        compile: (src, options) => {
          const template = nunjucks.default.compile(src, options.environment);
          return (context) => {
            return template.render({
              ...context,
              serviceName: 'Defra Policy Summarisation (POC)',
              serviceUrl: '/',
              breadcrumbs: [{ text: 'Home', href: '/' }]
            });
          };
        }
      }
    },
    path: [
      path.join(__dirname, 'server'),
      path.join(__dirname, 'server/common/templates'),
      path.join(__dirname, 'server/common/components'),
      path.join(__dirname, 'server/home'),
      'node_modules/govuk-frontend/dist'
    ],
    relativeTo: __dirname,
    compileOptions: {
      environment: nunjucks.default.configure([
        path.join(__dirname, 'server'),
        path.join(__dirname, 'server/common/templates'),
        path.join(__dirname, 'server/common/components'),
        path.join(__dirname, 'server/home'),
        'node_modules/govuk-frontend/dist'
      ], {
        autoescape: true,
        watch: false
      })
    }
  });
  
  // Add route to expose backend URL as environment variable
  server.route({
    method: 'GET',
    path: '/config.js',
    handler: (request, h) => {
      const backendUrl = config.get('backend.url');
      return h.response(`window.process = { env: { BACKEND_URL: "${backendUrl}" } };`)
        .type('application/javascript');
    }
  });

  // JavaScript and stylesheet files are handled by the staticFiles plugin
  
  // Static files are handled by the staticFiles plugin
  
  // Root path is handled by home plugin

  // Start the server
  await server.start();
  console.log(`Frontend server running at: ${server.info.uri}`);
};

init();