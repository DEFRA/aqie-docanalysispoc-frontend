// Client-side JavaScript for handling file uploads and API calls

document.addEventListener('DOMContentLoaded', function () {
  const fileInput = document.getElementById('policyPdf')
  const fileInfo = document.getElementById('fileInfo')
  const fileNameSpan = document.getElementById('fileName')
  const uploadForm = document.getElementById('uploadForm')
  const fileSpinner = document.getElementById('fileSpinner')
  const markdownContent = document.getElementById('markdownContent')
  const markdownRenderer = document.getElementById('markdownRenderer')
  const loadingMessage = document.getElementById('loadingMessage')
  const feedbackArea = document.getElementById('feedbackArea')
  
  // Backend API URL - can be configured via environment variable
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
  
  // When the file input changes (user selects a file)
  fileInput.addEventListener('change', function () {
    // Show spinner immediately when a file is selected
    if (fileInput.files.length > 0) {
      // Show spinner and wait cursor
      fileSpinner.style.display = 'inline-block'
      document.body.style.cursor = 'wait'

      // Simulate a delay for file processing
      setTimeout(function () {
        // Hide spinner after "processing"
        fileSpinner.style.display = 'none'
        document.body.style.cursor = 'default'

        // Now show the file info
        if (fileInput.files[0].type === 'application/pdf') {
          fileInfo.style.display = 'block'
          fileNameSpan.textContent = fileInput.files[0].name
          // Hide any previous analysis results
          markdownContent.style.display = 'none'
        } else {
          fileInfo.style.display = 'none'
          fileNameSpan.textContent = ''
          feedbackArea.innerHTML = '<div class="govuk-error-summary">Please select a PDF file.</div>'
        }
      }, 500)
    } else {
      // No file was selected
      fileInfo.style.display = 'none'
      fileNameSpan.textContent = ''
    }
  })

  // Handle form submission
  uploadForm.addEventListener('submit', async function (event) {
    event.preventDefault() // Prevent default form submission
    
    if (fileInput.files.length && fileInput.files[0].type === 'application/pdf') {
      // Clear previous markdown content
      if (markdownContent) {
        markdownContent.style.display = 'none'
        if (markdownRenderer) {
          markdownRenderer.innerHTML = ''
        }
      }
      
      // Show loading message
      if (loadingMessage) {
        loadingMessage.style.display = 'block'
      }
      
      document.body.style.cursor = 'wait'

      const submitButton = uploadForm.querySelector('button[type="submit"]')
      if (submitButton) {
        submitButton.disabled = true
      }
      
      try {
        // Create FormData object to send the file
        const formData = new FormData()
        formData.append('file', fileInput.files[0])
        
        // Send the file to the backend API
        const response = await fetch(`${backendUrl}/api/documents/summarize`, {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Hide loading message
        if (loadingMessage) {
          loadingMessage.style.display = 'none'
        }
        
        // Render the markdown content
        if (data.summary) {
          markdownContent.style.display = 'block'
          markdownRenderer.innerHTML = window.marked.parse(data.summary)
          
          // Apply GOV.UK styling to tables
          document.querySelectorAll('#markdownRenderer table').forEach((table) => {
            table.classList.add('govuk-table')
            table.querySelectorAll('thead').forEach((thead) => {
              thead.classList.add('govuk-table__head')
            })
            table.querySelectorAll('tbody').forEach((tbody) => {
              tbody.classList.add('govuk-table__body')
            })
            table.querySelectorAll('th').forEach((th) => {
              th.classList.add('govuk-table__header')
            })
            table.querySelectorAll('td').forEach((td) => {
              td.classList.add('govuk-table__cell')
            })
          })
        } else {
          throw new Error('No summary received from server')
        }
      } catch (error) {
        console.error('Error processing PDF:', error)
        
        // Hide loading message
        if (loadingMessage) {
          loadingMessage.style.display = 'none'
        }
        
        // Show error message
        feedbackArea.innerHTML = `<div class="govuk-error-summary">Error processing PDF: ${error.message}</div>`
      } finally {
        // Reset UI state
        document.body.style.cursor = 'default'
        if (submitButton) {
          submitButton.disabled = false
        }
      }
    } else {
      feedbackArea.innerHTML = '<div class="govuk-error-summary">Please select a PDF file.</div>'
    }
  })
})