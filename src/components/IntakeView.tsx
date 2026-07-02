import { useState } from 'react'
import type { Question } from '../api/types'

interface Props {
  questions: Question[]
  round: number
  maxRounds: number
  loading: boolean
  onSubmit: (answers: Record<string, string>) => void
  onDefaults: () => void
}

export function IntakeView({ questions, round, maxRounds, loading, onSubmit, onDefaults }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const set = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }))

  return (
    <div className="intake-wrap">
      <section className="card intake-card">
        <h2 className="intake-title">A few details needed</h2>
        <span className="round-pill">Question round {round} of {maxRounds}</span>

        <div className="banner banner-info">
          We couldn't find these in your drawing or uploaded documents.
        </div>

        {questions.map((q, i) => (
          <div className="field intake-field" key={q.key}>
            <label className="field-label">
              {i + 1}. {q.label}
              <span className="safety-tag">safety-critical</span>
            </label>
            <div className="input-unit">
              <input
                className="input"
                type={q.kind === 'number' ? 'number' : 'text'}
                placeholder="Enter a value"
                value={answers[q.key] ?? ''}
                onChange={(e) => set(q.key, e.target.value)}
              />
              {q.unit && <span className="unit">{q.unit}</span>}
            </div>
          </div>
        ))}

        <div className="intake-actions">
          <button className="link-btn" onClick={onDefaults} disabled={loading}>
            Proceed with safe defaults
          </button>
          <button className="btn btn-primary" onClick={() => onSubmit(answers)} disabled={loading}>
            {loading ? 'Working…' : 'Continue'}
          </button>
        </div>
      </section>
    </div>
  )
}
