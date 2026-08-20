import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { MeetingInfo } from '../types'

interface Props {
  meetingInfo: MeetingInfo
  setMeetingInfo: Dispatch<SetStateAction<MeetingInfo>>
  onPrev: () => void
  onNext: () => void
}

export function MeetingSetup({ meetingInfo, setMeetingInfo, onPrev, onNext }: Props) {
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = (field: keyof MeetingInfo, value: string) => {
    setMeetingInfo((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const separator = meetingInfo.materials ? '\n\n' : ''
    update(
      'materials',
      `${meetingInfo.materials}${separator}--- ${file.name} ---\n${text}`,
    )
    setFileName(file.name)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const inputCls =
    'w-full px-3.5 py-2.5 bg-coz-cream/60 border border-transparent rounded-xl text-sm text-coz-text1 placeholder:text-coz-text3 hover:border-coz-border focus:border-coz-primary/40 focus:bg-coz-card focus:outline-none transition-colors resize-none'

  return (
    <div className="max-w-[808px] mx-auto px-6 py-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-coz-text1">会议信息输入</h2>
        <p className="text-sm text-coz-text3 mt-1">
          填写会议背景信息，所有参会人员将基于此内容进行讨论。
        </p>
      </div>

      <div className="space-y-5">
        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-coz-text1 mb-1.5">
            会议主题 <span className="text-red-500">*</span>
          </label>
          <input
            value={meetingInfo.topic}
            onChange={(e) => update('topic', e.target.value)}
            placeholder="例如：购物车功能优化方案讨论"
            className={inputCls}
          />
        </div>

        {/* Background */}
        <div>
          <label className="block text-sm font-medium text-coz-text1 mb-1.5">
            会议背景
          </label>
          <textarea
            value={meetingInfo.background}
            onChange={(e) => update('background', e.target.value)}
            placeholder="描述需求产生的背景、当前面临的问题等..."
            rows={3}
            className={inputCls}
          />
        </div>

        {/* Goal */}
        <div>
          <label className="block text-sm font-medium text-coz-text1 mb-1.5">
            会议目标
          </label>
          <textarea
            value={meetingInfo.goal}
            onChange={(e) => update('goal', e.target.value)}
            placeholder="希望达成什么结论或共识？"
            rows={3}
            className={inputCls}
          />
        </div>

        {/* Materials */}
        <div>
          <label className="block text-sm font-medium text-coz-text1 mb-1.5">
            会议资料 <span className="text-coz-text3 font-normal">（选填）</span>
          </label>
          <p className="text-xs text-coz-text5 mb-2">
            上传需求文档或粘贴文本，所有参会人员都能读到这些内容。
          </p>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-3 text-sm text-coz-text2 rounded-lg hover:bg-coz-hover transition-colors"
            >
              上传文件
            </button>
            {fileName && (
              <span className="text-sm text-coz-text2">{fileName} 已添加</span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,.text"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          <textarea
            value={meetingInfo.materials}
            onChange={(e) => update('materials', e.target.value)}
            placeholder="或直接粘贴会议资料文本..."
            rows={5}
            className={inputCls + ' font-mono'}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-8 pb-2">
        <button
          onClick={onPrev}
          className="h-9 px-4 rounded-full text-sm font-medium text-coz-text2 hover:bg-coz-hover transition-colors"
        >
          ← 上一步
        </button>
        <button
          onClick={onNext}
          disabled={!meetingInfo.topic.trim()}
          className={`h-9 px-5 rounded-full text-sm font-medium transition-colors ${
            !meetingInfo.topic.trim()
              ? 'bg-coz-text3/30 text-white/80 cursor-not-allowed'
              : 'bg-coz-primary text-white hover:bg-coz-primary-hover cursor-pointer'
          }`}
        >
          进入会议室 →
        </button>
      </div>
    </div>
  )
}
