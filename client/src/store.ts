import { create } from 'zustand'
import type { Participant, MeetingInfo, ChatMessage } from './types'

export interface Meeting {
  id: string
  topic: string
  status: 'ongoing' | 'ended'
  participants: Participant[]
  meetingInfo: MeetingInfo
  messages: ChatMessage[]
  createdAt: number
  endedAt: number | null
}

export type View = 'welcome' | 'config' | 'chat'
export type ConfigStep = 'participants' | 'meeting'

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

interface MeetingStore {
  meetings: Meeting[]
  selectedMeetingId: string | null
  view: View
  configStep: ConfigStep
  draftParticipants: Participant[]
  draftMeetingInfo: MeetingInfo
  confirmNewMeeting: boolean

  /** 点击「新建会议」：若有进行中的会议则弹确认框，否则直接进入配置 */
  startCreate: () => void
  /** 确认弹窗选择：否=回到当前会议；是=结束当前会议并进入配置 */
  resolveConfirm: (endCurrent: boolean) => void
  setConfigStep: (step: ConfigStep) => void
  setDraftParticipants: (updater: Participant[] | ((prev: Participant[]) => Participant[])) => void
  setDraftMeetingInfo: (updater: MeetingInfo | ((prev: MeetingInfo) => MeetingInfo)) => void
  /** 配置完成（点击「继续」）：创建会议并进入演练 */
  createMeeting: () => void
  selectMeeting: (id: string) => void
  deleteMeeting: (id: string) => void
  endMeeting: (id: string) => void
  updateMessages: (id: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => void
}

export const useMeetingStore = create<MeetingStore>((set, get) => ({
  meetings: [],
  selectedMeetingId: null,
  view: 'welcome',
  configStep: 'participants',
  draftParticipants: DEFAULT_PARTICIPANTS,
  draftMeetingInfo: DEFAULT_MEETING_INFO,
  confirmNewMeeting: false,

  startCreate: () => {
    const ongoing = get().meetings.find((m) => m.status === 'ongoing')
    if (ongoing) {
      // 业务规则：进行中的会议只能有一个，需用户确认是否结束
      set({ confirmNewMeeting: true })
      return
    }
    set({
      view: 'config',
      configStep: 'participants',
      draftParticipants: DEFAULT_PARTICIPANTS,
      draftMeetingInfo: DEFAULT_MEETING_INFO,
    })
  },

  resolveConfirm: (endCurrent) => {
    const { meetings } = get()
    if (endCurrent) {
      // 结束当前进行中的会议，进入新会议配置
      set({
        confirmNewMeeting: false,
        meetings: meetings.map((m) =>
          m.status === 'ongoing'
            ? { ...m, status: 'ended' as const, endedAt: Date.now() }
            : m,
        ),
        view: 'config',
        configStep: 'participants',
        draftParticipants: DEFAULT_PARTICIPANTS,
        draftMeetingInfo: DEFAULT_MEETING_INFO,
      })
    } else {
      // 保持当前会议继续进行
      const ongoing = meetings.find((m) => m.status === 'ongoing')
      set({
        confirmNewMeeting: false,
        view: 'chat',
        selectedMeetingId: ongoing ? ongoing.id : get().selectedMeetingId,
      })
    }
  },

  setConfigStep: (step) => set({ configStep: step }),

  setDraftParticipants: (updater) =>
    set((s) => ({
      draftParticipants:
        typeof updater === 'function' ? updater(s.draftParticipants) : updater,
    })),

  setDraftMeetingInfo: (updater) =>
    set((s) => ({
      draftMeetingInfo:
        typeof updater === 'function' ? updater(s.draftMeetingInfo) : updater,
    })),

  createMeeting: () => {
    const { draftParticipants, draftMeetingInfo, meetings } = get()
    const meeting: Meeting = {
      id: `meeting_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      topic: draftMeetingInfo.topic,
      status: 'ongoing',
      participants: draftParticipants,
      meetingInfo: draftMeetingInfo,
      messages: [],
      createdAt: Date.now(),
      endedAt: null,
    }
    set({
      meetings: [meeting, ...meetings],
      selectedMeetingId: meeting.id,
      view: 'chat',
      // 重置草稿，下次新建从零开始
      draftParticipants: DEFAULT_PARTICIPANTS,
      draftMeetingInfo: DEFAULT_MEETING_INFO,
    })
  },

  selectMeeting: (id) => set({ selectedMeetingId: id, view: 'chat' }),

  deleteMeeting: (id) =>
    set((s) => {
      const meetings = s.meetings.filter((m) => m.id !== id)
      const wasSelected = s.selectedMeetingId === id
      return {
        meetings,
        ...(wasSelected
          ? {
              selectedMeetingId: null,
              view: 'welcome' as const,
            }
          : {}),
      }
    }),

  endMeeting: (id) =>
    set((s) => ({
      meetings: s.meetings.map((m) =>
        m.id === id && m.status === 'ongoing'
          ? { ...m, status: 'ended' as const, endedAt: Date.now() }
          : m,
      ),
    })),

  updateMessages: (id, updater) =>
    set((s) => ({
      meetings: s.meetings.map((m) =>
        m.id === id ? { ...m, messages: updater(m.messages) } : m,
      ),
    })),
}))

/** 侧边栏排序：进行中置顶；已结束按结束时间倒序（最新在上） */
export function sortMeetings(meetings: Meeting[]): Meeting[] {
  return [...meetings].sort((a, b) => {
    if (a.status === 'ongoing' && b.status !== 'ongoing') return -1
    if (b.status === 'ongoing' && a.status !== 'ongoing') return 1
    return (b.endedAt ?? b.createdAt) - (a.endedAt ?? a.createdAt)
  })
}
