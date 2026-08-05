import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpenCheck } from 'lucide-react'
import { teacherApi } from '@/services/submissions'
import { EvaluationStudioPage } from '@/pages/evaluation/EvaluationPage'
import { Skeleton } from '@/components/feedback/Skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Card, CardContent } from '@/components/common/Card'

/**
 * Teacher-only AI evaluation studio for one submission.
 * Loads the submission's uploaded answer sheets, converts them to local File
 * objects and hands them to the evaluation studio so the teacher can re-run
 * or extend the AI review without touching the stored result.
 */
export function TeacherEvaluatePage() {
  const { submissionId } = useParams()
  const [readyFiles, setReadyFiles] = useState(null)
  const [loadError, setLoadError] = useState('')
  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-submission', submissionId],
    queryFn: () => teacherApi.submission(submissionId),
    enabled: Boolean(submissionId),
  })

  useEffect(() => {
    if (!data?.answerSheet?.length) return
    let cancelled = false
    setLoadError('')
    setReadyFiles(null)

    ;(async () => {
      try {
        const sheets = data.answerSheet
        const files = await Promise.all(
          sheets.map(async (sheet, index) => {
            const response = await fetch(sheet.fileUrl)
            if (!response.ok) throw new Error(`Could not download page ${index + 1} (${sheet.originalName}).`)
            const blob = await response.blob()
            const name = sheet.originalName || `page-${sheet.pageNumber ?? index + 1}.png`
            return new File([blob], name, { type: sheet.mimeType || 'image/png' })
          }),
        )
        if (!cancelled) setReadyFiles(files)
      } catch (err) {
        if (!cancelled) setLoadError(err?.message ?? 'Failed to load the answer sheets for this submission.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6">
        <Skeleton className="h-24 w-full rounded-[2rem]" />
        <Skeleton className="h-96 w-full rounded-[2rem]" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <ErrorState title="Submission not found" description="This submission is unavailable or was removed.">
        <span className="text-sm text-muted">Return to the review queue to pick another submission.</span>
      </ErrorState>
    )
  }

  if (!data.answerSheet?.length) {
    return (
      <ErrorState title="No answer sheets found" description="This submission has no image answer sheets the AI can evaluate.">
        <span className="text-sm text-muted">Only image submissions support the AI teacher review.</span>
      </ErrorState>
    )
  }

  if (loadError) {
    return (
      <ErrorState title="Could not load the sheets" description={loadError}>
        <span className="text-sm text-muted">Check the original sheets in the submission and try again.</span>
      </ErrorState>
    )
  }

  if (!readyFiles) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Card variant="default" radius="lg" padding="lg">
          <CardContent className="flex items-center gap-3">
            <BookOpenCheck className="size-5 text-muted" />
            <span className="text-sm text-muted">Preparing the answer sheets for evaluation…</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <EvaluationStudioPage initialFiles={readyFiles} submissionId={submissionId} submission={data} autoRun={data.status !== 'evaluated'} />
}

export default TeacherEvaluatePage