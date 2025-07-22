// Markdown renderer functionality
document.addEventListener('DOMContentLoaded', function() {
  // If there's markdown content in the page, render it
  const markdownContent = document.getElementById('markdownContent');
  const markdownRenderer = document.getElementById('markdownRenderer');
  
  if (markdownContent && markdownRenderer && window.marked) {
    // Apply GOV.UK styling to tables
    document.querySelectorAll('#markdownRenderer table').forEach((table) => {
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
  }
});