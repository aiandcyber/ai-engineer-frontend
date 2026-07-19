// In-browser mock of the backend so the SPA runs with no server.
// Mirrors the shapes and behaviour of backend/app/api/routes.py.
import type { AnalysisProgress, AnalyzeArgs, AnalyzeResult, PreviousReport, UseCase } from './types'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const RDS: UseCase = {
  name: 'rds',
  title: 'Rooftop Anchor Layout — Rope Descent System (RDS)',
  knowledge_tags: ['IWCA-I14', 'OSHA-1910-subpartD', 'OSHA-1910-subpartI', 'IBC', 'MN-1303'],
  required_inputs: [
    { key: 'serviced_facades', label: "Façades with windows to service (IDs like 'F1,F3', or 'ALL')", kind: 'text', safety_critical: false, unit: null, default: 'ALL', choices: [] },
    { key: 'column_spacing', label: 'Column-to-column spacing', kind: 'number', safety_critical: true, unit: 'ft', default: null, choices: [] },
    { key: 'workers_per_bay', label: 'Workers per bay', kind: 'number', safety_critical: false, unit: null, default: 1, choices: [] },
    { key: 'building_height', label: 'Building height / drop length', kind: 'number', safety_critical: true, unit: 'ft', default: null, choices: [] },
    { key: 'substrate', label: 'Roof substrate (concrete/steel/...)', kind: 'text', safety_critical: false, unit: null, default: null, choices: ['concrete', 'steel', 'wood', 'masonry'] },
  ],
}

export async function listUseCases(): Promise<UseCase[]> {
  await delay(200)
  return [RDS]
}

export async function listPreviousReports(): Promise<PreviousReport[]> {
  await delay(200)
  return [
    {
      id: 'a1b2c3d4e5f6',
      original_filename: 'sample-roof.dwg',
      analyzed_at: Date.now() / 1000 - 3600,
      status: 'complete',
      expires_at: Date.now() / 1000 + 6 * 86400,
      outputs: buildOutputs(),
    },
  ]
}

const SAFETY_KEYS = ['column_spacing', 'building_height']

const QUESTIONS = {
  column_spacing: { key: 'column_spacing', label: 'Column-to-column spacing', kind: 'number' as const, unit: 'ft', choices: [] },
  building_height: { key: 'building_height', label: 'Building height / drop length', kind: 'number' as const, unit: 'ft', choices: [] },
}

const ASSUMPTIONS = [
  'Anchor layout based on the roof outline derived from the primary drawing.',
  'Roof area calculated to the outside edge of the outline polygon.',
  'Anchor type: permanent, 5,000 lb minimum capacity (IWCA I-14.5).',
  'Pricing includes standard mobilization; excludes applicable taxes.',
  'DRAFT — requires verification and PE certification before installation.',
]

const SUMMARY_MD = `## Rooftop Anchor Analysis & Cost Estimate

### Overview

| Metric | Value |
| --- | --- |
| Roof area | 9,600.0 ft² |
| Total anchors | 32 |
| Worker drops | 28 |
| Façades serviced | 4 of 4 |
| Worker reach / rope | 75 ft |
| Obstructions | 1 |
| Source drawing | roof.dxf |

### Fall-Clearance Check

| Metric | Value |
| --- | --- |
| Required clearance | 18.5 ft |
| Available (drop height) | 150 ft |
| Result | PASS |
|   free fall | 6.0 ft |
|   deceleration distance | 3.5 ft |
|   harness stretch | 1.0 ft |
|   safety margin | 3.0 ft |

### Cost Summary

| Metric | Value |
| --- | --- |
| Anchors | USD 8,000.00 |
| Installation | USD 14,400.00 |
| Verification & Certification | USD 3,700.00 |
| Total | USD 26,100.00 |

### Code References & Citations

| Topic | Code | Clause (pg) | Excerpt |
| --- | --- | --- | --- |
| Anchorage strength | IWCA I-14.5 | p.39 | Each anchorage shall support 5,000 lb per worker attached, or be designed with a safety factor of two under a qualified person. |
| Roof edge / warning line | OSHA 1910.28 | p.12 | Each employee on a walking-working surface with an unprotected edge 4 ft or more above a lower level is protected by a guardrail, safety net, or personal fall protection. |
| Local amendments | MN 1303 | p.4 | Buildings over four stories with windows require approved permanent anchorage for window-cleaning operations. |

### Assumptions & Notes

- Anchor layout based on the roof outline derived from the primary drawing.
- Anchor type: permanent, 5,000 lb minimum capacity (IWCA I-14.5).
- Pricing includes standard mobilization; excludes applicable taxes.

### Disclaimer

- DRAFT — generated layout and estimate. Requires review, calculation verification, and certification (stamp) by a licensed Professional Engineer before installation or use.
`

