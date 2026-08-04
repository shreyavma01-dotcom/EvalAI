import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, ChevronLeft, ChevronRight, ClipboardPaste, FileImage, ImagePlus, ScanLine, X } from 'lucide-react'
import { cn } from '@/utils/cn'

const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
}

const MAX_PAGES = 100

/**
 * Step 1 — Upload Answer Sheets. Only the handwritten pages are needed.
 * Drag & drop, paste, camera and gallery capture, multiple pages up to 100,
 * thumbnails with delete and reorder. HEIC is accepted (converted server-side);
 * browsers that can't preview it show a labelled placeholder instead.
 */
export function UploadCard({ files, onFiles, disabled }) {
  const [previews, setPreviews] = useState([])
  const [broken, setBroken] = useState({})
  const inputRef = useRef(null)

  useEffect(() => {
    const urls = files.map((file) => (file.type?.startsWith('image/') ? URL.createObjectURL(file) : ''))
    setPreviews(urls)
    setBroken({})
    return () => urls.forEach((url) => url && URL.revokeObjectURL(url))
  }, [files])

  const handleNewFiles = useCallback(
    (incoming) => {
      if (!incoming?.length || disabled) return
      const room = MAX_PAGES - files.length
      if (room <= 0) return
      const deduped = incoming
        .filter((f) => f.type?.startsWith('image/'))
        .slice(0, room)
      if (deduped.length) onFiles([...files, ...deduped])
    },
    [files, onFiles, disabled],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED,
    multiple: true,
    maxFiles: MAX_PAGES,
    disabled,
    onDrop: handleNewFiles,
  })

  // Paste images from the clipboard (Cmd/Ctrl+V).
  useEffect(() => {
    if (disabled) return
    const onPaste = (event) => {
      const items = Array.from(event.clipboardData?.items ?? []).filter((item) => item.kind === 'file')
      if (!items.length) return
      event.preventDefault()
      const pasted = items.map((item) => item.getAsFile()).filter(Boolean)
      handleNewFiles(pasted)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleNewFiles, disabled])

  const removeFile = (index) => onFiles(files.filter((_, i) => i !== index))

  const moveFile = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= files.length) return
    const next = [...files]
    ;[next[index], next[target]] = [next[target], next[index]]
    onFiles(next)
  }

  const triggerSource = () => inputRef.current?.click()

  const isHeic = (file) => /heic|heif/i.test(file.type || file.name || '')

  return (
    <section className="relative rounded-3xl border border-[#D8ECE2] bg-white/85 p-5 shadow-[0_8px_30px_-14px_rgba(47,143,107,0.18)] backdrop-blur sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#2F8F6B] to-[#58C49B] text-white shadow-[0_6px_16px_-6px_rgba(47,143,107,0.5)]">
            <ScanLine className="size-5" />
          </span>
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-[#17332A]">Upload answer sheets</h2>
            <p className="text-xs text-[#5B746B]">Handwritten pages only — Gemini reads them itself</p>
          </div>
        </div>
        {files.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#35B36E]/10 px-2.5 py-1 text-xs font-semibold text-[#35B36E]">
            <FileImage className="size-3.5" />
            {files.length} page{files.length > 1 ? 's' : ''}
          </span>
        ) : null}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {files.length > 0 ? (
          <motion.div
            key="preview-grid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-2.5"
          >
            <div className="grid max-h-80 grid-cols-2 gap-2.5 overflow-y-auto rounded-2xl border border-[#D8ECE2] bg-[#F3FAF7] p-2.5 sm:grid-cols-3 md:grid-cols-4">
              {files.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-[#D8ECE2] bg-white"
                >
                  {previews[index] && !broken[index] ? (
                    <img
                      src={previews[index]}
                      alt={`Page ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={() => setBroken((b) => ({ ...b, [index]: true }))}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-2 text-center">
                      <ImagePlus className="size-5 text-[#58C49B]" />
                      <span className="line-clamp-3 break-all text-[9px] font-medium text-[#5B746B]">
                        {file.name || `page-${index + 1}`}
                      </span>
                      {isHeic(file) ? (
                        <span className="rounded-full bg-[#2F8F6B]/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-[#2F8F6B]">
                          HEIC
                        </span>
                      ) : null}
                    </div>
                  )}
                  <span className="absolute left-1.5 top-1.5 grid size-5 place-items-center rounded-lg bg-[#2F8F6B]/90 text-[10px] font-bold text-white shadow-sm">
                    {index + 1}
                  </span>
                  {!disabled ? (
                    <>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        aria-label={`Remove page ${index + 1}`}
                        className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-[#E15252] group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 to-transparent px-1.5 pb-1.5 pt-5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => moveFile(index, -1)}
                          disabled={index === 0}
                          aria-label="Move page earlier"
                          className="grid size-6 place-items-center rounded-lg bg-white/85 text-[#2F8F6B] transition-colors hover:bg-white disabled:opacity-30"
                        >
                          <ChevronLeft className="size-3.5" />
                        </button>
                        <span className="text-[9px] font-semibold text-white">reorder</span>
                        <button
                          type="button"
                          onClick={() => moveFile(index, 1)}
                          disabled={index === files.length - 1}
                          aria-label="Move page later"
                          className="grid size-6 place-items-center rounded-lg bg-white/85 text-[#2F8F6B] transition-colors hover:bg-white disabled:opacity-30"
                        >
                          <ChevronRight className="size-3.5" />
                        </button>
                      </div>
                    </>
                  ) : null}
                </motion.div>
              ))}
              {!disabled ? (
                <button
                  type="button"
                  onClick={triggerSource}
                  className="flex aspect-[3/4] items-center justify-center rounded-xl border-2 border-dashed border-[#58C49B]/60 bg-white text-[#2F8F6B] transition-colors hover:border-[#2F8F6B]/60 hover:bg-[#F3FAF7]"
                  aria-label="Add another page"
                >
                  <ImagePlus className="size-5" />
                </button>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-[#5B746B]">
                {files.length} of {MAX_PAGES} pages · JPG, PNG, JPEG, WebP, HEIC · evaluated in order
              </p>
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => onFiles([])}
                  className="text-[11px] font-semibold text-[#E15252] transition-colors hover:text-[#C03434]"
                >
                  Clear all
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            {...getRootProps()}
            className={cn(
              'flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-all duration-200',
              isDragActive
                ? 'scale-[1.01] border-[#2F8F6B] bg-[#2F8F6B]/5'
                : 'border-[#58C49B]/60 bg-[#F3FAF7] hover:border-[#2F8F6B]/60 hover:bg-[#2F8F6B]/[0.03]',
            )}
          >
            <input {...getInputProps()} />
            <motion.span
              animate={isDragActive ? { scale: 1.12, rotate: -4 } : { scale: 1, rotate: 0 }}
              className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-[#2F8F6B] to-[#58C49B] text-white shadow-[0_10px_24px_-8px_rgba(47,143,107,0.55)]"
            >
              {isDragActive ? <ImagePlus className="size-7" /> : <ScanLine className="size-7" />}
            </motion.span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[#17332A]">
                {isDragActive ? 'Drop the pages to upload' : 'Drag & drop handwritten pages'}
              </p>
              <p className="text-xs text-[#5B746B]">JPG, PNG, JPEG, WebP or HEIC · up to 100 pages</p>
            </div>
            <div className="grid w-full grid-cols-3 gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  inputRef.current?.click()
                }}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#D8ECE2] bg-white text-xs font-semibold text-[#17332A] transition-all hover:border-[#2F8F6B]/50 hover:shadow-sm active:scale-[0.98]"
              >
                <Camera className="size-4 text-[#2F8F6B]" /> Camera
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  triggerSource()
                }}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#D8ECE2] bg-white text-xs font-semibold text-[#17332A] transition-all hover:border-[#2F8F6B]/50 hover:shadow-sm active:scale-[0.98]"
              >
                <ImagePlus className="size-4 text-[#2F8F6B]" /> Gallery
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  inputRef.current?.click()
                }}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#D8ECE2] bg-white text-xs font-semibold text-[#17332A] transition-all hover:border-[#2F8F6B]/50 hover:shadow-sm active:scale-[0.98]"
              >
                <ClipboardPaste className="size-4 text-[#2F8F6B]" /> Paste
              </button>
            </div>
            <p className="text-[10px] text-[#8FAAA0]">Tip: press Ctrl / ⌘ + V to paste a screenshot · PDF not supported</p>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        capture="environment"
        className="hidden"
        onChange={(event) => handleNewFiles(Array.from(event.target.files ?? []))}
      />
    </section>
  )
}

export default UploadCard