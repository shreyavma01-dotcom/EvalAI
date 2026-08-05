import apiClient from './apiClient'

/**
 * Auth API service. Tokens are stored in localStorage (Bearer header) while
 * the backend also sets an httpOnly cookie as a fallback. /me hydrates the
 * session on app load.
 */
export const authApi = {
  register: ({ name, email, password, confirmPassword, role }) =>
    apiClient.post('/auth/register', { name, email, password, confirmPassword, role }).then((r) => r.data.data),

  login: ({ email, password, remember = false }) =>
    apiClient.post('/auth/login', { email, password, remember }).then((r) => r.data.data),

  logout: () => apiClient.post('/auth/logout').then((r) => r.data.data),

  me: () => apiClient.get('/auth/me').then((r) => r.data.data),

  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }).then((r) => r.data.data),

  resetPassword: ({ token, password }) =>
    apiClient.post('/auth/reset-password', { token, password }).then((r) => r.data.data),
}

export default authApi
