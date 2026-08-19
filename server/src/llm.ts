// LLM Service - calls ARK API (OpenAI-compatible) with streaming

const ARK_BASE_URL = process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/plan/v3'
const ARK_API_KEY = process.env.Agent_Plan || process.env.AGENT_PLAN || ''
const MODEL = process.env.LLM_MODEL || 'doubao-seed-2.0-mini'

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

export interface HistoryMessage {
  senderId: string
  senderName: string
  title: string
  content: string
  isUser: boolean
}

export function buildSystemPrompt(
  participant: Participant,
  meeting: MeetingInfo,
  allParticipants: Participant[],
): string {
  const participantList = allParticipants
    .map((p) => `- ${p.name}（${p.title}）${p.isUser ? ' ← 用户本人' : ''}`)
    .join('\n')

  return `你是一位参会者，正在参加一场产品讨论会议。请始终以你的角色身份发言。

## 你的角色信息
- 姓名：${participant.name}
- 职位：${participant.title}
- 性格特点：${participant.personality || '无特殊要求'}
- 说话风格：${participant.speakingStyle || '正常表达'}

## 会议信息
- 主题：${meeting.topic || '未指定'}
- 背景：${meeting.background || '无'}
- 目标：${meeting.goal || '未指定'}

## 会议资料
${meeting.materials || '无'}

## 参会人员
${participantList}

## 行为要求
1. 始终以「${participant.name}」的身份发言，保持你的角色性格和说话风格
2. 回应当前讨论中的具体内容，不要空泛
3. 回复通常 2-5 句话，简洁有力
4. 可以提出质疑、补充观点或追问，但要言之有物
5. 如果有其他参会者已经说了你想说的，不要重复，可以补充不同角度
6. 用中文回复，不要使用 Markdown 格式（不要用 **、## 等）
7. 不要自我介绍或解释你是谁，直接开始发言`
}

export function buildMessages(
  systemPrompt: string,
  history: HistoryMessage[],
): Array<{ role: string; content: string }> {
  const historyText = history
    .map((msg) => {
      const label = msg.isUser
        ? `${msg.senderName}（产品经理）`
        : `${msg.senderName}（${msg.title}）`
      return `[${label}]: ${msg.content}`
    })
    .join('\n\n')

  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `以下是到目前为止的会议讨论记录：\n\n${historyText}\n\n请以你的角色身份，针对最新讨论内容发言。如果讨论刚开始，请对最新发言做出回应。`,
    },
  ]
}

export async function* streamLLM(
  messages: Array<{ role: string; content: string }>,
): AsyncGenerator<string> {
  // 调试观测：打印装配好的完整提示词
  console.log('\n========== LLM 请求提示词 ==========')
  for (const msg of messages) {
    console.log(`--- role: ${msg.role} ---`)
    console.log(msg.content)
  }
  console.log('=====================================\n')

  const response = await fetch(`${ARK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ARK_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      temperature: 0.8,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`LLM API error ${response.status}: ${errText}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue

      const data = trimmed.slice(6)
      if (data === '[DONE]') return

      try {
        const json = JSON.parse(data)
        const content = json.choices?.[0]?.delta?.content
        if (content) {
          yield content
        }
      } catch {
        // ignore parse errors for incomplete chunks
      }
    }
  }
}
