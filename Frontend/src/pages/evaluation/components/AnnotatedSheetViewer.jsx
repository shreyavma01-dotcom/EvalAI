import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Columns2, ListOrdered, Maximize2, Minus, Move, Plus, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { clamp } from '@/utils/format'

const STATUS_COLORS = {
  correct: '#35B36E',
  partial: '#F4A62A',
  incorrect: '#E15252',
  unattempted: '#8FAAA0',
}

const LEGEND = [
  { label: 'Correct', color: '#35B36E' },
  { label: 'Partial', color: '#F4A62A' },
  { label: 'Incorrect', color: '#E15252' },
  { label: 'Not attempted', color: '#8FAAA0' },
]

export function AnnotatedSheetViewer({ pages: pagesProp, questions: questionsProp, sheet }) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [activePage, setActivePage] = useState(0)
  const [viewMode, setViewMode] = useState('split')
  const [slider, setSlider] = useState(50)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const dragging = useRef(false)
  const start = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const pages = useMemo(() => pagesProp ?? sheet?.pages ?? [], [pagesProp, sheet])
  const questions = useMemo(() => questionsProp ?? sheet?.answers ?? [], [questionsProp, sheet])
  const active = pages[activePage]
  const originalSrc = active?.originalUrl ?? ''
  const annotatedSrc = active?.annotatedUrl ?? ''
  const pageQuestions = questions.filter((question) => question.page === activePage + 1)

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const zoomIn = () => setZoom((z) => clamp(z + 0.25, 1, 3))
  const zoomOut = () => setZoom((z) => clamp(z - 0.25, 1, 3))
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }
  const goToPage = (index) => {
    setActivePage(clamp(index, 0, Math.max(0, pages.length - 1)))
    resetView()
  }
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {})
    } else {
      await document.exitFullscreen().catch(() => {})
    }
  }

  const onPointerDown = (event) => {
    dragging.current = true
    start.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
  }
  const onPointerMove = (event) => {
    if (!dragging.current || zoom <= 1) return
    setPan({
      x: start.current.panX + (event.clientX - start.current.x),
      y: start.current.panY + (event.clientY - start.current.y),
    })
  }
  const onPointerUp = () => {
    dragging.current = false
  }

  if (pages.length === 0) {
    return (
      <section className="rounded-[2rem] border border-[#D8ECE2] bg-white/85 p-6 shadow-[0_10px_32px_-18px_rgba(47,143,107,0.28)] backdrop-blur">
        <h2 className="text-base font-semibold text-[#17332A]">Annotated sheets</h2>
        <p className="mt-2 text-sm text-[#5B746B]">The corrected pages will appear here once the review completes.</p>
      </section>
    )
  }

  return (
    <section className="rounded-[2rem] border border-[#D8ECE2] bg-white/85 p-6 shadow-[0_10px_32px_-18px_rgba(47,143,107,0.28)] backdrop-blur sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#17332A]">Annotated sheets</h2>
          <p className="text-sm text-[#5B746B]">Compare the original handwriting with the teacher-corrected sheet.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl border border-[#D8ECE2] bg-white p-1 shadow-sm">
            <button type="button" onClick={() => setViewMode('split')} className={cn('flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold', viewMode === 'split' ? 'bg-[#EAF8F0] text-[#2F8F6B]' : 'text-[#5B746B]')}>
              <Columns2 className="size-3.5" /> Split view
            </button>
            <button type="button" onClick={() => setViewMode('slider')} className={cn('flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold', viewMode === 'slider' ? 'bg-[#EAF8F0] text-[#2F8F6B]' : 'text-[#5B746B]')}>
              <SlidersHorizontal className="size-3.5" /> Before / after
            </button>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl border border-[#D8ECE2] bg-white p-1 shadow-sm">
            <button type="button" onClick={zoomOut} disabled={zoom <= 1} aria-label="Zoom out" className="grid size-7 place-items-center rounded-xl text-[#5B746B] transition-colors hover:bg-[#E4F3EB] hover:text-[#17332A] disabled:opacity-40">
              <Minus className="size-3.5" />
            </button>
            <span className="w-9 text-center text-xs font-semibold tabular-nums text-[#17332A]">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={zoomIn} aria-label="Zoom in" className="grid size-7 place-items-center rounded-xl text-[#5B746B] transition-colors hover:bg-[#E4F3EB] hover:text-[#17332A]">
              <Plus className="size-3.5" />
            </button>
            <span className="mx-0.5 h-4 w-px bg-[#D8ECE2]" />
            <button type="button" onClick={resetView} aria-label="Reset view" className="grid size-7 place-items-center rounded-xl text-[#5B746B] transition-colors hover:bg-[#E4F3EB] hover:text-[#17332A]">
              <RotateCcw className="size-3.5" />
            </button>
            <button type="button" onClick={toggleFullscreen} aria-label="Fullscreen" className="grid size-7 place-items-center rounded-xl text-[#5B746B] transition-colors hover:bg-[#E4F3EB] hover:text-[#17332A]">
              <Maximize2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[96px_1fr]">
        <div className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-y-auto">
          {pages.map((page, index) => (
            <button
              key={page.pageNumber ?? index}
              type="button"
              onClick={() => goToPage(index)}
              className={cn('relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all', index === activePage ? 'border-[#2F8F6B] ring-2 ring-[#2F8F6B]/20' : 'border-[#D8ECE2] hover:border-[#58C49B]')}
              aria-label={`Go to page ${page.pageNumber ?? index + 1}`}
            >
              <img src={page.annotatedUrl} alt={`Page ${page.pageNumber ?? index + 1}`} className="h-full w-full object-cover" />
              <span className="absolute bottom-1 right-1 rounded bg-black/55 px-1 text-[9px] font-bold text-white">{page.pageNumber ?? index + 1}</span>
            </button>
          ))}
        </div>

        <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-[#D8ECE2] bg-[#F3FAF7] p-3">
          <div className="relative flex items-center justify-between border-b border-[#D8ECE2] bg-white/80 px-3 py-2 backdrop-blur">
            <button type="button" onClick={() => goToPage(activePage - 1)} disabled={activePage === 0} className="grid size-7 place-items-center rounded-xl text-[#5B746B] transition-colors hover:bg-[#E4F3EB] hover:text-[#17332A] disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs font-semibold text-[#17332A]">Page {activePage + 1} · {viewMode === 'split' ? 'Split view' : 'Before / after'}</span>
            <button type="button" onClick={() => goToPage(activePage + 1)} disabled={activePage >= pages.length - 1} className="grid size-7 place-items-center rounded-xl text-[#5B746B] transition-colors hover:bg-[#E4F3EB] hover:text-[#17332A] disabled:opacity-40" aria-label="Next page">
              <ChevronRight className="size-4" />
            </button>
          </div>

          {viewMode === 'split' ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#D8ECE2] bg-white p-2">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5B746B]">Original</div>
                <div className={cn('overflow-hidden rounded-xl', zoom > 1 && 'cursor-grab active:cursor-grabbing')} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
                  <motion.div className="relative origin-top-left select-none" animate={{ scale: zoom, x: pan.x, y: pan.y }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} style={{ touchAction: 'none' }}>
                    {originalSrc ? <img src={originalSrc} alt={`Original page ${activePage + 1}`} className="block w-full" /> : <div className="flex min-h-64 items-center justify-center bg-white px-6 py-16 text-xs text-[#5B746B]">Original image unavailable.</div>}
                  </motion.div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#D8ECE2] bg-white p-2">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5B746B]">Corrected</div>
                <div className={cn('overflow-hidden rounded-xl', zoom > 1 && 'cursor-grab active:cursor-grabbing')} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
                  <motion.div className="relative origin-top-left select-none" animate={{ scale: zoom, x: pan.x, y: pan.y }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} style={{ touchAction: 'none' }}>
                    {annotatedSrc ? <img src={annotatedSrc} alt={`Corrected page ${activePage + 1}`} className="block w-full" /> : <div className="flex min-h-64 items-center justify-center bg-white px-6 py-16 text-xs text-[#5B746B]">Corrected image unavailable.</div>}
                  </motion.div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-[#D8ECE2] bg-white">
              <div className={cn('overflow-hidden', zoom > 1 && 'cursor-grab active:cursor-grabbing')} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
                <motion.div className="relative origin-top-left select-none" animate={{ scale: zoom, x: pan.x, y: pan.y }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} style={{ touchAction: 'none' }}>
                  {originalSrc ? <img src={originalSrc} alt={`Original page ${activePage + 1}`} className="block w-full" /> : <div className="flex min-h-64 items-center justify-center bg-white px-6 py-16 text-xs text-[#5B746B]">Original image unavailable.</div>}
                </motion.div>
              </div>
              {annotatedSrc ? (
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}>
                  <img src={annotatedSrc} alt={`Corrected page ${activePage + 1}`} className="block h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="absolute inset-x-3 bottom-3 rounded-full border border-white/70 bg-[#17332A]/75 px-3 py-2 text-[11px] font-medium text-white shadow-lg backdrop-blur">
                <input type="range" min="0" max="100" value={slider} onChange={(event) => setSlider(Number(event.target.value))} className="w-full accent-[#58C49B]" />
              </div>
            </div>
          )}

          {zoom > 1 ? (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-[#17332A]/80 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur-sm">
              <Move className="size-3" /> Drag to pan
            </div>
          ) : null}

          {isFullscreen ? <div className="absolute right-3 top-3 rounded-full bg-[#17332A]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white">Fullscreen</div> : null}
        </div>
      </div>

      {pageQuestions.length > 0 ? (
        <div className="mt-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#5B746B]">
            <ListOrdered className="size-3.5" /> Questions on this page
          </div>
          <div className="flex flex-wrap gap-2">
            {pageQuestions.map((question) => {
              const color = STATUS_COLORS[question.status] ?? STATUS_COLORS.incorrect
              return (
                <span key={question.id ?? question.questionNumber} className="flex items-center gap-1.5 rounded-xl border bg-white/70 px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: `${color}55`, color }}>
                  Q{question.questionNumber}
                </span>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3 text-[11px] text-[#5B746B]">
        {LEGEND.map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} /> {label}
          </span>
        ))}
      </div>
    </section>
  )
}

export default AnnotatedSheetViewer
