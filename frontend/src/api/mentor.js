import api from './client'

export function sendMentorMessage(message, history = []) {
  return api.post('/api/mentor/chat', { message, history: history.slice(-12) })
}
