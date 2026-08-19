import { useRef, useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { streamChat } from '../api'
import type { Participant, MeetingInfo, ChatMessage } from '../types'

interface Props {
  participants: Participant[]
  meetingInfo: MeetingInfo
  messages: ChatMessage[]
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
  onExit: () => void
}

export function MeetingRoom({ participants, meetingInfo, messages, setMessages, onExit }: Props) {
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingParticipantId, setStreamingParticipantId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const aiParticipants = participants.filter((p) => !p.isUser)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [isStreaming])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `msg${Date.now()}_user`,
      senderId: 'user',
      senderName: '我',
      senderTitle: '产品经理',
      content: trimmed,
      isUser: true,
      isStreaming: false,
      timestamp: Date.now(),
      avatarColor: 'bg-arcoblue-6 text-white',
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    // 本地维护完整历史，逐个参与者单独请求，避免单条 SSE 连接
    // 持续时间过长被云端网关中断（ERR_INCOMPLETE_CHUNKED_ENCODING）
    let history: ChatMessage[] = [...messages, userMessage]
    let hasError = false

    for (const p of aiParticipants) {
      if (hasError) break

      const msgId = `msg${Date.now()}_${p.id}_${Math.random().toString(36).slice(2, 7)}`
      setMessages((prev) => [
        ...prev,
        {
          id: msgId,
          senderId: p.id,
          senderName: p.name,
          senderTitle: p.title,
          content: '',
          isUser: false,
          isStreaming: true,
          timestamp: Date.now(),
          avatarColor: p.avatarColor,
        },
      ])
      setStreamingParticipantId(p.id)

      let content = ''
      try {
        const stream = streamChat({
          speaker: p,
          participants,
          meetingInfo,
          history,
        })

        for await (const event of stream) {
          if (event.type === 'delta' && event.content) {
            content += event.content
            const snapshot = content
            setMessages((prev) =>
              prev.map((m) => (m.id === msgId ? { ...m, content: snapshot } : m)),
            )
          } else if (event.type === 'error') {
            console.error('SSE error:', event.message)
          }
        }
      } catch (err) {
        console.error('Stream error:', err)
        hasError = true
      }

      if (content) {
        const finalMsg: ChatMessage = {
          id: msgId,
          senderId: p.id,
          senderName: p.name,
          senderTitle: p.title,
          content,
          isUser: false,
          isStreaming: false,
          timestamp: Date.now(),
          avatarColor: p.avatarColor,
        }
        setMessages((prev) => prev.map((m) => (m.id === msgId ? finalMsg : m)))
        history = [...history, finalMsg]
      } else {
        // 没有生成任何内容则移除占位消息，避免空气泡
        setMessages((prev) => prev.filter((m) => m.id !== msgId))
      }
      setStreamingParticipantId(null)
    }

    setIsStreaming(false)
    setStreamingParticipantId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      {/* Meeting header */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-arco-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="font-medium text-arco-10 truncate">
              {meetingInfo.topic || '未命名会议'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
              {participants.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 text-xs text-arco-6 shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-arco-4" />
                  {p.name}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onExit}
            className="ml-3 px-3 py-1.5 text-sm text-arco-6 border border-arco-3 rounded-arco hover:bg-arco-1 shrink-0 transition-colors"
          >
            退出会议
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-full bg-arcoblue-1 text-arcoblue-5 flex items-center justify-center text-2xl mb-4">
              💬
            </div>
            <h3 className="text-base font-medium text-arco-8">会议已准备就绪</h3>
            <p className="text-arco-5 mt-1 max-w-sm text-sm">
              在下方输入框中开始你的发言，参会人员将轮流回应。
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-md">
              {aiParticipants.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-arco-3 rounded-full text-xs text-arco-7"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-arco-4" />
                  {p.name}（{p.title}）
                </span>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            formatTime={formatTime}
          />
        ))}

        {/* Typing indicator for participant that started but has no content yet */}
        {isStreaming && streamingParticipantId && (() => {
          const msg = messages.find(
            (m) => m.senderId === streamingParticipantId && m.isStreaming,
          )
          if (msg && !msg.content) {
            return <TypingIndicator message={msg} />
          }
          return null
        })()}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 sm:px-6 py-3 bg-white border-t border-arco-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={isStreaming ? '参会人员正在发言中...' : '输入你的发言（Enter 发送，Shift+Enter 换行）'}
            rows={1}
            className="flex-1 px-4 py-2.5 border border-arco-3 rounded-arco-lg resize-none focus:border-arcoblue-5 focus:outline-none focus:ring-2 focus:ring-arcoblue-1 transition-colors max-h-32 disabled:bg-arco-1 disabled:text-arco-4"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={`px-5 py-2.5 rounded-arco-lg font-medium shrink-0 transition-all ${
              !input.trim() || isStreaming
                ? 'bg-arco-2 text-arco-4 cursor-not-allowed'
                : 'bg-arcoblue-6 text-white hover:bg-arcoblue-5 cursor-pointer'
            }`}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  formatTime,
}: {
  message: ChatMessage
  formatTime: (ts: number) => string
}) {
  const isUser = message.isUser

  if (isUser) {
    return (
      <div className="flex flex-col items-end animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-arco-5">{formatTime(message.timestamp)}</span>
          <span className="text-xs font-medium text-arco-7">
            {message.senderName}（{message.senderTitle}）
          </span>
        </div>
        <div className="max-w-[80%] px-4 py-2.5 bg-arcoblue-6 text-white rounded-arco-lg rounded-tr-sm">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`w-7 h-7 rounded-full ${message.avatarColor} flex items-center justify-center text-xs font-medium shrink-0`}
        >
          {message.senderName[0] || '?'}
        </div>
        <span className="text-xs font-medium text-arco-7">
          {message.senderName}（{message.senderTitle}）
        </span>
        <span className="text-xs text-arco-5">{formatTime(message.timestamp)}</span>
      </div>
      <div className="ml-9 max-w-[80%] px-4 py-2.5 bg-white border border-arco-3 rounded-arco-lg rounded-tl-sm">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-arco-8">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-arcoblue-4 animate-pulse align-middle" />
          )}
        </p>
      </div>
    </div>
  )
}

function TypingIndicator({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col items-start animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`w-7 h-7 rounded-full ${message.avatarColor} flex items-center justify-center text-xs font-medium shrink-0`}
        >
          {message.senderName[0] || '?'}
        </div>
        <span className="text-xs font-medium text-arco-7">
          {message.senderName}（{message.senderTitle}）
        </span>
      </div>
      <div className="ml-9 px-4 py-3 bg-white border border-arco-3 rounded-arco-lg rounded-tl-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-arco-4 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-arco-4 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-arco-4 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
