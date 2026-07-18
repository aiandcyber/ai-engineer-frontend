import type { UseCase } from '../api/types'
import { FileDrop } from './FileDrop'

const LOCATIONS = [
  'Minnesota, USA',
  'California, USA',
  'New York, USA',
  'Texas, USA',
  'Illinois, USA',
  'United States',
  'Hong Kong',
]

interface Props {
  useCases: UseCase[]
  useCaseName: string
  onUseCase: (name: string) => void
  location: string
  onLocation: (loc: string) => void
  values: Record<string, string>
  onValue: (key: string, value: string) => void
  files: File[]
  onFiles: (files: File[]) => void
  primary: string | null
  onPrimary: (name: string) => void
  converter: string
  onConverter: (c: string) => void
  onAnalyze: () => void
  loading: boolean
  error: string | null
}

export function SetupView(p: Props) {
  const pack = p.useCases.find((u) => u.name === p.useCaseName)
  const requiredInputsReady = !!pack && pack.required_inputs
    .filter((ri) => ri.safety_critical)
    .every((ri) => String(p.values[ri.key] ?? '').trim() !== '')
  const canAnalyze = !!pack && requiredInputsReady
    && p.files.some((f) => /\.(dwg|dxf|pdf)$/i.test(f.name)) && !p.loading

  return (
    <div className="grid-2">
      <section className="card">
        <div className="field">
          <label className="field-label">Use case <span className="req">*</span></label>
          <select className="select" value={p.useCaseName} onChange={(e) => p.onUseCase(e.target.value)}>
            {p.useCases.map((u) => <option key={u.name} value={u.name}>{u.title}</option>)}
          </select>
        </div>

        <div className="field">
          <label className="field-label">Building location <span className="req">*</span></label>
          <select className="select" value={p.location} onChange={(e) => p.onLocation(e.target.value)}>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {pack && (
          <>
            <div className="section-title">Project inputs</div>
            {pack.required_inputs.map((ri) => (
              <div className="field field-inline" key={ri.key}>
                <label className="field-label">
                  {ri.label}{ri.safety_critical && <span className="req"> *</span>}
                </label>
                <div className="field-control">
                  {ri.choices.length > 0 ? (
                    <select className="select" value={p.values[ri.key] ?? ''} onChange={(e) => p.onValue(ri.key, e.target.value)}>
                      <option value="">Select…</option>
                      {ri.choices.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <div className="input-unit">
                      <input
                        className="input"
                        type={ri.kind === 'number' ? 'number' : 'text'}
                        required={ri.safety_critical}
                        min={ri.key === 'building_height' ? 0 : undefined}
                        max={ri.key === 'building_height' ? 300 : undefined}
                        value={p.values[ri.key] ?? ''}
                        placeholder={ri.default != null ? `default: ${ri.default}` : 'Enter value'}
                        onChange={(e) => p.onValue(ri.key, e.target.value)}
                      />
                      {ri.unit && <span className="unit">{ri.unit}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </section>

      <section className="card">
        <FileDrop
          files={p.files}
          onFiles={p.onFiles}
          primary={p.primary}
          onPrimary={p.onPrimary}
          converter={p.converter}
          onConverter={p.onConverter}
        />
        {p.error && <div className="banner banner-error">{p.error}</div>}
        <div className="card-actions">
          <button className="btn btn-primary" disabled={!canAnalyze} onClick={p.onAnalyze}>
            {p.loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
        {!canAnalyze && !p.loading && (
          <div className="hint-row">
            {!requiredInputsReady
              ? 'Enter the required building height/drop length (maximum 300 ft).'
              : 'Add at least one drawing (DWG/DXF/PDF) to analyze.'}
          </div>
        )}
      </section>
    </div>
  )
}
