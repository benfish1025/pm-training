import { useState } from 'react'
import { useMeetingStore, sortMeetings, type Meeting } from '../store'

function IconPlus({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

function IconDots({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}

function IconChat({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  )
}

function StatusTag({ status }: { status: Meeting['status'] }) {
  if (status === 'ongoing') {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-coz-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-coz-primary">
        <span className="size-1 rounded-full bg-coz-primary animate-pulse" />
        进行中
      </span>
    )
  }
  return (
    <span className="shrink-0 inline-flex items-center rounded-full bg-coz-bubble-user px-1.5 py-0.5 text-[10px] font-medium text-coz-text5">
      已结束
    </span>
  )
}

export function Sidebar() {
  const meetings = useMeetingStore((s) => s.meetings)
  const selectedMeetingId = useMeetingStore((s) => s.selectedMeetingId)
  const startCreate = useMeetingStore((s) => s.startCreate)
  const selectMeeting = useMeetingStore((s) => s.selectMeeting)
  const deleteMeeting = useMeetingStore((s) => s.deleteMeeting)

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const sorted = sortMeetings(meetings)

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-coz-card rounded-coz-card overflow-hidden">
      {/* 顶部：标题 + 新建会议 */}
      <div className="p-2.5 border-b border-coz-border/60">
        <div className="flex items-center gap-2 px-1 pb-2 pt-0.5">
          <div className="w-6 h-6 rounded-lg bg-coz-primary text-white flex items-center justify-center text-[10px] font-bold">
            PM
          </div>
          <span className="text-sm font-semibold text-coz-text1">会议演练室</span>
        </div>
        <button
          onClick={startCreate}
          className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-coz-primary text-white text-sm font-medium hover:bg-coz-primary-hover transition-colors"
        >
          <IconPlus className="size-4" />
          新建会议
        </button>
      </div>

      {/* 会议列表 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-1.5">
        {sorted.length === 0 && (
          <div className="px-2 py-8 text-center text-xs text-coz-text3 leading-5">
            暂无会议
            <br />
            点击上方按钮创建
          </div>
        )}
        {sorted.map((m) => {
          const isSelected = m.id === selectedMeetingId
          return (
            <div key={m.id} className="relative">
              <button
                onClick={() => selectMeeting(m.id)}
                className={`group w-full flex items-center gap-2 px-2 h-11 rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-coz-primary/8 text-coz-text1'
                    : 'hover:bg-coz-hover text-coz-text2'
                }`}
              >
                {isSelected && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2.5px] rounded-full bg-coz-primary" />
                )}
                <IconChat
                  className={`size-3.5 shrink-0 ${isSelected ? 'text-coz-primary' : 'text-coz-text3'}`}
                />
                <span className="flex-1 min-w-0 truncate text-sm">{m.topic || '未命名会议'}</span>
                {/* hover 时隐藏标签，为三点菜单腾出空间 */}
                <span className="group-hover:opacity-0 transition-opacity">
                  <StatusTag status={m.status} />
                </span>
              </button>

              {/* 三点菜单按钮：hover 出现 */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpenId(menuOpenId === m.id ? null : m.id)
                }}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded-md text-coz-text2 hover:bg-coz-bubble-user opacity-0 group-hover:opacity-100 transition-opacity ${
                  menuOpenId === m.id ? 'opacity-100 bg-coz-bubble-user' : ''
                }`}
                title="更多操作"
              >
                <IconDots className="size-3.5" />
              </button>

              {/* 下拉菜单 */}
              {menuOpenId === m.id && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId(null)
                    }}
                  />
                  <div className="absolute right-1.5 top-10 z-30 min-w-28 py-1 bg-coz-card rounded-lg shadow-lg border border-coz-border/60 animate-fade-in">
                    <button
                      onClick={() => {
                        deleteMeeting(m.id)
                        setMenuOpenId(null)
                      }}
                      className="w-full px-3 h-8 flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部说明 */}
      <div className="p-2 border-t border-coz-border/60">
        <div className="px-1.5 text-[10px] text-coz-text5 leading-4">
          数据保存在内存中（实验特性）
        </div>
      </div>
    </aside>
  )
}
