// API client. In mock mode it delegates to ./mock; otherwise it speaks to the
// FastAPI BFF using the production-shaped presigned-upload flow:
//   POST /api/uploads  -> PUT each file to its URL -> POST /api/analyze {file_keys}
import { API_BASE, USE_MOCK, resolveUrl } from '../config'
import { authHeaders } from './authToken'
import * as mock from './mock'
import type { AnalyzeArgs, AnalyzeResult, UploadInit, UploadInstruction, UseCase } from './types'

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail ?? detail
    } catch {
      /* ignore non-JSON error bodies */
    }
    if (res.status === 401) {
      throw new Error('Please sign in to continue.')
    }
    throw new Error(`${res.status}: ${detail}`)
  }
  return res.json() as Promise<T>
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  const auth = await authHeaders()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)
  return fetch(url, { ...init, headers })
}

export async function listUseCases(): Promise<UseCase[]> {
  if (USE_MOCK) return mock.listUseCases()
  const res = await apiFetch(`${API_BASE}/api/usecases`)
  const data = await asJson<{ usecases: UseCase[] }>(res)
  return data.usecases
}

async function initUploads(args: AnalyzeArgs): Promise<UploadInit> {
  const body = {
    use_case: args.useCase,
    location: args.location,
    session_id: args.sessionId,
    files: args.files.map((f) => ({ filename: f.name, content_type: f.type || null })),
  }
  const res = await apiFetch(`${API_BASE}/api/uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return asJson<UploadInit>(res)
}

async function putFile(file: File, instr: UploadInstruction): Promise<void> {
  const url = resolveUrl(instr.url)
  const headers = new Headers(instr.headers)
  if (!headers.has('Content-Type') && file.type) headers.set('Content-Type', file.type)

  const isLocalApi = url.startsWith('/') || url.includes('/api/files/')
  const res = isLocalApi
    ? await apiFetch(url, { method: instr.method || 'PUT', headers, body: file })
    : await fetch(url, { method: instr.method || 'PUT', headers, body: file })

  if (!res.ok) throw new Error(`Upload failed for ${file.name}: ${res.status}`)
}

async function uploadFiles(args: AnalyzeArgs, init: UploadInit): Promise<string[]> {
  const byName = new Map(init.uploads.map((u) => [u.filename, u]))
  const keys: string[] = []
  for (const file of args.files) {
    const instr = byName.get(file.name)
    if (!instr) throw new Error(`No upload slot for ${file.name}`)
    await putFile(file, instr)
    keys.push(instr.key)
  }
  return keys
}

export async function analyze(args: AnalyzeArgs): Promise<AnalyzeResult> {
  if (USE_MOCK) return mock.analyze(args)

  const fd = new FormData()
  fd.append('use_case', args.useCase)
  if (args.location) fd.append('location', args.location)
  if (args.sessionId) fd.append('session_id', args.sessionId)
  fd.append('inputs', JSON.stringify(args.inputs ?? {}))
  if (args.primaryFilename) fd.append('primary_filename', args.primaryFilename)
  if (args.converter) fd.append('converter', args.converter)

  if (args.files.length > 0) {
    const init = await initUploads(args)
    const keys = await uploadFiles(args, init)
    fd.set('session_id', init.session_id)
    fd.append('file_keys', JSON.stringify(keys))
  }

  const res = await apiFetch(`${API_BASE}/api/analyze`, { method: 'POST', body: fd })
  return asJson<AnalyzeResult>(res)
}
