/**
 * Progress controller that simulates processing and redirects back with analysis
 */
export const progressController = {
  handler(request, h) {
    console.log('Processing document...');
    
    // Get the analysis from the session
    const analysis = request.yar.get('analysis');
    
    // Simulate processing delay
    setTimeout(() => {
      // In a real application, this would be handled with WebSockets or polling
      console.log('Processing complete');
    }, 2000);
    
    // For this example, we'll immediately redirect back with the analysis
    // In a real app, you might want to show a progress page with updates
    if (analysis) {
      return h.redirect(`/upload?analysis=${encodeURIComponent(analysis)}`);
    }
    
    return h.view('progress/index', {
      pageTitle: 'Processing Document',
      heading: 'Processing Your Document'
    });
  }
}
