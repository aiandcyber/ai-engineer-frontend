import { useEffect, useMemo, useState } from 'react'

const STAGE_MESSAGES: Record<string, string> = {
  starting: 'Starting the analysis…',
  uploading: 'Securely transferring your drawing…',
  extracting: 'Reading the drawing and its geometry…',
  preparing: 'Preparing the extracted design information…',
  optimizing: 'Evaluating anchor layout combinations…',
  checking: 'Checking the proposed arrangement…',
  rendering: 'Generating drawings and reports…',
  saving: 'Saving the completed report files…',
  finishing: 'Completing the analysis…',
}

const ACTIONS = [
  'Reading', 'Mapping', 'Organizing', 'Checking', 'Comparing', 'Evaluating',
  'Building', 'Reviewing', 'Verifying', 'Refining', 'Consolidating', 'Preparing',
]

const ITEMS = [
  'drawing geometry', 'boundary information', 'design relationships',
  'service locations', 'clearance zones', 'layout candidates', 'routing options',
  'anchor combinations', 'validation checks', 'drawing annotations',
  'report sections', 'downloadable files',
]

const STAGE_ITEMS: Record<string, string[]> = {
  uploading: ['file data', 'upload segments', 'transfer checks', 'drawing metadata'],
  extracting: ['drawing entities', 'layer information', 'roof geometry', 'window locations'],
  preparing: ['boundary information', 'clearance zones', 'design relationships', 'service locations'],
  optimizing: ['layout candidates', 'routing options', 'anchor combinations', 'coverage checks'],
  checking: ['validation checks', 'clearance results', 'coverage results', 'layout consistency'],
  rendering: ['drawing annotations', 'report sections', 'output diagrams', 'file layouts'],
  saving: ['downloadable files', 'report metadata', 'output packages', 'analysis records'],
  finishing: ['final checks', 'report links', 'analysis summary', 'download information'],
}

function activityMessage(stage: string, sequence: number): string {
  const items = STAGE_ITEMS[stage] ?? ITEMS
  const action = ACTIONS[sequence % ACTIONS.length]
  const item = items[(sequence * 5 + Math.floor(sequence / ACTIONS.length)) % items.length]
  return `${action} ${item}`
}

export function ProcessingView({
  analysisId,
  percent,
  stage,
}: {
  analysisId: string | null
  percent: number
  stage: string
}) {
  const [activityCount, setActivityCount] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const safePercent = Math.max(1, Math.min(Math.round(percent), 99))
  const activity = useMemo(
    () => {
      const firstSequence = Math.max(0, activityCount - 4)
      return Array.from(
        { length: activityCount - firstSequence + 1 },
        (_, offset) => {
          const sequence = firstSequence + offset
          return {
            sequence,
            message: activityMessage(stage, sequence),
          }
        },
      )
    },
    [activityCount, stage],
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActivityCount((current) => current + 1)
    }, 900)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="card processing-view">
      <h1>Analysis in progress</h1>
      <p className="processing-message" aria-live="polite">
        {STAGE_MESSAGES[stage] ?? 'Processing your drawing…'}
      </p>
      <div
        className="processing-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safePercent}
      >
        <span style={{ width: `${safePercent}%` }}><i /></span>
      </div>
      <div className="processing-meta">
        <span>Estimated progress: {safePercent}%</span>
        <span>Elapsed: {elapsedSeconds}s</span>
        {analysisId && <span>Analysis ID: {analysisId}</span>}
      </div>
      <div className="processing-activity" aria-hidden="true">
        <div className="processing-activity-title">
          <span>Live processing activity</span>
          <strong>ACTIVE</strong>
        </div>
        {activity.map((entry) => (
          <div
            className="processing-activity-line"
            key={`${entry.sequence}-${entry.message}`}
          >
            <span>{String(entry.sequence + 1).padStart(3, '0')}</span>
            <p>{entry.message}</p>
            <i />
          </div>
        ))}
      </div>
      <p className="processing-note">
        Large drawings may take several minutes. Keep this page open to see the
        result here, or come back in a few minutes and open Previous Reports.
      </p>
    </section>
  )
}
