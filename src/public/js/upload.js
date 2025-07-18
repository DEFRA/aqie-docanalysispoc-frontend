/* global alert */
document.addEventListener('DOMContentLoaded', function () {
  const fileInput = document.getElementById('policyPdf')
  const fileInfo = document.getElementById('fileInfo')
  const fileNameSpan = document.getElementById('fileName')

  fileInput.addEventListener('change', function () {
    if (
      fileInput.files.length &&
      fileInput.files[0].type === 'application/pdf'
    ) {
      fileInfo.style.display = 'block'
      fileNameSpan.textContent = fileInput.files[0].name
    } else {
      fileInfo.style.display = 'none'
      fileNameSpan.textContent = ''
      alert('Please upload a PDF file.')
    }
  })
})
