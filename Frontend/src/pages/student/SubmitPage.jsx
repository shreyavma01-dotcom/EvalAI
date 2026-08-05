import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, FileImage, FileText, ImagePlus, Loader2, Trash2, UploadCloud, X } from 'lucide-react'
import { toast } from 'sonner'
import { studentApi } from '@/services/submissions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { formatBytes } from '@/utils/format'
import { cn } from '@/utils/cn'

const ACCEPTED = { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'], 'image/heic': ['.heic'], 'image/heif': ['.heif'] }
const MAX_PAGES = 100

const schema = z.object({
  subject: z.string().trim().min(1, 'Subject is required.').max(80, 'Subject is too long.'),
  title: z.string().trim().min(1, 'Title is required.').max(120, 'Title is too long.'),
  description: z.string().trim().max(500, 'Description is too long.').optional(),
  remarks: z.string().trim().max(500, 'Remarks are too long.').optional(),
})

function previewFor(file) {
  if (!file) return null
  if (file.type.startsWith('image/')) return URL.createObjectURL(file)
  return null
}

export function SubmitPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [answerFiles, setAnswerFiles] = useState([])
  const [questionFiles, setQuestionFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [created, setCreated] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', title: '', description: '', remarks: '' },
  })

  const answerDrop = useDropzone({
    accept: ACCEPTED,
    maxFiles: MAX_PAGES,
    multiple: true,
    onDrop: (accepted, rejected) => {
      setUploadError('')
      if (rejected.length > 0) setUploadError('Some files were skipped (images only, up to 100 pages).')
      setAnswerFiles((prev) => [...prev, ...accepted].slice(0, MAX_PAGES))
    },
  })

  const questionDrop = useDropzone({
    accept: { 'application/pdf': ['.pdf'], ...ACCEPTED },
    maxFiles: 10,
    multiple: true,
    onDrop: (accepted, rejected) => {
      if (rejected.length > 0) setUploadError('Question paper must be a PDF or an image.')
      setQuestionFiles((prev) => [...prev, ...accepted].slice(0, 10))
    },
  })

  const movePage = (index, direction) => {
    setAnswerFiles((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const onSubmit = async (values) => {
    setUploadError('')
    if (answerFiles.length === 0) {
      setUploadError('Please attach at least one answer sheet page.')
      return
    }
    setSubmitting(true)
    try {
      const submission = await studentApi.createSubmission({
        ...values,
        answerFiles,
        questionFiles,
      })
      setCreated(submission)
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
      toast.success('Submission received. AI evaluation has started in the background.')
    } catch (err) {
      setUploadError(err?.response?.data?.message ?? 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card variant="gradient" radius="xl" padding="xl" className="items-center text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-success-muted text-success-strong">
            <CheckCircle2 className="size-8" />
          </span>
          <CardHeader className="items-center">
            <CardTitle className="text-xl">Submission received</CardTitle>
            <CardDescription className="max-w-md text-center">
              The AI teacher is reading {created.answerSheet?.length ?? answerFiles.length} page(s) now. You will get a
              notification when the result is ready.
            </CardDescription>
          </CardHeader>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => navigate('/student/results')}>View my results</Button>
            <Button variant="outline" onClick={() => setCreated(null)}>
              Submit another sheet
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Submit an answer sheet</h1>
        <p className="mt-1 text-sm text-muted">
          Upload the handwritten pages. Gemini Flash reads them and produces a teacher-style review automatically.
        </p>
      </div>

      <Card variant="default" radius="lg" padding="lg">
        <CardHeader>
          <CardTitle>Assignment details</CardTitle>
          <CardDescription className="mt-1">These fields help the teacher find and understand your submission.</CardDescription>
        </CardHeader>
        <CardContent className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input label="Subject" placeholder="Mathematics" error={errors.subject?.message} {...register('subject')} />
          <Input label="Assignment title" placeholder="Chapter 5 — Quadratic Equations" error={errors.title?.message} {...register('title')} />
          <Textarea
            className="sm:col-span-2"
            label="Description (optional)"
            rows={3}
            placeholder="Short note about the assignment, class or test."
            error={errors.description?.message}
            {...register('description')}
          />
          <Textarea
            className="sm:col-span-2"
            label="Remarks to the teacher (optional)"
            rows={2}
            placeholder="Anything specific you want the teacher to know."
            error={errors.remarks?.message}
            {...register('remarks')}
          />
        </CardContent>
      </Card>

      <Card variant="default" radius="lg" padding="lg">
        <CardHeader>
          <CardTitle>Answer sheets</CardTitle>
          <CardDescription className="mt-1">
            Page order matters — reorder so page 1 is the first sheet. Up to {MAX_PAGES} images.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-5">
          <div
            {...answerDrop.getRootProps()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors',
              answerDrop.isDragActive ? 'border-primary bg-primary-muted/50' : 'border-border-strong bg-background-soft hover:border-primary/60',
            )}
          >
            <input {...answerDrop.getInputProps()} />
            <span className="grid size-14 place-items-center rounded-2xl bg-primary-muted text-primary-strong">
              <UploadCloud className="size-7" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {answerDrop.isDragActive ? 'Drop the pages here' : 'Drag pages here or click to browse'}
              </p>
              <p className="mt-1 text-xs text-muted">PNG, JPG, WEBP or HEIC · up to 100 pages</p>
            </div>
          </div>

          {answerFiles.length > 0 ? (
            <div className="mt-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">{answerFiles.length} page(s)</span>
                <button
                  type="button"
                  onClick={() => setAnswerFiles([])}
                  className="flex items-center gap-1 text-xs font-semibold text-danger-strong hover:underline"
                >
                  <Trash2 className="size-3.5" /> Clear all
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {answerFiles.map((file, index) => {
                  const preview = previewFor(file)
                  return (
                    <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface p-2.5">
                      <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-background-soft">
                        {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <FileImage className="size-5 text-muted" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">
                          {index + 1}. {file.name}
                        </div>
                        <div className="text-xs text-muted">{formatBytes(file.size)}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" disabled={index === 0} onClick={() => movePage(index, -1)} className="grid size-7 place-items-center rounded-lg border border-border text-muted transition-colors hover:bg-background-soft disabled:opacity-40" aria-label="Move up">
                          ↑
                        </button>
                        <button type="button" disabled={index === answerFiles.length - 1} onClick={() => movePage(index, 1)} className="grid size-7 place-items-center rounded-lg border border-border text-muted transition-colors hover:bg-background-soft disabled:opacity-40" aria-label="Move down">
                          ↓
                        </button>
                        <button type="button" onClick={() => setAnswerFiles((prev) => prev.filter((_, i) => i !== index))} className="grid size-7 place-items-center rounded-lg text-danger-strong transition-colors hover:bg-danger/10" aria-label="Remove">
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card variant="default" radius="lg" padding="lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4.5 text-muted" /> Question paper (optional)
          </CardTitle>
          <CardDescription className="mt-1">Add the PDF or image of the question paper for the teacher’s reference.</CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <div {...questionDrop.getRootProps()} className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border-strong bg-background-soft px-4 py-7 text-center transition-colors hover:border-primary/60">
            <input {...questionDrop.getInputProps()} />
            <ImagePlus className="size-5 text-muted" />
            <span className="text-sm font-medium text-muted">Click to attach the question paper</span>
          </div>
          {questionFiles.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {questionFiles.map((file, index) => (
                <span key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-1.5 text-xs font-medium text-foreground">
                  <FileText className="size-3.5 text-muted" />
                  {file.name}
                  <button type="button" onClick={() => setQuestionFiles((prev) => prev.filter((_, i) => i !== index))} className="text-muted hover:text-danger-strong" aria-label="Remove">
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {uploadError ? (
        <p className="rounded-xl border border-danger/25 bg-danger/5 px-3 py-2.5 text-sm text-danger-strong">{uploadError}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/student/dashboard" className="text-sm font-semibold text-muted hover:text-foreground">
          Cancel
        </Link>
        <Button type="submit" size="xl" loading={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
          Submit for evaluation
        </Button>
      </div>
    </form>
  )
}

export default SubmitPage