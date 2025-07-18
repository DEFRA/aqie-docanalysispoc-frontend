import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import util from 'util'

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
              maxBytes: 10 * 1024 * 1024, // 10MB limit
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
            // Redirect to progress page with filename
            return h.redirect(`/progress?file=${encodeURIComponent(filename)}`)
          }
        }
      ])
    }
  }
}
