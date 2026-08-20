import { useMeetingStore } from './store'
import { Sidebar } from './components/Sidebar'
import { ParticipantSetup } from './components/ParticipantSetup'
import { MeetingSetup } from './components/MeetingSetup'
import { MeetingRoom } from './components/MeetingRoom'

const CONFIG_STEPS = [
  { key: 'participants', label: '参会人员' },
  { key: 'meeting', label: '会议信息' },
] as const

export default function App() {
  const view = useMeetingStore((s) => s.view)
  const configStep = useMeetingStore((s) => s.configStep)
  const meetings = useMeetingStore((s) => s.meetings)
  const selectedMeetingId = useMeetingStore((s) => s.selectedMeetingId)
  const confirmNewMeeting = useMeetingStore((s) => s.confirmNewMeeting)
  const resolveConfirm = useMeetingStore((s) => s.resolveConfirm)
  const setConfigStep = useMeetingStore((s) => s.setConfigStep)
  const setDraftParticipants = useMeetingStore((s) => s.setDraftParticipants)
  const setDraftMeetingInfo = useMeetingStore((s) => s.setDraftMeetingInfo)
  const createMeeting = useMeetingStore((s) => s.createMeeting)
  const draftParticipants = useMeetingStore((s) => s.draftParticipants)
  const draftMeetingInfo = useMeetingStore((s) => s.draftMeetingInfo)

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId)
  const ongoingMeeting = meetings.find((m) => m.status === 'ongoing')
  const stepIndex = CONFIG_STEPS.findIndex((s) => s.key === configStep)

  return (
    <div className="w-full h-screen flex gap-1.5 p-1.5 bg-coz-cream overflow-hidden">
      {/* 左侧边栏：会议列表 */}
      <Sidebar />

      {/* 右侧主区域 */}
      <div className="flex-1 min-w-0 flex flex-col bg-coz-card rounded-coz-card overflow-hidden">
        {view === 'welcome' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-coz-xl bg-coz-bubble-ai flex items-center justify-center text-2xl mb-4">
              💬
            </div>
            <h3 className="text-base font-medium text-coz-text1">会议演练室</h3>
            <p className="text-sm text-coz-text3 mt-1.5">
              从左侧选择一个会议查看记录，或点击「新建会议」开始演练
            </p>
          </div>
        )}

        {view === 'config' && (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* 配置页头：步骤指示 */}
            <div className="h-12 shrink-0 flex items-center gap-3 px-4 border-b border-coz-border/60">
              <span className="text-sm font-medium text-coz-text1">新建会议</span>
              <div className="flex items-center gap-1.5">
                {CONFIG_STEPS.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <span
                      className={`flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs transition-colors ${
                        i === stepIndex
                          ? 'bg-coz-primary/8 text-coz-primary font-medium'
                          : i < stepIndex
                            ? 'text-coz-text2'
                            : 'text-coz-text3'
                      }`}
                    >
                      <span className="flex items-center justify-center">{i + 1}</span>
                      {s.label}
                    </span>
                    {i < CONFIG_STEPS.length - 1 && (
                      <span className={`h-px w-4 ${i < stepIndex ? 'bg-coz-primary/40' : 'bg-coz-border'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {configStep === 'participants' && (
                <ParticipantSetup
                  participants={draftParticipants}
                  setParticipants={setDraftParticipants}
                  onNext={() => setConfigStep('meeting')}
                />
              )}
              {configStep === 'meeting' && (
                <MeetingSetup
                  meetingInfo={draftMeetingInfo}
                  setMeetingInfo={setDraftMeetingInfo}
                  onPrev={() => setConfigStep('participants')}
                  onNext={createMeeting}
                />
              )}
            </div>
          </div>
        )}

        {view === 'chat' && selectedMeeting && <MeetingRoom meeting={selectedMeeting} />}
        {view === 'chat' && !selectedMeeting && (
          <div className="flex-1 flex items-center justify-center text-sm text-coz-text3">
            会议不存在或已被删除
          </div>
        )}
      </div>

      {/* 新建会议确认弹窗：存在进行中的会议时弹出 */}
      {confirmNewMeeting && ongoingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-[380px] bg-coz-card rounded-coz-card p-5 shadow-xl animate-fade-in">
            <h3 className="text-base font-medium text-coz-text1">结束当前会议？</h3>
            <p className="mt-2 text-sm text-coz-text2 leading-5">
              当前有正在进行中的会议「{ongoingMeeting.topic || '未命名会议'}
              」。进行中的会议只能有一个，是否结束该会议并创建新会议？
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => resolveConfirm(false)}
                className="h-8 px-4 rounded-full text-sm font-medium text-coz-text2 hover:bg-coz-hover transition-colors"
              >
                否
              </button>
              <button
                onClick={() => resolveConfirm(true)}
                className="h-8 px-4 rounded-full text-sm font-medium bg-coz-primary text-white hover:bg-coz-primary-hover transition-colors"
              >
                是，结束并新建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
