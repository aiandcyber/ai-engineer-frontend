import { useRef, useState } from 'react'

interface Props {
  files: File[]
  onFiles: (files: File[]) => void
  primary: string | null
  onPrimary: (name: string) => void
  converter: string
  onConverter: (c: string) => void
}

const DRAWING = /\.(dwg|dxf|pdf)$/i

export function FileDrop({ files, onFiles, primary, onPrimary, converter, onConverter }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const add = (list: FileList | null) => {
    if (!list) return
    const incoming = Array.from(list)
    const byName = new Map(files.map((f) => [f.name, f]))
    for (const f of incoming) byName.set(f.name, f)
    const merged = Array.from(byName.values())
    onFiles(merged)
    if (!primary) {
      const firstDrawing = merged.find((f) => DRAWING.test(f.name))
      if (firstDrawing) onPrimary(firstDrawing.name)
    }
  }

  const remove = (name: string) => {
    const next = files.filter((f) => f.name !== name)
    onFiles(next)
    if (primary === name) {
      const fallback = next.find((f) => DRAWING.test(f.name))
      onPrimary(fallback ? fallback.name : '')
    }
  }

  const hasDwg = files.some((f) => /\.dwg$/i.test(f.name))

  return (
    <div className="filedrop">
      <div
        className={`dropzone ${over ? 'dropzone-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files) }}
      >
        <svg className="dropzone-icon" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 16V4M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
        </svg>
        <div className="dropzone-text">Drop <b>DWG / DXF / PDF</b> and supporting documents</div>
        <div className="dropzone-hint">or click to browse</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => { add(e.target.files); e.target.value = '' }}
        />
      </div>

      {files.length > 0 && (
        <div className="filelist">
          <div className="filelist-title">Files</div>
          {files.map((f) => {
            const isDrawing = DRAWING.test(f.name)
            return (
              <div className="filerow" key={f.name}>
                <span className="file-name" title={f.name}>{f.name}</span>
                <span className="file-size">{(f.size / 1024).toFixed(0)} KB</span>
                {isDrawing ? (
                  <label className="primary-radio" title="Use as the primary drawing">
                    <input type="radio" name="primary" checked={primary === f.name} onChange={() => onPrimary(f.name)} />
                    primary
                  </label>
                ) : (
                  <span className="file-tag">support</span>
                )}
                <button className="file-remove" onClick={() => remove(f.name)} aria-label="Remove">×</button>
              </div>
            )
          })}
        </div>
      )}

      {hasDwg && (
        <div className="converter-row">
          <label className="converter-label">DWG converter</label>
          <select className="select" value={converter} onChange={(e) => onConverter(e.target.value)}>
            <option value="libredwg">LibreDWG</option>
            <option value="aps">Autodesk APS</option>
          </select>
        </div>
      )}
    </div>
  )
}
