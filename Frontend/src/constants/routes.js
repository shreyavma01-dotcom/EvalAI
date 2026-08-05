export const ROUTES = {
  root: '/',
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  studentDashboard: '/student/dashboard',
  studentSubmit: '/student/submit',
  studentResults: '/student/results',
  studentResult: '/student/results/submission/:id',
  teacherDashboard: '/teacher/dashboard',
  teacherSubmissions: '/teacher/submissions',
  teacherSubmission: '/teacher/submission/:id',
  teacherAiEvaluation: '/teacher/ai-evaluation',
  teacherEvaluation: '/teacher/evaluation/:submissionId',
  teacherEvaluate: '/teacher/evaluate/:submissionId',
  teacherStudents: '/teacher/students',
  teacherReports: '/teacher/reports',
  teacherAnalytics: '/teacher/analytics',
  studentHistory: '/student/history',
  adminDashboard: '/admin/dashboard',
}

export function getRoute(path) {
  return ROUTES[path] ?? path
}