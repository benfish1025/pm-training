export interface Participant {
  id: string
  name: string
  title: string
  personality: string
  speakingStyle: string
  isUser: boolean
  avatarColor: string
}

export interface MeetingInfo {
  topic: string
  background: string
  goal: string
  materials: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderTitle: string
  content: string
  isUser: boolean
  isStreaming: boolean
  timestamp: number
  avatarColor: string
}

export interface PresetRole {
  name: string
  title: string
  personality: string
  speakingStyle: string
  avatarColor: string
  emoji: string
}

export const PRESET_ROLES: PresetRole[] = [
  {
    name: '张磊',
    title: '技术负责人',
    personality: '务实、严谨，对技术可行性有较高要求',
    speakingStyle: '喜欢用技术原理解释问题，会关注实现成本和排期',
    avatarColor: 'bg-blue-50 text-blue-700',
    emoji: '🔧',
  },
  {
    name: '林薇',
    title: '设计师',
    personality: '注重用户体验，有较强的同理心',
    speakingStyle: '常从用户视角出发，关注交互流程和视觉一致性',
    avatarColor: 'bg-pink-50 text-pink-700',
    emoji: '🎨',
  },
  {
    name: '王总',
    title: '业务方',
    personality: '结果导向，关注商业价值和投入产出比',
    speakingStyle: '喜欢谈 ROI、用户增长、营收影响',
    avatarColor: 'bg-amber-50 text-amber-700',
    emoji: '📊',
  },
  {
    name: '陈静',
    title: '测试负责人',
    personality: '细心、严格，关注边界条件和异常场景',
    speakingStyle: '常提出边界情况和风险点，关注质量指标',
    avatarColor: 'bg-emerald-50 text-emerald-700',
    emoji: '🧪',
  },
  {
    name: '赵鹏',
    title: '运营经理',
    personality: '关注上线后的运营效果和用户反馈',
    speakingStyle: '关注用户分层、运营策略、数据反馈',
    avatarColor: 'bg-violet-50 text-violet-700',
    emoji: '📢',
  },
  {
    name: '刘洋',
    title: '数据分析师',
    personality: '数据驱动，注重指标体系',
    speakingStyle: '常提到数据埋点、A/B 测试、指标定义',
    avatarColor: 'bg-cyan-50 text-cyan-700',
    emoji: '📈',
  },
]

export const AVATAR_COLORS = [
  'bg-blue-50 text-blue-700',
  'bg-pink-50 text-pink-700',
  'bg-amber-50 text-amber-700',
  'bg-emerald-50 text-emerald-700',
  'bg-violet-50 text-violet-700',
  'bg-cyan-50 text-cyan-700',
  'bg-rose-50 text-rose-700',
  'bg-teal-50 text-teal-700',
]
