import { useState, type Dispatch, type SetStateAction } from 'react'
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

export default function App() {
  const [step, setStep] = useState<Step>('participants')
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 'user',
      name: '我',
      title: '产品经理',
      personality: '',
      speakingStyle: '',
      isUser: true,
      avatarColor: 'bg-gray-900 text-white',
    },
  ])
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo>({
    topic: '',
    background: '',
    goal: '',
    materials: '',
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const currentStepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-gray-200 text-gray-700 flex items-center justify-center text-sm font-bold">
              PM
            </div>
            <h1 className="text-lg font-bold text-gray-900">会议演练室</h1>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 sm:gap-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    i === currentStepIndex
                      ? 'bg-gray-900 text-white'
                      : i < currentStepIndex
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    {i < currentStepIndex ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-3 sm:w-6 h-px ${i < currentStepIndex ? 'bg-gray-300' : 'bg-gray-100'}`} />
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
