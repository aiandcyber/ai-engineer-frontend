import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../api/client'
import type { PreviousReport, ReportStatus } from '../api/types'
import { resolveUrl } from '../config'

const DOWNLOADS = [
  { key: 'dxf', label: 'Annotated DXF', file: 'annotated.dxf' },
  { key: 'schematic_dxf', label: 'Standalone DXF', file: 'standalone-layout.dxf' },
  { key: 'pdf', label: 'PDF', file: 'report.pdf' },
  { key: 'svg', label: 'SVG', file: 'diagram.svg' },
  { key: 'md', label: 'Markdown', file: 'summary.md' },
]

const STATUS: Record<ReportStatus, { label: string; className: string }> = {
  complete: { label: 'Compliant', className: 'pill-pass' },
  completed_with_issues: { label: 'Completed with issues', className: 'pill-warning' },
  error: { label: 'Failed', className: 'pill-fail' },
}

function analysisDate(epochSeconds: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(epochSeconds * 1000))
}

export function PreviousReportsView() {
  const [reports, setReports] = useState<PreviousReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestVersion = useRef(0)

  const load = useCallback(async () => {
    const request = ++requestVersion.current
    setLoading(true)
    setError(null)
    try {
      const nextReports = await api.listPreviousReports()
      if (request === requestVersion.current) setReports(nextReports)
    } catch (reason) {
      if (request === requestVersion.current) {
        setError((reason as Error).message)
      }
    } finally {
      if (request === requestVersion.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const handleAuthChange = (event: Event) => {
      const identity = (event as CustomEvent<{ identity?: string }>).detail?.identity
      requestVersion.current += 1
      setReports([])
      setError(null)
      if (identity) {
        void load()
      } else {
        setLoading(false)
      }
    }
    window.addEventListener('auth-session-changed', handleAuthChange)
    return () => window.removeEventListener('auth-session-changed', handleAuthChange)
  }, [load])

  return (
    <section className="previous-reports">
      <div className="previous-reports-head">
        <div>
          <h1 className="previous-reports-title">Previous Reports</h1>
          <p className="previous-reports-note">Reports are retained for 7 days.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading && <div className="card reports-message">Loading reports…</div>}
      {!loading && error && (
        <div className="card reports-message reports-error">
          <p>{error}</p>
          <button className="btn btn-secondary btn-sm" onClick={() => void load()}>Try again</button>
        </div>
      )}
      {!loading && !error && reports.length === 0 && (
        <div className="card reports-message">No previous reports are available.</div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="report-list">
          {reports.map((report) => {
            const status = STATUS[report.status]
            const available = DOWNLOADS.filter((download) => report.outputs[download.key])
            return (
              <article className="card report-item" key={report.id}>
                <div className="report-meta">
                  <div>
                    <div className="report-filename">{report.original_filename ?? 'Unknown input file'}</div>
                    <div className="report-date">{analysisDate(report.analyzed_at)}</div>
                  </div>
                  <span className={`pill ${status.className}`}>{status.label}</span>
                </div>
                <div className="report-files" aria-label={`Downloads for ${report.original_filename ?? report.id}`}>
                  {available.map((download) => (
                    <a
                      key={download.key}
                      className="btn btn-ghost btn-sm"
                      href={resolveUrl(report.outputs[download.key])}
                      download={`${report.id}_${download.file}`}
                    >
                      {download.label}
                    </a>
                  ))}
                  {available.length === 0 && (
                    <span className="download-missing">No downloadable files</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
