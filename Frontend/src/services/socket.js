import { io } from 'socket.io-client'

let socket = null

/**
 * Lazily connects to the backend socket server (proxied through Vite in dev).
 */
export function getSocket() {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
  }
  return socket
}

export function joinEvaluationRoom(evaluationId) {
  const s = getSocket()
  s.emit('join:evaluation', evaluationId)
  return s
}

export function leaveEvaluationRoom(evaluationId) {
  if (!socket) return
  socket.emit('leave:evaluation', evaluationId)
}

export function disconnectSocket() {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}

export default getSocket
