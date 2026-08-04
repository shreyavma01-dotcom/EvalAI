/**
 * Maps a backend evaluation record into the teacher-style shape the page
 * renders. Everything here comes from the real pipeline — nothing is mocked.
 * Marks, percentages and confidence are deliberately NOT surfaced.
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
  }
}

export default buildResult