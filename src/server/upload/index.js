import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import util from 'util'
import { parsePdfToJson } from '../utils/pdfParser.js'
import { config } from '../../config/config.js'
import axios from 'axios'
import { createLogger } from '../../server/common/helpers/logging/logger.js'

const logger = createLogger()
const pump = util.promisify(pipeline)

export const upload = {
  plugin: {
    name: 'upload',
    register: async (server) => {
      server.route([
        {
          method: 'GET',
          path: '/upload',
          options: { auth: { strategy: 'login', mode: 'required' } },
          handler: (request, h) => {
            return h.view('upload/index', {
              isAuthenticated: request.auth.isAuthenticated,
              status: null
            })
          }
        },
        {
          method: 'POST',
          path: '/upload',
          options: {
            auth: { strategy: 'login', mode: 'required' },
            payload: {
              output: 'stream',
              parse: true,
              multipart: true,
              maxBytes: 50 * 1024 * 1024, // 10MB limit
              allow: 'multipart/form-data'
            }
          },
          handler: async (request, h) => {
            const { payload } = request
            const file = payload?.policyPdf
            if (
              !file ||
              file.hapi.headers['content-type'] !== 'application/pdf'
            ) {
              return h.view('upload/index', {
                isAuthenticated: request.auth.isAuthenticated,
                status: 'error',
                message: 'Please upload a PDF file.'
              })
            }
            const uploadDir = path.join(process.cwd(), 'uploads')
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)
            const filename = `${Date.now()}-${file.hapi.filename}`
            const filepath = path.join(uploadDir, filename)
            await pump(file, fs.createWriteStream(filepath))

            try {
              const pdfText = await parsePdfToJson(filepath)
              await fs.unlinkSync(filepath)

              let markdownContent = ''
             
              const apiUrl = config.get('aiOpenApiUrl')
              const openAiEndpoint = `${apiUrl}openai/deployments/gpt-4/chat/completions?api-version=2023-07-01-preview`
              
              const apiKey = config.get('aiOpenApiKey') // Store this securely
              
              // Convert PDF text to a string for the API call
              const pdfTextContent = pdfText
                .map(page => page.content)
                .join('\n\n')
                .substring(0, 4000) // Limit to 4000 chars to avoid token limits
              
              try {
                const response = await axios.post(
                  openAiEndpoint,
                  {
                    messages: [
                      {
                        role: 'system',
                        content: 'You are an assistant that summarizes policy documents.'
                      },
                      { 
                        role: 'user', 
                        content: `Summarize the following document in a concise way, highlighting the key points:\n\n${pdfTextContent}` 
                      }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                  },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      'api-key': apiKey
                    },
                    timeout: 60000
                  }
                )

                const summary = response.data.choices[0].message.content
                
                // Return the view with the markdown content
                return h.view('upload/index', {
                  isAuthenticated: request.auth.isAuthenticated,
                  status: 'success',
                  markdownContent: summary,
                  filename: file.hapi.filename
                })
              } catch (apiError) {
                logger.error(`OpenAI API error: ${apiError.message}`)
                if (apiError.response) {
                  logger.error(`Status: ${apiError.response.status}`)
                  logger.error(`Data: ${JSON.stringify(apiError.response.data)}`)
                }
                
                // Return the view with just the markdown content
                return h.view('upload/index', {
                  isAuthenticated: request.auth.isAuthenticated,
                  status: 'success',
                  markdownContent: markdownContent,
                  summary: 'Unable to generate summary. Using raw document content instead.',
                  filename: file.hapi.filename
                })
              }
            } catch (error) {
              logger.error(`Error while parsing PDF: ${error}`)
              logger.error(
                `JSON Error while parsing PDF: ${JSON.stringify(error)}`
              )
              return h.view('upload/index', {
                isAuthenticated: request.auth.isAuthenticated,
                status: 'error',
                message: 'Error processing PDF: ' + error.message
              })
            }
          }
        }
      ])
    }
  }
}
