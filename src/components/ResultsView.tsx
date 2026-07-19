import { useState } from 'react'
import type { AnalyzeResult } from '../api/types'
import { resolveUrl } from '../config'
import { Markdown } from '../lib/markdown'

type ResultTab = 'summary' | 'diagram' | 'downloads'

const DOWNLOADS: { key: string; label: string; file: string }[] = [
  { key: 'svg', label: 'Diagram (SVG)', file: 'diagram.svg' },
  { key: 'dxf', label: 'Annotated source CAD (DXF)', file: 'annotated.dxf' },
  { key: 'schematic_dxf', label: 'Standalone layout CAD (DXF)', file: 'standalone-layout.dxf' },
  { key: 'pdf', label: 'Report (PDF)', file: 'report.pdf' },
  { key: 'md', label: 'Summary (Markdown)', file: 'summary.md' },
]

interface Props {
  result: AnalyzeResult
  useCaseTitle: string
  location: string
  primaryName: string | null
  onNew: () => void
}

export function ResultsView({ result, useCaseTitle, location, primaryName, onNew }: Props) {
  const [tab, setTab] = useState<ResultTab>('summary')
  const svg = result.outputs.svg ? resolveUrl(result.outputs.svg) : null

  return (
    <div className="results">
      {result.status === 'completed_with_issues' && (
        <div className="banner banner-error">
          Two planning attempts completed, but unresolved issues remain. This is
          a diagnostic output and not a compliant final design.
        </div>
      )}
      <div className="results-head">
        <h1 className="results-title">Rooftop Anchor Analysis &amp; Cost Estimate</h1>
        <div className="results-head-actions">
          {DOWNLOADS.filter((d) => result.outputs[d.key]).map((d) => (
            <a key={d.key} className="btn btn-ghost btn-sm" href={resolveUrl(result.outputs[d.key])} download={`${result.session_id}_${d.file}`}>
              {d.key.toUpperCase()}
            </a>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={onNew}>New analysis</button>
        </div>
      </div>

      <div className="results-body">
        <div className="results-main">
          <div className="tabbar">
            <button className={`tabbtn ${tab === 'summary' ? 'tabbtn-active' : ''}`} onClick={() => setTab('summary')}>Summary</button>
            <button className={`tabbtn ${tab === 'diagram' ? 'tabbtn-active' : ''}`} onClick={() => setTab('diagram')}>Diagram</button>
            <button className={`tabbtn ${tab === 'downloads' ? 'tabbtn-active' : ''}`} onClick={() => setTab('downloads')}>Downloads</button>
          </div>

          {tab === 'summary' && (
            <div className="card">
              {result.summary_markdown
                ? <Markdown text={result.summary_markdown} />
                : <p className="md-p">No summary available.</p>}
            </div>
          )}

          {tab === 'diagram' && (
            <div className="card diagram-card">
              {svg
                ? <div className="diagram-scroll">
                    <img className="diagram-img" src={svg} alt="Anchor layout diagram" />
                  </div>
                : <p className="md-p">No diagram available.</p>}
            </div>
          )}

          {tab === 'downloads' && (
            <div className="card">
              <div className="downloads">
                {DOWNLOADS.map((d) => {
                  const url = result.outputs[d.key]
                  return (
                    <div className="download-row" key={d.key}>
                      <span className="download-label">{d.label}</span>
                      {url
                        ? <a className="btn btn-ghost btn-sm" href={resolveUrl(url)} download={`${result.session_id}_${d.file}`}>Download</a>
                        : <span className="download-missing">unavailable</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="results-side">
          <div className="card side-card">
            <h3 className="side-title">Inputs &amp; Sources</h3>
            <dl className="kv">
              <dt>Use case</dt><dd>{useCaseTitle}</dd>
              <dt>Analysis ID</dt><dd>{result.session_id}</dd>
              <dt>Location</dt><dd>{location}</dd>
              <dt>Primary drawing</dt><dd>{primaryName ?? '—'}</dd>
              <dt>Status</dt><dd>
                <span className={`pill ${result.status === 'complete' ? 'pill-pass' : 'pill-fail'}`}>
                  {result.status}
                </span>
              </dd>
            </dl>
          </div>

          {result.assumptions.length > 0 && (
            <div className="card side-card">
              <h3 className="side-title">Assumptions &amp; Notes</h3>
              <ul className="side-list">
                {result.assumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          {result.unmapped_layers.length > 0 && (
            <div className="card side-card">
              <h3 className="side-title">Unmapped layers</h3>
              <div className="chips">
                {result.unmapped_layers.map((l) => <span className="chip" key={l}>{l}</span>)}
              </div>
              <p className="side-note">Layers we couldn't classify — review if any hold roof geometry.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
