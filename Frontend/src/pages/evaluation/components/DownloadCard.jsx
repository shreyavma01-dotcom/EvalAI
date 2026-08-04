import { Download, FileImage, FileText, ImageIcon } from 'lucide-react'

function buildDownloadUrl(id, format, role = 'annotated') {
  const base = `/api/evaluation/${id}/download/page/1?role=${role}&format=${format}`
  return base
}

export function DownloadCard({ evaluationId, correctedPdfUrl }) {
  if (!evaluationId) return null

  return (
    <section className="rounded-[2rem] border border-[#D8ECE2] bg-white/85 p-6 shadow-[0_10px_32px_-18px_rgba(47,143,107,0.28)] backdrop-blur sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#2F8F6B] to-[#58C49B] text-white shadow-[0_10px_24px_-8px_rgba(47,143,107,0.55)]">
          <Download className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[#17332A]">Download corrected sheets</h2>
          <p className="text-sm text-[#5B746B]">Export the teacher-corrected notebook as images or a PDF.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={buildDownloadUrl(evaluationId, 'png')}
          download
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#D8ECE2] bg-[#F7FCF9] px-4 py-3 text-sm font-semibold text-[#17332A] transition-colors hover:border-[#2F8F6B] hover:bg-[#EAF8F0]"
        >
          <FileImage className="size-4 text-[#2F8F6B]" /> Corrected PNG
        </a>
        <a
          href={buildDownloadUrl(evaluationId, 'jpg')}
          download
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#D8ECE2] bg-[#F7FCF9] px-4 py-3 text-sm font-semibold text-[#17332A] transition-colors hover:border-[#2F8F6B] hover:bg-[#EAF8F0]"
        >
          <ImageIcon className="size-4 text-[#2F8F6B]" /> Corrected JPG
        </a>
        <a
          href={correctedPdfUrl || `/api/evaluation/${evaluationId}/download/corrected.pdf`}
          download
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#D8ECE2] bg-[#F7FCF9] px-4 py-3 text-sm font-semibold text-[#17332A] transition-colors hover:border-[#2F8F6B] hover:bg-[#EAF8F0]"
        >
          <FileText className="size-4 text-[#2F8F6B]" /> Corrected PDF
        </a>
      </div>
    </section>
  )
}

export default DownloadCard
