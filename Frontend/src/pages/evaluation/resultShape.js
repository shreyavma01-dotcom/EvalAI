/**
 * Maps a backend evaluation record into the teacher-style shape the page
 * renders. Everything here comes from the real pipeline — nothing is mocked.
 * Marks and confidence are carried for the teacher's review step, the review
 * components themselves still render the notebook-style verdict.
 */
export function buildResult(record = {}) {
  const questions = Array.isArray(record?.questions) ? record.questions : []

  const mappedQuestions = questions.map((q, index) => ({
    id: `${q.page ?? 1}-${q.questionNumber ?? index + 1}`,
    questionNumber: q.questionNumber ?? index + 1,
    page: q.page ?? 1,
    question: q.question ?? '',
    studentAnswer: q.studentAnswer ?? '',
    bbox: q.bbox ?? null,
    status: q.status ?? 'incorrect',
    correctedAnswer: q.correctedAnswer ?? '',
    whyWrong: q.whyWrong ?? '',
    missingPoints: Array.isArray(q.missingPoints) ? q.missingPoints : [],
    suggestion: q.suggestion ?? '',
    teacherComment: q.teacherComment ?? '',
    teacherNote: q.teacherNote ?? '',
    markups: Array.isArray(q.markups) ? q.markups : [],
    obtainedMarks: typeof q.obtainedMarks === 'number' ? q.obtainedMarks : null,
    maxMarks: typeof q.maxMarks === 'number' ? q.maxMarks : null,
    confidence: typeof q.confidence === 'number' ? q.confidence : null,
  }))

  return {
    id: record?.evaluationId ?? '',
    subject: record?.subject || 'General',
    teacherFeedback: record?.teacherFeedback ?? '',
    topicsToImprove: Array.isArray(record?.topicsToImprove) ? record.topicsToImprove : [],
    questions: mappedQuestions,
    pages: Array.isArray(record?.pages) ? record.pages : [],
    correctedPdfUrl: record?.correctedPdfUrl ?? '',
    elapsedMs: record?.elapsedMs ?? 0,
    aiScore: typeof record?.score === 'number' ? record.score : null,
    aiPercentage: typeof record?.percentage === 'number' ? record.percentage : null,
  }
}

export default buildResult