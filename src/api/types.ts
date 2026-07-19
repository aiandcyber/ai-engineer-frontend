// API data contracts (mirror the FastAPI responses in backend/app/api/routes.py).

export type InputKind = 'number' | 'text'
export type JobStatus = 'complete' | 'completed_with_issues' | 'needs_input' | 'error'
export type ReportStatus = 'complete' | 'completed_with_issues' | 'error'

export interface RequiredInput {
  key: string
  label: string
  kind: InputKind
  safety_critical: boolean
  unit: string | null
  default: unknown
  choices: string[]
}

export interface UseCase {
  name: string
  title: string
  knowledge_tags: string[]
  required_inputs: RequiredInput[]
}

export interface Question {
  key: string
  label: string
  kind: InputKind
  unit: string | null
  choices: string[]
}

export interface AnalyzeResult {
  session_id: string
  status: JobStatus
  questions: Question[]
  assumptions: string[]
  unmapped_layers: string[]
  summary_markdown: string | null
  outputs: Record<string, string>
  error: string | null
  issues?: {
    code: string
    message: string
    window_id: string | null
    line_id: string | null
  }[]
}

export interface AnalysisProgress {
  stage: string
  percent: number
  analysis_id?: string
}

export interface PreviousReport {
  id: string
  original_filename: string | null
  analyzed_at: number
  status: ReportStatus
  expires_at: number | null
  outputs: Record<string, string>
}

export interface UploadInstruction {
  filename: string
  key: string
  url: string
  method: string
  headers: Record<string, string>
  fields: Record<string, string>
}

export interface UploadInit {
  session_id: string
  uploads: UploadInstruction[]
}

export interface AnalyzeArgs {
  useCase: string
  location: string | null
  sessionId: string | null
  inputs: Record<string, unknown>
  files: File[]
  primaryFilename: string | null
  converter: string | null
}
