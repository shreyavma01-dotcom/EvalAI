import { Sparkles, Target } from 'lucide-react'

export function TeacherFeedback({ feedback, topicsToImprove }) {
  const topics = topicsToImprove?.length ? topicsToImprove : []

  return (
    <section className="rounded-[2rem] border border-[#D8ECE2] bg-white/85 p-6 shadow-[0_10px_32px_-18px_rgba(47,143,107,0.28)] backdrop-blur sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#2F8F6B] to-[#58C49B] text-white shadow-[0_10px_24px_-8px_rgba(47,143,107,0.55)]">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[#17332A]">Teacher feedback</h2>
          <p className="text-sm text-[#5B746B]">A concise note for the student, framed like a teacher’s review.</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-[#D8ECE2] bg-[#F7FCF9] p-5">
        <p className="text-lg leading-8 text-[#17332A]">
          {feedback || 'The student shows a thoughtful attempt. A few ideas need more careful revision and practice.'}
        </p>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#17332A]">
          <Target className="size-4 text-[#2F8F6B]" /> Topics to improve
        </div>
        {topics.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {topics.map((topic) => (
              <span key={topic} className="rounded-full border border-[#D8ECE2] bg-[#F7FCF9] px-3 py-1.5 text-sm text-[#2F8F6B]">
                {topic}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#5B746B]">The teacher notes will highlight the next focus areas here.</p>
        )}
      </div>
    </section>
  )
}

export default TeacherFeedback
