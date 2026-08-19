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
  // 当前需要发言的 AI 参与者（一次请求只生成一个人的回复）
  speaker: Participant
  participants: Participant[]
  meetingInfo: MeetingInfo
  history: HistoryMessage[]
}

app.post('/api/chat/stream', async (req, res) => {
  const { speaker, participants, meetingInfo, history } = req.body as ChatRequestBody

  // SSE headers to prevent buffering by proxies
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })

  // Send an initial comment to establish the connection
  res.write(': connected\n\n')

  // Track client disconnect so we can stop generating early
  let aborted = false
  res.on('close', () => {
    aborted = true
  })

  // Heartbeat to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(': hb\n\n')
    }
  }, 10000)

  const send = (payload: Record<string, unknown>) => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
    }
  }

  // Notify: this speaker is starting
  send({
    type: 'participant_start',
    participantId: speaker.id,
    participantName: speaker.name,
    participantTitle: speaker.title,
    avatarColor: speaker.avatarColor,
  })

  const systemPrompt = buildSystemPrompt(speaker, meetingInfo, participants)
  const messages = buildMessages(systemPrompt, history || [])

  let fullContent = ''

  try {
    for await (const chunk of streamLLM(messages)) {
      if (aborted || res.destroyed) break
      fullContent += chunk
      send({
        type: 'delta',
        participantId: speaker.id,
        content: chunk,
      })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '未知错误'
    console.error('LLM error:', message)
    send({
      type: 'error',
      message: `AI 生成失败: ${message}`,
    })
  }

  clearInterval(heartbeat)

  if (!res.writableEnded && !res.destroyed) {
    // Notify: this speaker finished
    send({
      type: 'participant_end',
      participantId: speaker.id,
      participantName: speaker.name,
      participantTitle: speaker.title,
      content: fullContent,
    })
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
