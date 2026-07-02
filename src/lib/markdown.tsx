// Minimal Markdown renderer for the report subset the backend emits:
// '##'/'###' headings, GFM tables, and '-' bullet lists. Kept dependency-free
// so the SPA runs without extra installs; swap for react-markdown later if the
// report grows richer.
import type { ReactElement, ReactNode } from 'react'

function renderInline(text: string, keyBase: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={`${keyBase}-b${i}`}>{part}</strong> : <span key={`${keyBase}-t${i}`}>{part}</span>,
  )
}

function renderCell(text: string, key: string): ReactNode {
  const t = text.trim()
  if (t === 'PASS') return <span className="pill pill-pass">PASS</span>
  if (t === 'FAIL') return <span className="pill pill-fail">FAIL</span>
  return renderInline(t, key)
}

function splitRow(line: string): string[] {
  return line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim())
}

const isSep = (line: string) => /^\|?\s*:?-{2,}/.test(line) && line.includes('-')

export function Markdown({ text }: { text: string }): ReactElement {
  const lines = text.split('\n')
  const out: ReactNode[] = []
  let i = 0
  let k = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('### ')) {
      out.push(<h3 key={k++} className="md-h3">{renderInline(line.slice(4), `h3${k}`)}</h3>)
      i++
      continue
    }
    if (line.startsWith('## ')) {
      out.push(<h2 key={k++} className="md-h2">{renderInline(line.slice(3), `h2${k}`)}</h2>)
      i++
      continue
    }

    // table: header row, separator, then body rows
    if (line.trim().startsWith('|') && i + 1 < lines.length && isSep(lines[i + 1])) {
      const header = splitRow(line)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]))
        i++
      }
      out.push(
        <div className="md-table-wrap" key={k++}>
          <table className="md-table">
            <thead>
              <tr>{header.map((h, ci) => <th key={ci}>{renderInline(h, `th${k}-${ci}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>{r.map((c, ci) => <td key={ci}>{renderCell(c, `td${k}-${ri}-${ci}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    // bullet list
    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      out.push(
        <ul className="md-list" key={k++}>
          {items.map((it, ii) => <li key={ii}>{renderInline(it, `li${k}-${ii}`)}</li>)}
        </ul>,
      )
      continue
    }

    if (line.trim()) out.push(<p className="md-p" key={k++}>{renderInline(line, `p${k}`)}</p>)
    i++
  }

  return <div className="md">{out}</div>
}
