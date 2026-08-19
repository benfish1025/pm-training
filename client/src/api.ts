import type { Participant, MeetingInfo, ChatMessage } from './types'

export interface SSEEvent {
  type: 'participant_start' | 'delta' | 'participant_end' | 'done' | 'error'
  participantId?: string
  participantName?: string
  participantTitle?: string
  avatarColor?: string
  content?: string
  message?: string
}

export async function* streamChat(data: {
  speaker: Participant
  participants: Participant[]
  meetingInfo: MeetingInfo
  history: ChatMessage[]
}): AsyncGenerator<SSEEvent> {
  // Map ChatMessage[] to the format the server expects
  const history = data.history.map((m) => ({
    senderId: m.senderId,
    senderName: m.senderName,
    title: m.senderTitle,
    content: m.content,
    isUser: m.isUser,
  }))

  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      speaker: data.speaker,
      participants: data.participants,
      meetingInfo: data.meetingInfo,
      history,
    }),
  })

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith(':')) continue
      if (!trimmed.startsWith('data: ')) continue

      const dataStr = trimmed.slice(6)
      try {
        const json = JSON.parse(dataStr) as SSEEvent
        yield json
      } catch {
        // ignore parse errors
      }
    }
  }
}
