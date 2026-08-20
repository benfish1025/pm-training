import { useState, useEffect } from 'react'
import { ParticipantSetup } from './components/ParticipantSetup'
import { MeetingSetup } from './components/MeetingSetup'
import { MeetingRoom } from './components/MeetingRoom'
import type { Participant, MeetingInfo, ChatMessage } from './types'

type Step = 'participants' | 'meeting' | 'chat'

const STEPS: { key: Step; label: string }[] = [
  { key: 'participants', label: '参会人员' },
  { key: 'meeting', label: '会议信息' },
  { key: 'chat', label: '会议演练' },
]

const STORAGE_KEY = 'meeting-room-state-v1'

interface PersistedState {
  step: Step
  participants: Participant[]
  meetingInfo: MeetingInfo
  messages: ChatMessage[]
}

const DEFAULT_PARTICIPANTS: Participant[] = [
  {
    id: 'user',
    name: '我',
    title: '产品经理',
    personality: '',
    speakingStyle: '',
    isUser: true,
    avatarColor: 'bg-coz-primary text-white',
  },
]

const DEFAULT_MEETING_INFO: MeetingInfo = {
  topic: '',
  background: '',
  goal: '',
  materials: '',
}

function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    if (!parsed || typeof parsed !== 'object') return null

    const steps = STEPS.map((s) => s.key)
    return {
      step: steps.includes(parsed.step as Step) ? (parsed.step as Step) : 'participants',
      participants:
        Array.isArray(parsed.participants) && parsed.participants.length > 0
          ? parsed.participants
          : DEFAULT_PARTICIPANTS,
      meetingInfo: { ...DEFAULT_MEETING_INFO, ...(parsed.meetingInfo || {}) },
      // 恢复时将中断的流式消息视为已完成，过滤掉尚未产生内容的消息
      messages: (Array.isArray(parsed.messages) ? parsed.messages : [])
        .filter((m) => m && typeof m.content === 'string' && m.content.length > 0)
        .map((m) => ({ ...m, isStreaming: false })),
    }
  } catch {
    return null
  }
}

function persistState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 忽略存储配额等异常
  }
}

export default function App() {
  const [initialState] = useState(loadPersistedState)
  const [step, setStep] = useState<Step>(initialState?.step ?? 'participants')
  const [participants, setParticipants] = useState<Participant[]>(
    initialState?.participants ?? DEFAULT_PARTICIPANTS,
  )
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo>(
    initialState?.meetingInfo ?? DEFAULT_MEETING_INFO,
  )
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialState?.messages ?? [],
  )

  // 状态变化时持久化，刷新 / HMR 后可恢复
  useEffect(() => {
    persistState({ step, participants, meetingInfo, messages })
  }, [step, participants, meetingInfo, messages])

  const currentStepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="w-full h-screen flex flex-col bg-coz-cream">
      {/* 应用内容区：米灰底 + 白色圆角卡片 */}
      <div className="flex-1 min-h-0 p-2 pl-1">
        <div className="h-full flex flex-col bg-coz-card rounded-coz-card overflow-hidden">
          {/* Header */}
          <header className="h-12 shrink-0 flex items-center gap-3 px-3 border-b border-coz-border/60">
            <div className="flex items-center gap-2 pl-1">
              <div className="w-7 h-7 rounded-lg bg-coz-primary text-white flex items-center justify-center text-[11px] font-bold">
                PM
              </div>
              <span className="text-sm font-medium text-coz-text1">会议演练室</span>
            </div>

            {/* Stepper */}
            <div className="flex-1 flex items-center justify-center gap-1">
              {STEPS.map((s, i) => (
                <button
                  key={s.key}
                  onClick={() => {
                    // 允许回看已完成步骤，不允许跳步进入聊天
                    if (i <= currentStepIndex) setStep(s.key)
                  }}
                  className={`flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs transition-colors ${
                    i === currentStepIndex
                      ? 'bg-coz-primary/8 text-coz-primary font-medium'
                      : i < currentStepIndex
                        ? 'text-coz-text2 hover:bg-coz-hover cursor-pointer'
                        : 'text-coz-text3 cursor-default'
                  }`}
                >
                  <span className="flex items-center justify-center">{i + 1}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            <div className="w-24" />
          </header>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {step === 'participants' && (
              <ParticipantSetup
                participants={participants}
                setParticipants={setParticipants}
                onNext={() => setStep('meeting')}
              />
            )}
            {step === 'meeting' && (
              <MeetingSetup
                meetingInfo={meetingInfo}
                setMeetingInfo={setMeetingInfo}
                onPrev={() => setStep('participants')}
                onNext={() => setStep('chat')}
              />
            )}
            {step === 'chat' && (
              <MeetingRoom
                participants={participants}
                meetingInfo={meetingInfo}
                messages={messages}
                setMessages={setMessages}
                onExit={() => {
                  setMessages([])
                  setStep('participants')
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
