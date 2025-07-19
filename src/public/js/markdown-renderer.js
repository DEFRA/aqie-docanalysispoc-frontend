// Markdown renderer for analysis results
document.addEventListener('DOMContentLoaded', function() {
  const markdownContent = document.getElementById('markdownContent');
  const markdownRenderer = document.getElementById('markdownRenderer');
  
  // Function to render markdown content
  window.renderMarkdown = function(content) {
    if (!content) return;
    
    // Display the markdown container
    markdownContent.style.display = 'block';
    
    // Render the markdown content
    markdownRenderer.innerHTML = marked.parse(content);
    
    // Add syntax highlighting if needed
    if (window.hljs) {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
      });
    }
    
    // Render any tables nicely
    document.querySelectorAll('table').forEach((table) => {
      table.classList.add('govuk-table');
      table.querySelectorAll('thead').forEach((thead) => {
        thead.classList.add('govuk-table__head');
      });
      table.querySelectorAll('tbody').forEach((tbody) => {
        tbody.classList.add('govuk-table__body');
      });
      table.querySelectorAll('th').forEach((th) => {
        th.classList.add('govuk-table__header');
      });
      table.querySelectorAll('td').forEach((td) => {
        td.classList.add('govuk-table__cell');
      });
    });
  };
});