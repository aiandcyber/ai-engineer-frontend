import { useEffect, useRef, useState } from 'react'
import { API_BASE, USE_MOCK } from '../config'
import { authHeaders } from '../api/authToken'
import { useRequireAuth } from '../auth/useRequireAuth'
import { Markdown } from '../lib/markdown'

interface Props {
  useCase: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  imagePreview?: string
}

function mockReply(useCase: string, question: string): string {
  const uc = useCase || 'rds'
  return `Here is a **demo reply** for use case \`${uc}\`.

You asked: "${question || '(attachment only)'}"

| Item | Value |
| --- | --- |
| Mode | Demo / mock |
| use_case | ${uc} |
| Streaming | Simulated |

In live mode this panel streams answers from the Strands agent, including Markdown tables from analysis tools. Switch with \`VITE_USE_MOCK=false\` and ensure the backend is running.`
}

async function streamText(
  text: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  const words = text.split(/(\s+)/)
  for (const part of words) {
    onChunk(part)
    await new Promise((r) => setTimeout(r, 18))
  }
}

async function streamChat(
  message: string,
  useCase: string,
  imageData: string | null,
  onChunk: (chunk: string) => void,
): Promise<void> {
  if (USE_MOCK) {
    await streamText(mockReply(useCase, message), onChunk)
    return
  }

  const auth = await authHeaders()
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({
      message,
      image_data: imageData,
      use_case: useCase || null,
    }),
  })
  if (!res.ok || !res.body) {
    if (res.status === 401) throw new Error('Please sign in to continue.')
    throw new Error(`Chat failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { value, done } = await reader.read()
    if (value) onChunk(decoder.decode(value, { stream: true }))
    if (done) break
  }
}

export function ChatView({ useCase }: Props) {
  const ensureAuth = useRequireAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Free-form agent chat for codes, assumptions, and follow-up questions. Replies may include Markdown tables when tools return structured results.',
    },
  ])
  const [input, setInput] = useState('')
  const [base64Image, setBase64Image] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setBase64Image(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleSend() {
    if (!input.trim() && !base64Image) return
    if (!(await ensureAuth())) return

    const text = input.trim()
    const imageData = base64Image
    const userMessage: Message = { role: 'user', content: text || '(attachment)' }
    if (imageData) userMessage.imagePreview = imageData

    setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '' }])
    setInput('')
    setBase64Image(null)
    setIsStreaming(true)
    setError(null)

    try {
      await streamChat(text, useCase, imageData, (chunk) => {
        setMessages((prev) => {
          const lastIdx = prev.length - 1
          if (lastIdx < 0) return prev
          const updated = [...prev]
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: updated[lastIdx].content + chunk,
          }
          return updated
        })
      })
    } catch (e) {
      setError((e as Error).message)
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1)
        }
        return prev
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="results">
      <div className="results-head">
        <div>
          <h1 className="results-title" style={{ fontSize: 22 }}>Assistant chat</h1>
          <p className="hint-row" style={{ marginTop: 4 }}>
            Ask questions about your current project and assumptions.
          </p>
        </div>
        {USE_MOCK && (
          <span className="mock-badge" title="Chat uses a canned streaming reply">
            DEMO CHAT
          </span>
        )}
      </div>

      <div className="results-body">
        <section
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 'min(68vh, 680px)',
            padding: 0,
            overflow: 'hidden',
            marginBottom: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '16px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user'
              const isLiveAssistant =
                isStreaming && idx === messages.length - 1 && msg.role === 'assistant'

              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '92%',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 14,
                      fontSize: 14,
                      lineHeight: 1.55,
                      backgroundColor: isUser ? 'var(--indigo)' : 'var(--slate-100)',
                      color: isUser ? '#fff' : 'var(--slate-900)',
                      border: isUser ? 'none' : '1px solid var(--slate-200)',
                    }}
                  >
                    {msg.imagePreview && (
                      <img
                        src={msg.imagePreview}
                        alt="Attachment"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 180,
                          borderRadius: 8,
                          marginBottom: 8,
                          display: 'block',
                        }}
                      />
                    )}
                    {msg.role === 'assistant' && msg.content && !isLiveAssistant ? (
                      <div className="md">
                        <Markdown text={msg.content} />
                      </div>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content || (isLiveAssistant ? '…' : '')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={chatBottomRef} />
          </div>

          {error && (
            <div className="banner banner-error" style={{ margin: '0 16px 12px', flexShrink: 0 }}>
              {error}
            </div>
          )}

          <div
            style={{
              padding: '14px 16px 18px',
              borderTop: '1px solid var(--slate-200)',
              flexShrink: 0,
            }}
          >
            {base64Image && (
              <div className="banner banner-info" style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>Attachment ready — image or PDF will be sent with your message.</span>
                <button type="button" className="link-btn" onClick={() => setBase64Image(null)}>
                  Remove
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="file"
                id="chat-file-upload"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="chat-file-upload"
                className="btn btn-secondary btn-sm"
                style={{ width: 36, height: 36, padding: 0, cursor: 'pointer' }}
                title="Attach image or PDF"
              >
                +
              </label>

              <input
                className="input"
                style={{ flex: 1 }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isStreaming) void handleSend()
                }}
                disabled={isStreaming}
                placeholder="Ask about codes, layout, or assumptions…"
              />

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleSend()}
                disabled={isStreaming || (!input.trim() && !base64Image)}
              >
                {isStreaming ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </section>

        <aside>
          <div className="card side-card">
            <h3 className="side-title">Session context</h3>
            <dl className="kv">
              <dt>Use case</dt>
              <dd>{useCase || '—'}</dd>
              <dt>Agent</dt>
              <dd>Strands free-form</dd>
              <dt>API</dt>
              <dd>{USE_MOCK ? 'Mock stream' : '/api/chat/stream'}</dd>
            </dl>
          </div>

          <div className="card side-card">
            <h3 className="side-title">Tips</h3>
            <ul className="side-list">
              <li>Run structured analysis on the <strong>Analysis</strong> tab first, then ask follow-ups here.</li>
              <li>Attach a vector PDF or photo for document Q&amp;A.</li>
              <li>Tables and headings in replies render as Markdown.</li>
            </ul>
            <p className="side-note">
              The selected use case is passed to the agent on every message.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
