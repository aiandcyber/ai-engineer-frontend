import { useEffect, useMemo, useState } from 'react'
import * as api from './api/client'
import type { AnalyzeResult, Question, UseCase } from './api/types'
import { useRequireAuth } from './auth/useRequireAuth'
import { Header, type Tab } from './components/Header'
import { Stepper, type Phase } from './components/Stepper'
import { SetupView } from './components/SetupView'
import { IntakeView } from './components/IntakeView'
import { ResultsView } from './components/ResultsView'
import { ChatView } from './components/ChatView'

const MAX_ROUNDS = 2

function buildInputs(values: Record<string, string>, pack: UseCase | undefined): Record<string, unknown> {
  const numberKeys = new Set(pack?.required_inputs.filter((r) => r.kind === 'number').map((r) => r.key))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(values)) {
    if (v === '' || v == null) continue
    out[k] = numberKeys.has(k) ? Number(v) : v
  }
  return out
}

export default function App() {
  const ensureAuth = useRequireAuth()
  const [tab, setTab] = useState<Tab>('analysis')
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [useCaseName, setUseCaseName] = useState('')
  const [location, setLocation] = useState('Minnesota, USA')
  const [values, setValues] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<File[]>([])
  const [primary, setPrimary] = useState<string | null>(null)
  const [converter, setConverter] = useState('libredwg')

  const [phase, setPhase] = useState<Phase>('setup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<AnalyzeResult | null>(null)

  const pack = useMemo(() => useCases.find((u) => u.name === useCaseName), [useCases, useCaseName])

  useEffect(() => {
    api.listUseCases()
      .then((list) => { setUseCases(list); if (list[0]) setUseCaseName(list[0].name) })
      .catch((e: unknown) => setError(`Failed to load use cases: ${(e as Error).message}`))
  }, [])

  const handleResult = (res: AnalyzeResult) => {
    setSessionId(res.session_id)
    if (res.status === 'error') {
      setError(res.error ?? 'Analysis failed.')
      setPhase('setup')
      return
    }
    if (res.status === 'needs_input') {
      setQuestions(res.questions)
      setRound((r) => Math.min(r + 1, MAX_ROUNDS))
      setPhase('intake')
      return
    }
    setResult(res)
    setPhase('results')
  }

  const runAnalyze = async () => {
    if (!(await ensureAuth())) return
    setLoading(true); setError(null)
    try {
      const res = await api.analyze({
        useCase: useCaseName, location, sessionId: null,
        inputs: buildInputs(values, pack), files,
        primaryFilename: primary, converter,
      })
      handleResult(res)
    } catch (e: unknown) {
      setError((e as Error).message); setPhase('setup')
    } finally {
      setLoading(false)
    }
  }

  const submitIntake = async (answers: Record<string, string>) => {
    if (!(await ensureAuth())) return
    const merged = { ...values, ...answers }
    setValues(merged)
    setLoading(true); setError(null)
    try {
      const res = await api.analyze({
        useCase: useCaseName, location, sessionId,
        inputs: buildInputs(merged, pack), files: [],
        primaryFilename: primary, converter,
      })
      handleResult(res)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFiles([]); setPrimary(null); setValues({}); setResult(null)
    setSessionId(null); setQuestions([]); setRound(0); setError(null); setPhase('setup')
  }

  return (
    <div className="app">
      <Header tab={tab} onTab={setTab} />

      {tab === 'chat' ? (
        <main className="container">
          <ChatView useCase={useCaseName} />
        </main>
      ) : (
        <main className="container">
          <Stepper phase={phase} />

          {phase === 'setup' && (
            <SetupView
              useCases={useCases} useCaseName={useCaseName} onUseCase={setUseCaseName}
              location={location} onLocation={setLocation}
              values={values} onValue={(k, v) => setValues((s) => ({ ...s, [k]: v }))}
              files={files} onFiles={setFiles}
              primary={primary} onPrimary={setPrimary}
              converter={converter} onConverter={setConverter}
              onAnalyze={runAnalyze} loading={loading} error={error}
            />
          )}

          {phase === 'intake' && (
            <IntakeView
              questions={questions} round={Math.max(round, 1)} maxRounds={MAX_ROUNDS}
              loading={loading} onSubmit={submitIntake} onDefaults={() => submitIntake({})}
            />
          )}

          {phase === 'results' && result && (
            <ResultsView
              result={result}
              useCaseTitle={pack?.title ?? useCaseName}
              location={location}
              primaryName={primary}
              onNew={reset}
            />
          )}
        </main>
      )}
    </div>
  )
}
