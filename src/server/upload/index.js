import { createLogger } from '../../server/common/helpers/logging/logger.js'

const logger = createLogger()

export const upload = {
  plugin: {
    name: 'upload',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/upload',
          handler: (request, h) => {
            return h.view('upload/index', {
              isAuthenticated: false,
              user: null,
              status: null
            })
          }
        },
        {
          method: 'POST',
          path: '/upload',
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
              return h.view('upload/index', {
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
            
            try {
              // Make API call to backend
              const backendUrl = server.app.config.get('backend.url')
              const formData = new FormData()
              const blob = new Blob([buffer], { type: 'application/pdf' })
              formData.append('file', blob, file.hapi.filename)
              
              const response = await fetch(`${backendUrl}/api/documents/summarize`, {
                method: 'POST',
                body: formData
              })
              
              if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
              }
              
              const data = await response.json()
              
              return h.view('upload/index', {
                isAuthenticated: false,
                user: null,
                status: 'success',
                markdownContent: data.summary,
                filename: file.hapi.filename
              })
            } catch (error) {
              logger.error(`Error processing document: ${error.message}`)
              return h.view('upload/index', {
                isAuthenticated: false,
                user: null,
                status: 'error',
                message: `Error processing PDF: ${error.message}`
              })
            }
          }
        }
      ])
    }
  }
}
