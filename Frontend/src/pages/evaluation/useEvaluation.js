import { useCallback, useEffect, useRef, useState } from 'react'
import { evaluationsApi } from '@/services/evaluations'
import { getSocket, joinEvaluationRoom, leaveEvaluationRoom } from '@/services/socket'
import { buildResult } from './resultShape'

export const PHASES = {
  idle: 'idle',
  processing: 'processing',
  complete: 'complete',
  error: 'error',
}

export const EVAL_STEPS = [
  { label: 'Uploading', sub: 'Uploading page images' },
  { label: 'Preparing', sub: 'Preparing the pages for review' },
  { label: 'OCR', sub: 'Reading handwriting with real OCR' },
  { label: 'Sending to Gemini', sub: 'Forwarding pages to Gemini Flash' },
  { label: 'Evaluating', sub: 'Reading each response and forming teacher notes' },
  { label: 'Annotating', sub: 'Drawing teacher annotations on the sheets' },
  { label: 'Report', sub: 'Generating the corrected notebook and feedback' },
]

const STAGE_INDEX = {
  uploading: 0,
  preparing: 1,
  ocr: 2,
  sending: 3,
  evaluating: 4,
  annotating: 5,
  report: 6,
  completed: 7,
}

const STAGE_LOG = {
  uploading: 'Uploading answer sheet pages',
  preparing: 'Preparing the pages for review',
  ocr: 'Reading the handwriting with OCR',
  sending: 'Sending pages to Gemini Flash',
  evaluating: 'Reviewing each response with teacher-style notes',
  annotating: 'Drawing teacher annotations on the sheets',
  report: 'Preparing the corrected notebook and feedback',
  completed: 'Review complete',
}

function stepForPercent(percent) {
  return Math.min(EVAL_STEPS.length - 1, Math.floor((percent / 100) * EVAL_STEPS.length))
}

/**
 * Real evaluation state machine. Post the uploaded pages to the backend,
 * which performs genuine OCR + Gemini evaluation. Progress comes from real
 * socket.io pipeline events. There is no demo data or fake timing.
 */
export function useEvaluation() {
  const [phase, setPhase] = useState(PHASES.idle)
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState({ percent: 0, currentStep: 0, label: EVAL_STEPS[0].label, message: '' })
  const [logs, setLogs] = useState([])
  const [agentEvents, setAgentEvents] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(null)
  const startRef = useRef(0)

  useEffect(() => {
    return () => {
      if (elapsedRef.current) window.clearInterval(elapsedRef.current)
      leaveEvaluationRoom()
    }
  }, [])

  const applyProgress = useCallback((percent, stage, message) => {
    const clamped = Math.min(100, Math.max(0, Math.round(percent)))
    const currentStep = stage !== undefined ? STAGE_INDEX[stage] ?? stepForPercent(clamped) : stepForPercent(clamped)
    setProgress({
      percent: clamped,
      currentStep,
      label: EVAL_STEPS[currentStep]?.label ?? '',
      message: message ?? '',
    })
  }, [])

  const pushLog = useCallback((entry) => {
    const message = entry?.message ?? entry
    if (!message) return
    setLogs((prev) => [...prev.slice(-40), { time: new Date(), message }])
  }, [])

  // Agent Activity Timeline events — structured agent:trace socket updates.
  const pushAgentEvent = useCallback((event) => {
    if (!event?.type) return
    setAgentEvents((prev) => [
      ...prev.slice(-79),
      {
        type: event.type,
        step: event.step ?? null,
        title: event.title ?? '',
        message: event.message ?? '',
        metadata: event.metadata ?? null,
        timestamp: event.timestamp ?? new Date().toISOString(),
      },
    ])
  }, [])

  const reset = useCallback(() => {
    if (elapsedRef.current) window.clearInterval(elapsedRef.current)
    setPhase(PHASES.idle)
    setProgress({ percent: 0, currentStep: 0, label: EVAL_STEPS[0].label, message: '' })
    setLogs([])
    setAgentEvents([])
    setResult(null)
    setError('')
    setElapsed(0)
  }, [])

  const canRun = files.length > 0 && phase !== PHASES.processing && phase !== PHASES.complete

  const run = useCallback(async () => {
    if (!canRun) return

    setPhase(PHASES.processing)
    setError('')
    setElapsed(0)
    setLogs([])
    startRef.current = Date.now()

    if (elapsedRef.current) window.clearInterval(elapsedRef.current)
    elapsedRef.current = window.setInterval(() => {
      setElapsed(Math.round((Date.now() - startRef.current) / 1000))
    }, 1000)

    const evaluationId =
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    const socket = getSocket()
    joinEvaluationRoom(evaluationId)

    const onSocketProgress = (payload) => {
      if (!payload || payload.evaluationId !== evaluationId) return
      applyProgress(payload.percent, payload.stage, payload.message)
      pushLog(payload.message ?? STAGE_LOG[payload.stage])
    }
    socket.on('evaluation:progress', onSocketProgress)

    const onAgentTrace = (payload) => {
      if (!payload || payload.evaluationId !== evaluationId) return
      pushAgentEvent(payload)
    }
    socket.on('agent:trace', onAgentTrace)

    try {
      applyProgress(2, 'uploading', STAGE_LOG.uploading)
      pushLog(STAGE_LOG.uploading)
      const data = await evaluationsApi.evaluate({
        answerSheets: files,
        evaluationId,
      })
      applyProgress(100, 'completed', STAGE_LOG.completed)
      pushLog(STAGE_LOG.completed)
      const built = buildResult(data)
      setResult(built)
      // Rehydrate the full persisted agent trace so the timeline stays
      // complete (and survives refreshes backed by the saved record).
      if (built.agentTrace?.length) setAgentEvents(built.agentTrace)
      setPhase(PHASES.complete)
    } catch (err) {
      const message = err?.response?.data?.message ?? 'Evaluation failed. Please try again.'
      setError(message)
      setPhase(PHASES.error)
    } finally {
      if (elapsedRef.current) window.clearInterval(elapsedRef.current)
      setElapsed(Math.round((Date.now() - startRef.current) / 1000))
      socket.off('evaluation:progress', onSocketProgress)
      socket.off('agent:trace', onAgentTrace)
      leaveEvaluationRoom(evaluationId)
    }
  }, [canRun, files, applyProgress, pushLog, pushAgentEvent])

  return {
    phase,
    files,
    setFiles,
    progress,
    logs,
    agentEvents,
    result,
    elapsed,
    error,
    run,
    reset,
    canRun,
  }
}

export default useEvaluation
