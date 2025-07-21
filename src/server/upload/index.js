import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import util from 'util'
import { parsePdfToJson } from '../utils/pdfParser.js'

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
            return h.view('upload/index', { status: null })
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

              const pdfText = await parsePdfToJson(filepath);
              await fs.unlinkSync(filepath);

                         

              let markdownContent = ''
              if (pdfText && Array.isArray(pdfText)) {
                markdownContent = pdfText
                  .map((page) => {
                    return `## Page ${page.pageNumber}\n\n${page.content}`
                  })
                  .join('\n\n')
              }

              // Return the view with the markdown content
              return h.view('upload/index', {
                status: 'success',
                markdownContent: markdownContent,
                filename: file.hapi.filename
              })
            } catch (error) {
              console.error('Error parsing PDF:', error)
              return h.view('upload/index', {
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
