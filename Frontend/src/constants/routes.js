export const ROUTES = {
  landing: '/landing',
  dashboard: '/',
  assignments: '/assignments',
  assignmentDetail: '/assignments/:id',
  students: '/students',
  teachers: '/teachers',
  evaluation: '/evaluation',
  history: '/evaluation/history',
  historyDetail: '/evaluation/history/:id',
  analytics: '/analytics',
  reports: '/reports',
  notifications: '/notifications',
  settings: '/settings',
  profile: '/profile',
  designSystem: '/design-system',
}

export function getRoute(path) {
  return ROUTES[path] ?? path
}