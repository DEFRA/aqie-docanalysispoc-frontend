// Upload functionality
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('policyPdf');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const uploadForm = document.getElementById('uploadForm');
  const submitButton = document.getElementById('submitButton');
  const loadingMessage = document.getElementById('loadingMessage');
  const feedbackArea = document.getElementById('feedbackArea');
  const fileSpinner = document.getElementById('fileSpinner');
  
  // When the file input changes (user selects a file)
  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) {
        // Show spinner while "processing" the file
        if (fileSpinner) {
          fileSpinner.style.display = 'inline-block';
        }
        
        // Simulate a delay for file processing
        setTimeout(function() {
          // Hide spinner after "processing"
          if (fileSpinner) {
            fileSpinner.style.display = 'none';
          }
          
          // Show file info
          if (fileInfo && fileName) {
            fileInfo.style.display = 'block';
            fileName.textContent = fileInput.files[0].name;
          }
        }, 500);
      } else {
        // No file selected
        if (fileInfo) {
          fileInfo.style.display = 'none';
        }
        if (fileName) {
          fileName.textContent = '';
        }
      }
    });
  }
});