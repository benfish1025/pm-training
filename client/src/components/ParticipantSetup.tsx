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

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-arco-10">参会人员组装台</h2>
        <p className="text-sm text-arco-6 mt-1">
          选择参会角色，组建你的会议团队。你作为产品经理始终参会。
        </p>
      </div>

      {/* User (always present) */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-arco-5 mb-2">
          我（始终参会）
        </h3>
        <div className="flex items-center gap-3 p-3.5 bg-arcoblue-1 border border-arcoblue-2 rounded-arco-lg">
          <div className="w-10 h-10 rounded-full bg-arcoblue-6 text-white flex items-center justify-center font-medium shrink-0">
            我
          </div>
          <div>
            <div className="font-medium text-arco-10">我</div>
            <div className="text-sm text-arco-6">产品经理</div>
          </div>
        </div>
      </div>

      {/* Preset roles */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-arco-5 mb-2">
          快速添加角色
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {PRESET_ROLES.map((preset) => {
            const alreadyAdded = aiParticipants.some((p) => p.title === preset.title)
            return (
              <button
                key={preset.title}
                onClick={() => addPreset(preset)}
                disabled={alreadyAdded}
                className={`flex items-center gap-3 p-3 rounded-arco-lg border text-left transition-all ${
                  alreadyAdded
                    ? 'border-arco-3 bg-arco-1 opacity-50 cursor-not-allowed'
                    : 'border-arco-3 hover:border-arcoblue-4 hover:bg-arcoblue-1 cursor-pointer'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full ${preset.avatarColor} flex items-center justify-center text-lg shrink-0`}
                >
                  {preset.emoji}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-arco-10 text-sm truncate">
                    {preset.title}
                  </div>
                  <div className="text-xs text-arco-6">{preset.name}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* AI Participants list */}
      {aiParticipants.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-medium text-arco-5 mb-2">
            已添加参会者（{aiParticipants.length}）
          </h3>
          <div className="space-y-3">
            {aiParticipants.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-white border border-arco-3 rounded-arco-lg animate-fade-in"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-full ${p.avatarColor} flex items-center justify-center font-medium shrink-0`}
                  >
                    {p.name[0] || '?'}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-arco-5">姓名</label>
                      <input
                        value={p.name}
                        onChange={(e) => updateParticipant(p.id, 'name', e.target.value)}
                        className="w-full mt-0.5 px-2.5 py-1.5 text-sm font-medium border border-arco-3 rounded-arco focus:border-arcoblue-5 focus:outline-none focus:ring-1 focus:ring-arcoblue-2 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-arco-5">职位</label>
                      <input
                        value={p.title}
                        onChange={(e) => updateParticipant(p.id, 'title', e.target.value)}
                        className="w-full mt-0.5 px-2.5 py-1.5 text-sm border border-arco-3 rounded-arco focus:border-arcoblue-5 focus:outline-none focus:ring-1 focus:ring-arcoblue-2 transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeParticipant(p.id)}
                    className="text-arco-4 hover:text-red-500 text-sm shrink-0 p-1"
                    title="移除"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-arco-5">性格特点</label>
                    <textarea
                      value={p.personality}
                      onChange={(e) => updateParticipant(p.id, 'personality', e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 text-sm border border-arco-3 rounded-arco resize-none focus:border-arcoblue-5 focus:outline-none focus:ring-1 focus:ring-arcoblue-2 transition-colors"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-arco-5">说话风格</label>
                    <textarea
                      value={p.speakingStyle}
                      onChange={(e) => updateParticipant(p.id, 'speakingStyle', e.target.value)}
                      className="w-full mt-0.5 px-2.5 py-1.5 text-sm border border-arco-3 rounded-arco resize-none focus:border-arcoblue-5 focus:outline-none focus:ring-1 focus:ring-arcoblue-2 transition-colors"
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
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={addCustom}
          className="px-4 py-2 text-sm font-medium text-arcoblue-6 border border-arcoblue-4 rounded-arco hover:bg-arcoblue-1 transition-colors"
        >
          + 自定义角色
        </button>
        <button
          onClick={onNext}
          disabled={aiParticipants.length === 0}
          className={`px-6 py-2 rounded-arco font-medium transition-all ${
            aiParticipants.length === 0
              ? 'bg-arco-2 text-arco-4 cursor-not-allowed'
              : 'bg-arcoblue-6 text-white hover:bg-arcoblue-5 cursor-pointer'
          }`}
        >
          下一步：填写会议信息 {'->'}
        </button>
      </div>
    </div>
  )
}
