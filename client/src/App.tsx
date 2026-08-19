import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
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
    avatarColor: 'bg-arcoblue-6 text-white',
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
    <div className="min-h-screen bg-arco-1 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-arco-3 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-arco bg-arcoblue-6 text-white flex items-center justify-center text-xs font-bold">
              PM
            </div>
            <h1 className="text-base font-medium text-arco-10">会议演练室</h1>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 sm:gap-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-arco text-xs sm:text-sm transition-colors ${
                    i === currentStepIndex
                      ? 'bg-arcoblue-6 text-white font-medium'
                      : i < currentStepIndex
                        ? 'bg-arcoblue-1 text-arcoblue-6'
                        : 'bg-arco-1 text-arco-5'
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    {i < currentStepIndex ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-3 sm:w-6 h-px ${i < currentStepIndex ? 'bg-arcoblue-3' : 'bg-arco-3'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
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
  )
}
