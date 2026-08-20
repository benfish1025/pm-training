import { type Dispatch, type SetStateAction } from 'react'
import { PRESET_ROLES, AVATAR_COLORS, type Participant, type PresetRole } from '../types'

interface Props {
  participants: Participant[]
  setParticipants: Dispatch<SetStateAction<Participant[]>>
  onNext: () => void
}

export function ParticipantSetup({ participants, setParticipants, onNext }: Props) {
  const aiParticipants = participants.filter((p) => !p.isUser)

  const addPreset = (preset: PresetRole) => {
    const newParticipant: Participant = {
      id: `p${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: preset.name,
      title: preset.title,
      personality: preset.personality,
      speakingStyle: preset.speakingStyle,
      isUser: false,
      avatarColor: preset.avatarColor,
    }
    setParticipants((prev) => [...prev, newParticipant])
  }

  const addCustom = () => {
    const idx = aiParticipants.length
    const newParticipant: Participant = {
      id: `p${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: '新角色',
      title: '参会者',
      personality: '',
      speakingStyle: '',
      isUser: false,
      avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
    }
    setParticipants((prev) => [...prev, newParticipant])
  }

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id))
  }

  const updateParticipant = (id: string, field: keyof Participant, value: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    )
  }

  const inputCls =
    'w-full mt-0.5 px-2.5 py-1.5 text-sm bg-coz-cream/60 border border-transparent rounded-md text-coz-text1 placeholder:text-coz-text3 hover:border-coz-border focus:border-coz-primary/40 focus:bg-coz-card focus:outline-none transition-colors'

  return (
    <div className="max-w-[808px] mx-auto px-6 py-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-coz-text1">参会人员组装台</h2>
        <p className="text-sm text-coz-text3 mt-1">
          选择参会角色，组建你的会议团队。你作为产品经理始终参会。
        </p>
      </div>

      {/* User (always present) */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-coz-text5 mb-2">我（始终参会）</h3>
        <div className="flex items-center gap-2.5 p-2.5 bg-coz-bubble-user rounded-lg">
          <div className="relative flex size-6 shrink-0 overflow-hidden rounded-full ring-[0.5px] ring-coz-border bg-coz-primary text-white items-center justify-center text-[11px] font-medium">
            我
          </div>
          <div>
            <div className="text-sm font-medium text-coz-text1 leading-5">我</div>
            <div className="text-xs text-coz-text3 leading-4">产品经理</div>
          </div>
        </div>
      </div>

      {/* Preset roles */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-coz-text5 mb-2">快速添加角色</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {PRESET_ROLES.map((preset) => {
            const alreadyAdded = aiParticipants.some((p) => p.title === preset.title)
            return (
              <button
                key={preset.title}
                onClick={() => addPreset(preset)}
                disabled={alreadyAdded}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${
                  alreadyAdded
                    ? 'border-transparent bg-coz-cream/50 opacity-50 cursor-not-allowed'
                    : 'border-transparent hover:bg-coz-hover hover:border-coz-border/60 cursor-pointer'
                }`}
              >
                <div
                  className={`relative flex size-7 shrink-0 overflow-hidden rounded-full ring-[0.5px] ring-coz-border ${preset.avatarColor} items-center justify-center text-sm`}
                >
                  {preset.emoji}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-coz-text1 text-sm leading-5 truncate">
                    {preset.title}
                  </div>
                  <div className="text-xs text-coz-text3 leading-4">{preset.name}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* AI Participants list */}
      {aiParticipants.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-medium text-coz-text5 mb-2">
            已添加参会者（{aiParticipants.length}）
          </h3>
          <div className="space-y-2">
            {aiParticipants.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-coz-cream/60 rounded-xl animate-fade-in"
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <div
                    className={`relative flex size-7 shrink-0 overflow-hidden rounded-full ring-[0.5px] ring-coz-border ${p.avatarColor} items-center justify-center text-xs font-medium`}
                  >
                    {p.name[0] || '?'}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-coz-text5">姓名</label>
                      <input
                        value={p.name}
                        onChange={(e) => updateParticipant(p.id, 'name', e.target.value)}
                        className={inputCls + ' font-medium'}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-coz-text5">职位</label>
                      <input
                        value={p.title}
                        onChange={(e) => updateParticipant(p.id, 'title', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeParticipant(p.id)}
                    className="text-coz-text3 hover:text-red-500 text-sm shrink-0 p-1 leading-none"
                    title="移除"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-coz-text5">性格特点</label>
                    <textarea
                      value={p.personality}
                      onChange={(e) => updateParticipant(p.id, 'personality', e.target.value)}
                      className={inputCls + ' resize-none'}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-coz-text5">说话风格</label>
                    <textarea
                      value={p.speakingStyle}
                      onChange={(e) => updateParticipant(p.id, 'speakingStyle', e.target.value)}
                      className={inputCls + ' resize-none'}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add custom + Next */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <button
          onClick={addCustom}
          className="h-8 px-3 text-sm font-medium text-coz-text2 rounded-lg hover:bg-coz-hover transition-colors"
        >
          + 自定义角色
        </button>
        <button
          onClick={onNext}
          disabled={aiParticipants.length === 0}
          className={`h-8 px-4 rounded-full text-sm font-medium transition-colors ${
            aiParticipants.length === 0
              ? 'bg-coz-text3/30 text-white/80 cursor-not-allowed'
              : 'bg-coz-primary text-white hover:bg-coz-primary-hover cursor-pointer'
          }`}
        >
          下一步：填写会议信息 →
        </button>
      </div>
    </div>
  )
}
