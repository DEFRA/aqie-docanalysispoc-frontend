import './server.js'

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
  process.exit(1)
})
