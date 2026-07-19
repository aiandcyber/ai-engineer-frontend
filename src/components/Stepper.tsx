export type Phase = 'setup' | 'intake' | 'processing' | 'results'

const STEPS: { id: Phase; label: string }[] = [
  { id: 'setup', label: 'Setup' },
  { id: 'intake', label: 'Details' },
  { id: 'processing', label: 'Processing' },
  { id: 'results', label: 'Results' },
]

export function Stepper({ phase }: { phase: Phase }) {
  const current = STEPS.findIndex((s) => s.id === phase)
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div key={s.id} className="step-wrap">
          <div className={`step ${i === current ? 'step-active' : ''} ${i < current ? 'step-done' : ''}`}>
            <span className="step-num">{i < current ? '✓' : i + 1}</span>
            <span className="step-label">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && <span className={`step-line ${i < current ? 'step-line-done' : ''}`} />}
        </div>
      ))}
    </div>
  )
}