function sampleDiagramSvg(): string {
  const W = 640, H = 420, m = 70
  const x0 = m, y0 = m, x1 = W - m, y1 = H - m
  const top = Array.from({ length: 8 }, (_, i) => x0 + ((i + 1) * (x1 - x0)) / 9)
  const bottom = top
  const side = Array.from({ length: 8 }, (_, i) => y0 + ((i + 1) * (y1 - y0)) / 9)
  const anchor = (cx: number, cy: number) =>
    `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#dc2626" stroke="#7f1d1d" stroke-width="1"/>`
  const drop = (cx: number, cy: number) =>
    `<circle cx="${cx}" cy="${cy}" r="4" fill="#34d399" stroke="#065f46" stroke-width="1"/>`
  const anchors: string[] = []
  const drops: string[] = []
  top.forEach((x) => { anchors.push(anchor(x, y0 + 14)); drops.push(drop(x, y0)) })
  bottom.forEach((x) => { anchors.push(anchor(x, y1 - 14)); drops.push(drop(x, y1)) })
  side.forEach((y) => { anchors.push(anchor(x0 + 14, y)); drops.push(drop(x0, y)) })
  side.forEach((y) => { anchors.push(anchor(x1 - 14, y)); drops.push(drop(x1, y)) })
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
  <rect x="${(x0 + x1) / 2 - 40}" y="${y0 + 30}" width="80" height="46" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>
  <text x="${(x0 + x1) / 2}" y="${y0 + 58}" font-family="sans-serif" font-size="11" fill="#7c2d12" text-anchor="middle">HVAC</text>
  ${drops.join('\n  ')}
  ${anchors.join('\n  ')}
  <text x="${W / 2}" y="${H - 24}" font-family="sans-serif" font-size="12" fill="#334155" text-anchor="middle">RDS Anchor Layout — Anchors: 32 · Drops: 28 · Façades serviced: 4 of 4</text>
</svg>`
}

function dataUrl(text: string, mime: string): string {
  return `data:${mime};charset=utf-8,${encodeURIComponent(text)}`
}

function buildOutputs(): Record<string, string> {
  return {
    svg: dataUrl(sampleDiagramSvg(), 'image/svg+xml'),
    dxf: dataUrl('(mock DXF — run against the real backend for a true CAD file)', 'application/dxf'),
    schematic_dxf: dataUrl('(mock standalone DXF)', 'application/dxf'),
    pdf: dataUrl('(mock PDF — run against the real backend for the certified report)', 'application/pdf'),
    md: dataUrl(SUMMARY_MD, 'text/markdown'),
  }
}

export async function analyze(
  args: AnalyzeArgs,
  onProgress?: (progress: AnalysisProgress) => void,
): Promise<AnalyzeResult> {
  for (const progress of [
    { stage: 'extracting', percent: 15 },
    { stage: 'preparing', percent: 35 },
    { stage: 'optimizing', percent: 60 },
    { stage: 'rendering', percent: 90 },
  ]) {
    onProgress?.(progress)
    await delay(250)
  }
  const missing = SAFETY_KEYS.filter(
    (k) => args.inputs[k] == null || args.inputs[k] === '',
  )
  // First pass with missing safety-critical inputs -> ask (bounded intake).
  if (missing.length && !args.sessionId) {
    return {
      session_id: 'a1b2c3d4e5f6',
      status: 'needs_input',
      questions: missing.map((k) => QUESTIONS[k as keyof typeof QUESTIONS]),
      assumptions: [],
      unmapped_layers: ['A-ANNO-TEXT', 'M-DUCT'],
      summary_markdown: null,
      outputs: {},
      error: null,
    }
  }
  return {
    session_id: args.sessionId ?? 'a1b2c3d4e5f6',
    status: 'complete',
    questions: [],
    assumptions: ASSUMPTIONS,
    unmapped_layers: ['A-ANNO-TEXT', 'M-DUCT'],
    summary_markdown: SUMMARY_MD,
    outputs: buildOutputs(),
    error: null,
  }
}
