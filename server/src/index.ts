import express from 'express'
import cors from 'cors'
import {
  buildSystemPrompt,
  buildMessages,
  streamLLM,
  type Participant,
  type MeetingInfo,
  type HistoryMessage,
} from './llm.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

interface ChatRequestBody {
  userMessage: string
  participants: Participant[]
  meetingInfo: MeetingInfo
  history: HistoryMessage[]
}

app.post('/api/chat/stream', async (req, res) => {
  const { userMessage, participants, meetingInfo, history } = req.body as ChatRequestBody

  const aiParticipants = (participants || []).filter((p) => !p.isUser)

  // Build full history including the user's new message
  const fullHistory: HistoryMessage[] = [
    ...(history || []),
    {
      senderId: 'user',
      senderName: '你',
      title: '产品经理',
      content: userMessage,
      isUser: true,
    },
  ]

  // SSE headers to prevent buffering by proxies
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Content-Encoding': 'none',
  })

  // Send an initial comment to establish the connection
  res.write(': connected\n\n')

  let currentHistory = [...fullHistory]
  let hasError = false

  // Heartbeat to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': hb\n\n')
    }
  }, 10000)

  for (const participant of aiParticipants) {
    if (res.writableEnded) break

    // Notify: this participant is starting
    res.write(
      `data: ${JSON.stringify({
        type: 'participant_start',
        participantId: participant.id,
        participantName: participant.name,
        participantTitle: participant.title,
        avatarColor: participant.avatarColor,
      })}\n\n`,
    )

    const systemPrompt = buildSystemPrompt(participant, meetingInfo, participants)
    const messages = buildMessages(systemPrompt, currentHistory)

    let fullContent = ''

    try {
      for await (const chunk of streamLLM(messages)) {
        if (res.writableEnded) break
        fullContent += chunk
        res.write(
          `data: ${JSON.stringify({
            type: 'delta',
            participantId: participant.id,
            content: chunk,
          })}\n\n`,
        )
      }
    } catch (err: any) {
      console.error('LLM error:', err)
      hasError = true
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: `AI 生成失败: ${err.message || '未知错误'}`,
          })}\n\n`,
        )
      }
      break
    }

    if (res.writableEnded) break

    // Notify: this participant finished
    res.write(
      `data: ${JSON.stringify({
        type: 'participant_end',
        participantId: participant.id,
        participantName: participant.name,
        participantTitle: participant.title,
        content: fullContent,
      })}\n\n`,
    )

    // Add this participant's response to history for the next participant
    currentHistory.push({
      senderId: participant.id,
      senderName: participant.name,
      title: participant.title,
      content: fullContent,
      isUser: false,
    })
  }

  clearInterval(heartbeat)

  if (!res.writableEnded) {
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Meeting sim server running on http://localhost:${PORT}`)
})
