export function buildNavigation(request) {
  return [
    {
      text: 'Upload',
      href: '/upload',
      current: request?.path === '/upload'
    },
    {
      text: 'Dashboard',
      href: '/dashboard',
      current: request?.path === '/dashboard'
    },
    {
      text: 'Progress',
      href: '/progress',
      current: request?.path === '/progress'
    }
  ]
}
