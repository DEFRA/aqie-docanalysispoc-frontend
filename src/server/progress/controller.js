/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 */
export const progressController = {
  handler(_request, h) {
    console.log('inside progress controller')
    return h.view('progress/index', {
      pageTitle: 'Progress',
      heading: 'Progress'
    })
  }
}
