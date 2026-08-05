import apiClient from './apiClient'

const unwrap = (promise) => promise.then((r) => r.data.data)

/**
 * Student-facing API — submissions, dashboard, results.
 */
export const studentApi = {
  dashboard: () => unwrap(apiClient.get('/student/dashboard')),

  submissions: ({ page = 1, limit = 10, search = '' } = {}) =>
    unwrap(apiClient.get('/student/submissions', { params: { page, limit, search } })),

  createSubmission: ({ subject, title, description, remarks, answerFiles, questionFiles }) => {
    const form = new FormData()
    form.append('subject', subject)
    form.append('title', title)
    if (description) form.append('description', description)
    if (remarks) form.append('remarks', remarks)
    for (const file of answerFiles ?? []) form.append('answerSheet', file)
    for (const file of questionFiles ?? []) form.append('questionPaper', file)
    return unwrap(
      apiClient.post('/student/submissions', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000,
      }),
    )
  },

  results: ({ page = 1, limit = 10, search = '' } = {}) =>
    unwrap(apiClient.get('/student/results', { params: { page, limit, search } })),

  result: (id) => unwrap(apiClient.get(`/student/results/${id}`)),
}

/**
 * Teacher-facing API — review queue, evaluation publishing, students.
 */
export const teacherApi = {
  dashboard: () => unwrap(apiClient.get('/teacher/dashboard')),

  submissions: ({ status = '', search = '', page = 1, limit = 10 } = {}) =>
    unwrap(apiClient.get('/teacher/submissions', { params: { status, search, page, limit } })),

  submission: (id) => unwrap(apiClient.get(`/teacher/submission/${id}`)),

  publishEvaluation: ({ id, marks, feedback, remarks }) =>
    unwrap(apiClient.put(`/teacher/evaluate/${id}`, { marks, feedback, remarks })),

  students: ({ search = '', page = 1, limit = 10 } = {}) =>
    unwrap(apiClient.get('/teacher/students', { params: { search, page, limit } })),

  analytics: () => unwrap(apiClient.get('/teacher/analytics')),
}

/**
 * Admin API.
 */
export const adminApi = {
  dashboard: () => unwrap(apiClient.get('/admin/dashboard')),
}

/**
 * Notifications API.
 */
export const notificationsApi = {
  list: () => unwrap(apiClient.get('/notifications')),
  markRead: (id) => unwrap(apiClient.put(`/notifications/read/${id}`)),
  markAllRead: () => unwrap(apiClient.put('/notifications/read-all')),
}

export default { studentApi, teacherApi, adminApi, notificationsApi }
