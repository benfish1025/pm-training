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

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">会议信息输入</h2>
        <p className="text-gray-500 mt-1">
          填写会议背景信息，所有参会人员将基于此内容进行讨论。
        </p>
      </div>

      <div className="space-y-5">
        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            会议主题 <span className="text-red-500">*</span>
          </label>
          <input
            value={meetingInfo.topic}
            onChange={(e) => update('topic', e.target.value)}
            placeholder="例如：购物车功能优化方案讨论"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-colors"
          />
        </div>

        {/* Background */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            会议背景
          </label>
          <textarea
            value={meetingInfo.background}
            onChange={(e) => update('background', e.target.value)}
            placeholder="描述需求产生的背景、当前面临的问题等..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none transition-colors"
          />
        </div>

        {/* Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            会议目标
          </label>
          <textarea
            value={meetingInfo.goal}
            onChange={(e) => update('goal', e.target.value)}
            placeholder="希望达成什么结论或共识？"
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none transition-colors"
          />
        </div>

        {/* Materials */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            会议资料 <span className="text-gray-400 font-normal">（选填）</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            上传需求文档或粘贴文本，所有参会人员都能读到这些内容。
          </p>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              上传文件
            </button>
            {fileName && (
              <span className="text-sm text-emerald-600">{fileName} 已添加</span>
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
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none font-mono text-sm transition-colors"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          className="px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          ← 上一步
        </button>
        <button
          onClick={onNext}
          disabled={!meetingInfo.topic.trim()}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            !meetingInfo.topic.trim()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-brand-600 text-white hover:bg-brand-700 cursor-pointer'
          }`}
        >
          进入会议室 →
        </button>
      </div>
    </div>
  )
}
