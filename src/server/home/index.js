import { createLogger } from '../common/helpers/logging/logger.js'
import os from 'os';
import nodeFetch from 'node-fetch';

const logger = createLogger()

export const home = {
  plugin: {
    name: 'home',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/',
          handler: (request, h) => {
            return h.view('home/index', {
              isAuthenticated: false,
              user: null,
              status: null
            })
          }
        },
        {
          method: 'POST',
          path: '/',
          options: {
            payload: {
              output: 'stream',
              parse: true,
              multipart: true,
              maxBytes: 50 * 1024 * 1024, // 50MB limit
              allow: 'multipart/form-data'
            }
          },
          handler: async (request, h) => {
            const { payload } = request
            const file = payload?.policyPdf
            
            if (!file || file.hapi.headers['content-type'] !== 'application/pdf') {
              return h.view('home/index', {
                isAuthenticated: false,
                user: null,
                status: 'error',
                message: 'Please upload a PDF file.'
              })
            }
            
            // Convert the file stream to a buffer
            const chunks = []
            for await (const chunk of file) {
              chunks.push(chunk)
            }
            const buffer = Buffer.concat(chunks)
            
            // Import modules
            const FormData = await import('form-data');
            const fs = await import('fs');
            const osModule = await import('os');
            const path = await import('path');
            
            // Create temp file path
            const tempDir = osModule.default.tmpdir();
            const tempFilePath = path.default.join(tempDir, `upload-${Date.now()}.pdf`);
            
            try {
              // Make API call to backend
              const backendUrl = server.app.config.get('backend.url')
              const endpoint = server.app.config.get('backend.endpoint')
              console.log('Backend URL from config:', backendUrl)
              console.log('Backend endpoint from config:', endpoint)
              
              // Write buffer to temp file
              await fs.default.promises.writeFile(tempFilePath, buffer);
              
              // Create form data with file
              const formData = new FormData.default();
              formData.append('file', fs.default.createReadStream(tempFilePath), {
                filename: file.hapi.filename,
                contentType: 'application/pdf'
              })
              
              // Log the URL for debugging
              const apiUrl = `${backendUrl}${endpoint}`;
              console.log('Sending request to:', apiUrl);
              
              const response = await nodeFetch(apiUrl, {
                method: 'POST',
                body: formData,
                headers: formData.getHeaders()
              })
              
              if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
              }
              
              const data = await response.json()
              
              // Clean up temp file
              try {
                await fs.default.promises.unlink(tempFilePath)
              } catch (e) {
                console.error('Error deleting temp file:', e)
              }
              
              return h.view('home/index', {
                isAuthenticated: false,
                user: null,
                status: 'success',
                markdownContent: data.summary,
                filename: file.hapi.filename
              })
            } catch (error) {
              // Clean up temp file if it exists
              try {
                await fs.default.promises.unlink(tempFilePath)
              } catch (e) {
                console.error('Error deleting temp file:', e)
              }
              
              logger.error(`Error processing document: ${error.message}`)
              console.error('Full error:', error)
              
              // Try to get response text if available
              let errorMessage = error.message
              if (error.response) {
                try {
                  const errorText = await error.response.text()
                  errorMessage = `${error.message}: ${errorText}`
                } catch (e) {
                  // Ignore error in getting response text
                }
              }
              
              return h.view('home/index', {
                isAuthenticated: false,
                user: null,
                status: 'error',
                message: `Error processing PDF: ${errorMessage}`
              })
            }
          }
        },
        {
          method: 'GET',
          path: '/check-backend',
          handler: async (request, h) => {
            try {
              const backendUrl = server.app.config.get('backend.url')
              const testEndpoint = server.app.config.get('backend.testEndpoint')
              const testUrl = `${backendUrl}${testEndpoint}`
              console.log('Checking backend at:', testUrl)
              
              const response = await nodeFetch(testUrl, {
                method: 'GET'
              })
              
              const status = response.ok ? 'OK' : 'Error'
              const statusCode = response.status
              const responseText = await response.text()
              
              return h.response({
                status,
                statusCode,
                backendUrl,
                testUrl,
                responseText
              })
            } catch (error) {
              console.error('Error checking backend:', error)
              return h.response({
                status: 'Error',
                message: error.message,
                backendUrl: server.app.config.get('backend.url')
              }).code(500)
            }
          }
        }
      ])
    }
  }
}