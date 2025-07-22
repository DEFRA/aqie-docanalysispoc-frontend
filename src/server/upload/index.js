import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import util from 'util'
import { parsePdfToJson } from '../utils/pdfParser.js'
import { config } from '../../config/config.js'
import OpenAI from 'openai'
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
          options: { auth: 'sso' },
          handler: (request, h) => {
            const user = request.auth.credentials.user
            return h.view('upload/index', {
              isAuthenticated: true,
              user: user,
              status: null
            })
          }
        },
        {
          method: 'POST',
          path: '/upload',
          options: {
            auth: 'sso',
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
            if (
              !file ||
              file.hapi.headers['content-type'] !== 'application/pdf'
            ) {
              return h.view('upload/index', {
                isAuthenticated: true,
                user: request.auth.credentials.user,
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

              const apiUrl = config.get('aiOpenApiUrl')
              const apiKey = config.get('aiOpenApiKey')
              
              // Convert PDF text to a string for the API call
              const pdfTextContent = pdfText
                .map(page => page.content)
                .join('\n\n')
              
              try {
                // Initialize the OpenAI client with Azure configuration
                const openai = new OpenAI({
                  apiKey: apiKey,
                  baseURL: `${apiUrl}openai/deployments/gpt-4`,
                  defaultQuery: { 'api-version': '2023-07-01-preview' },
                  defaultHeaders: { 'api-key': apiKey }
                })
                
                // Create completion using the OpenAI client
                const completion = await openai.chat.completions.create({
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
                  model: 'gpt-4',
                  temperature: 0.7,
                  max_tokens: 4000
                })
                
                const summary = completion.choices[0].message.content
                
                // Return the view with both summary and markdown content
                return h.view('upload/index', {
                  isAuthenticated: true,
                  user: request.auth.credentials.user,
                  status: 'success',
                  markdownContent: summary,
                  filename: file.hapi.filename
                })
              } catch (apiError) {
                logger.error(`OpenAI API error: ${apiError.message}`)
                if (apiError.status) {
                  logger.error(`Status: ${apiError.status}`)
                }
                if (apiError.error) {
                  logger.error(`Error details: ${JSON.stringify(apiError.error)}`)
                }
                
                // Return the view with just the markdown content
                return h.view('upload/index', {
                  isAuthenticated: true,
                  user: request.auth.credentials.user,
                  status: 'success',
                  markdownContent: 'Unable to generate summary. Using raw document content instead.',
                  filename: file.hapi.filename
                })
              }
            } catch (error) {
              logger.error(`Error while parsing PDF: ${error}`)
              logger.error(
                `JSON Error while parsing PDF: ${JSON.stringify(error)}`
              )
              return h.view('upload/index', {
                isAuthenticated: true,
                user: request.auth.credentials.user,
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
