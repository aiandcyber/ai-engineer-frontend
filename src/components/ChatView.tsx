import { useState } from 'react'

interface Props {
  useCase: string
}

export function ChatView({ useCase }: Props) {
  const [message, setMessage] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    if (!message.trim()) return
    setLoading(true)
    setError(null)
    setAnswer('')
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, use_case: useCase || null }),
      })
      if (!res.ok || !res.body) {
        throw new Error(`Chat failed (${res.status})`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) setAnswer((prev) => prev + decoder.decode(value, { stream: true }))
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Assistant chat</h2>
      <p style={{ color: '#6b7280' }}>Ask questions about your current project and assumptions.</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          style={{ flex: 1 }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a question..."
          onKeyDown={(e) => { if (e.key === 'Enter') void send() }}
        />
        <button className="btn btn-primary" onClick={() => void send()} disabled={loading}>
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>
      {error && <div className="banner banner-error" style={{ marginTop: 12 }}>{error}</div>}
      <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
        {answer || 'No response yet.'}
      </pre>
    </section>
  )
}

