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

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  let currentHistory = [...fullHistory]

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
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: `AI 生成失败: ${err.message}`,
        })}\n\n`,
      )
      break
    }

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

  res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
  res.end()
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Meeting sim server running on http://localhost:${PORT}`)
})
