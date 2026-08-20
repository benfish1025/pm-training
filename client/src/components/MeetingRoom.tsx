import { useRef, useState, useEffect } from 'react'
import { streamChat } from '../api'
import { useMeetingStore, type Meeting } from '../store'
import type { ChatMessage } from '../types'

interface Props {
  meeting: Meeting
}

// ---- 内联图标（lucide 线性风格） ----
function IconUsers({ className = 'size-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconBot({ className = 'size-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  )
}

function IconArrowUp({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  )
}

function IconSquare({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

export function MeetingRoom({ meeting }: Props) {
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingParticipantId, setStreamingParticipantId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const updateMessages = useMeetingStore((s) => s.updateMessages)
  const endMeeting = useMeetingStore((s) => s.endMeeting)

  const messages = meeting.messages
  const participants = meeting.participants
  const meetingInfo = meeting.meetingInfo
  const isEnded = meeting.status === 'ended'
  const aiParticipants = participants.filter((p) => !p.isUser)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-focus input
  useEffect(() => {
    if (!isEnded) inputRef.current?.focus()
  }, [isStreaming, isEnded])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming || isEnded) return

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
      avatarColor: 'bg-coz-primary text-white',
    }
    updateMessages(meeting.id, (prev) => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    // 本地维护完整历史，逐个参与者单独请求，避免单条 SSE 连接
    // 持续时间过长被云端网关中断（ERR_INCOMPLETE_CHUNKED_ENCODING）
    let history: ChatMessage[] = [...messages, userMessage]
    let hasError = false

    for (const p of aiParticipants) {
      if (hasError) break

      const msgId = `msg${Date.now()}_${p.id}_${Math.random().toString(36).slice(2, 7)}`
      updateMessages(meeting.id, (prev) => [
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
            updateMessages(meeting.id, (prev) =>
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
        updateMessages(meeting.id, (prev) => prev.map((m) => (m.id === msgId ? finalMsg : m)))
        history = [...history, finalMsg]
      } else {
        // 没有生成任何内容则移除占位消息，避免空气泡
        updateMessages(meeting.id, (prev) => prev.filter((m) => m.id !== msgId))
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
    <div className="h-full flex flex-col">
      {/* 会议标题栏 */}
      <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-coz-border/60">
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex h-8 max-w-full items-center overflow-hidden rounded-md hover:bg-coz-hover px-2 transition-colors">
            <span className="min-w-0 truncate text-sm font-medium text-coz-text1">
              {meeting.topic || '未命名会议'}
            </span>
            {isEnded && (
              <span className="ml-2 shrink-0 inline-flex items-center rounded-full bg-coz-bubble-user px-1.5 py-0.5 text-[10px] font-medium text-coz-text5">
                已结束
              </span>
            )}
            <span className="inline-block h-3 w-px shrink-0 bg-coz-border mx-2" />
            <span className="flex shrink-0 items-center gap-1.5 text-xs leading-4 text-coz-text3">
              <span className="flex items-center gap-0.5">
                <IconUsers />
                <span>1</span>
              </span>
              <span className="flex items-center gap-0.5">
                <IconBot />
                <span>{aiParticipants.length}</span>
              </span>
            </span>
          </div>
        </div>
        {!isEnded && (
          <button
            onClick={() => endMeeting(meeting.id)}
            className="shrink-0 h-7 px-3 rounded-md text-xs font-medium text-coz-text2 hover:bg-coz-hover transition-colors"
          >
            结束会议
          </button>
        )}
      </div>

      {/* 消息区 */}
      <div className="flex-1 min-h-0 relative">
        <div className="h-full overflow-y-auto">
          <div className="max-w-[808px] mx-auto px-6 pb-[30px] pt-2.5">
            {/* AI 生成提示 */}
            <div className="flex items-center justify-center py-3">
              <span className="text-xs font-medium text-coz-text3">对话由AI生成</span>
            </div>

            {/* 日期分割线 */}
            <div className="flex items-center justify-center my-4">
              <div className="flex-1 h-px bg-coz-border/70" />
              <span className="text-xs text-coz-text5 mx-2.5">今天</span>
              <div className="flex-1 h-px bg-coz-border/70" />
            </div>

            {messages.length === 0 && (
              <div className="py-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-coz-xl bg-coz-bubble-ai flex items-center justify-center text-2xl mb-4">
                  💬
                </div>
                <h3 className="text-base font-medium text-coz-text1">会议已准备就绪</h3>
                <p className="text-sm text-coz-text3 mt-1.5 max-w-sm">
                  {isEnded
                    ? '该会议已结束，暂无聊天记录。'
                    : '在下方输入框开始你的发言，参会人员将按固定顺序轮流回应。'}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-md">
                  {aiParticipants.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 px-2.5 h-7 bg-coz-card border border-coz-border rounded-full text-xs text-coz-text2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-coz-text3" />
                      {p.name}（{p.title}）
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  formatTime={formatTime}
                />
              ))}

              {/* 正在输入指示器 */}
              {isStreaming && streamingParticipantId && (() => {
                const msg = messages.find(
                  (m) => m.senderId === streamingParticipantId && m.isStreaming,
                )
                if (msg && !msg.content) {
                  return <TypingIndicator message={msg} />
                }
                return null
              })()}
            </div>

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 输入区 */}
      <div className="shrink-0 px-6 pb-6">
        <div className="max-w-[808px] mx-auto">
          <div className="rounded-coz-xl bg-coz-card border-[0.5px] border-coz-border shadow-coz-input px-2.5 pt-2.5 pb-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming || isEnded}
              placeholder={
                isEnded
                  ? '会议已结束，仅可查看记录'
                  : isStreaming
                    ? '参会人员正在发言中...'
                    : '同步更多项目背景和信息，提升协作效率'
              }
              rows={1}
              className="w-full px-0.5 text-sm leading-5 resize-none bg-transparent outline-none placeholder:text-coz-text3 text-coz-text1 max-h-32 disabled:text-coz-text3"
              style={{ minHeight: '24px' }}
            />
            <div className="flex gap-2 pt-1.5 items-center justify-between">
              <div className="flex shrink-0 gap-1">
                <span className="text-xs text-coz-text5 leading-5">
                  固定顺序：{aiParticipants.map((p) => p.name).join(' → ')}
                </span>
              </div>
              <div className="flex gap-2 shrink-0 items-center">
                {isStreaming ? (
                  <span className="flex items-center gap-1.5 h-7 px-2 text-xs text-coz-text3">
                    <IconSquare className="size-2.5 text-coz-text3 animate-pulse" />
                    生成中
                  </span>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isEnded}
                    className={`flex size-7 items-center justify-center rounded-full transition-colors ${
                      !input.trim() || isEnded
                        ? 'bg-coz-text3/40 text-white cursor-not-allowed'
                        : 'bg-coz-primary text-white hover:bg-coz-primary-hover cursor-pointer'
                    }`}
                    aria-label="发送"
                  >
                    <IconArrowUp className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
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
  return (
    <div className="group flex items-start relative py-2 animate-fade-in">
      {/* 头像 */}
      <div className="w-6 shrink-0">
        <div
          className={`relative flex size-6 shrink-0 overflow-hidden rounded-full ring-[0.5px] ring-coz-border ${message.avatarColor} items-center justify-center text-[11px] font-medium`}
        >
          {message.senderName[0] || '?'}
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-hidden pl-2.5">
        {/* 名字头：姓名 + AI 徽标 + 时间（hover 显示） */}
        <div className="flex items-center gap-1.5 h-4 mb-1 text-xs text-coz-text2">
          <span className="min-w-0 truncate font-medium">{message.senderName}</span>
          {!message.isUser && (
            <span className="rounded-full bg-coz-bubble-user px-1.5 text-[10px] leading-[13px] text-coz-text5 font-medium">
              AI
            </span>
          )}
          <span className="text-xs text-coz-text5 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* 气泡：AI 绿 / 用户浅灰，统一左侧对齐 */}
        <div
          className={`relative w-fit max-w-full rounded-coz-xl px-3 py-2.5 ${
            message.isUser ? 'bg-coz-bubble-user' : 'bg-coz-bubble-ai'
          }`}
        >
          <p className="text-sm leading-5 text-coz-text1 whitespace-pre-wrap break-words text-left min-w-2">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-coz-text3/60 animate-pulse align-middle" />
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-start py-2 animate-fade-in">
      <div className="w-6 shrink-0">
        <div
          className={`relative flex size-6 shrink-0 overflow-hidden rounded-full ring-[0.5px] ring-coz-border ${message.avatarColor} items-center justify-center text-[11px] font-medium`}
        >
          {message.senderName[0] || '?'}
        </div>
      </div>
      <div className="flex-1 overflow-hidden pl-2.5">
        <div className="flex items-center gap-1.5 h-4 mb-1 text-xs text-coz-text2">
          <span className="min-w-0 truncate font-medium">{message.senderName}</span>
          <span className="rounded-full bg-coz-bubble-user px-1.5 text-[10px] leading-[13px] text-coz-text5 font-medium">
            AI
          </span>
        </div>
        <div className="w-fit rounded-coz-xl bg-coz-bubble-ai px-3 py-2.5">
          <div className="flex items-center gap-1 h-5">
            <span className="w-1.5 h-1.5 bg-coz-text3/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-coz-text3/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-coz-text3/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
