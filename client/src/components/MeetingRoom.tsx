import { useRef, useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import { streamChat, type SSEEvent } from '../api'
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

    // Capture previous messages for history (server adds user message itself)
    const previousMessages = messages

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
      avatarColor: 'bg-brand-600',
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    try {
      const stream = streamChat({
        userMessage: trimmed,
        participants,
        meetingInfo,
        history: previousMessages,
      })

      for await (const event of stream) {
        handleSSEEvent(event)
      }
    } catch (err) {
      console.error('Stream error:', err)
    } finally {
      setIsStreaming(false)
      setStreamingParticipantId(null)
    }
  }

  const handleSSEEvent = (event: SSEEvent) => {
    switch (event.type) {
      case 'participant_start': {
        const newMsg: ChatMessage = {
          id: `msg${Date.now()}_${event.participantId}`,
          senderId: event.participantId!,
          senderName: event.participantName!,
          senderTitle: event.participantTitle!,
          content: '',
          isUser: false,
          isStreaming: true,
          timestamp: Date.now(),
          avatarColor: event.avatarColor || 'bg-gray-500',
        }
        setMessages((prev) => [...prev, newMsg])
        setStreamingParticipantId(event.participantId!)
        break
      }
      case 'delta': {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === event.participantId && m.isStreaming
              ? { ...m, content: m.content + (event.content || '') }
              : m,
          ),
        )
        break
      }
      case 'participant_end': {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === event.participantId && m.isStreaming
              ? { ...m, isStreaming: false, content: event.content || m.content }
              : m,
          ),
        )
        setStreamingParticipantId(null)
        break
      }
      case 'error': {
        console.error('SSE error:', event.message)
        break
      }
    }
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
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-gray-900 truncate">
              {meetingInfo.topic || '未命名会议'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
              {participants.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 shrink-0"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${p.avatarColor}`}
                  />
                  {p.name}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onExit}
            className="ml-3 px-3 py-1.5 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 shrink-0"
          >
            退出会议
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-2xl mb-4">
              💬
            </div>
            <h3 className="text-lg font-semibold text-gray-700">会议已准备就绪</h3>
            <p className="text-gray-400 mt-1 max-w-sm">
              在下方输入框中开始你的发言，参会人员将轮流回应。
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-md">
              {aiParticipants.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                >
                  <span className={`w-2 h-2 rounded-full ${p.avatarColor}`} />
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
      <div className="px-4 sm:px-6 py-3 bg-white border-t border-gray-200 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={isStreaming ? '参会人员正在发言中...' : '输入你的发言（Enter 发送，Shift+Enter 换行）'}
            rows={1}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl resize-none focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors max-h-32 disabled:bg-gray-50 disabled:text-gray-400"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className={`px-5 py-2.5 rounded-xl font-medium shrink-0 transition-all ${
              !input.trim() || isStreaming
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-brand-600 text-white hover:bg-brand-700 cursor-pointer'
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
          <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
          <span className="text-xs font-medium text-gray-600">
            {message.senderName}（{message.senderTitle}）
          </span>
        </div>
        <div className="max-w-[80%] px-4 py-2.5 bg-brand-600 text-white rounded-2xl rounded-tr-sm">
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
          className={`w-7 h-7 rounded-full ${message.avatarColor} text-white flex items-center justify-center text-xs font-semibold shrink-0`}
        >
          {message.senderName[0] || '?'}
        </div>
        <span className="text-xs font-medium text-gray-600">
          {message.senderName}（{message.senderTitle}）
        </span>
        <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
      </div>
      <div className="ml-9 max-w-[80%] px-4 py-2.5 bg-white border border-gray-200 rounded-2xl rounded-tl-sm">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-brand-500 animate-pulse align-middle" />
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
          className={`w-7 h-7 rounded-full ${message.avatarColor} text-white flex items-center justify-center text-xs font-semibold shrink-0`}
        >
          {message.senderName[0] || '?'}
        </div>
        <span className="text-xs font-medium text-gray-600">
          {message.senderName}（{message.senderTitle}）
        </span>
      </div>
      <div className="ml-9 px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-tl-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
