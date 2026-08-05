const Submission = require('../models/Submission.model');
const User = require('../models/User.model');
const notificationService = require('./notification.service');
const { saveUploadedFiles } = require('../utils/fileStorage');
const { runEvaluation } = require('./evaluation.service');
const logger = require('../utils/logger');

const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']);

/**
 * Computes the AI score summary from a real Gemini evaluation record.
 */
function summarizeEvaluation(record) {
  const questions = Array.isArray(record?.questions) ? record.questions : [];
  const obtained = questions.reduce((sum, q) => sum + (Number(q.obtainedMarks) || 0), 0);
  const total = questions.reduce((sum, q) => sum + (Number(q.maxMarks) || 0), 0);
  const statusCounts = { correct: 0, partial: 0, incorrect: 0, unattempted: 0 };
  for (const q of questions) {
    if (statusCounts[q.status] !== undefined) statusCounts[q.status] += 1;
  }
  const averageConfidence =
    questions.length > 0
      ? Math.round((questions.reduce((sum, q) => sum + (Number(q.confidence) || 0), 0) / questions.length) * 100) / 100
      : 0;
  return {
    score: Math.round(obtained * 100) / 100,
    percentage: total > 0 ? Math.round((obtained / total) * 10000) / 100 : 0,
    totalMarks: total,
    statusCounts,
    averageConfidence,
  };
}

/**
 * Runs the real evaluation pipeline against the submission's image answer
 * sheets, then persists the AI result onto the submission document.
 */
async function runAiEvaluation({ submissionId, imageFiles, subject, statusFallback }) {
  const setStatus = async (update) => {
    await Submission.findByIdAndUpdate(submissionId, { aiEvaluation: update });
  };

  if (imageFiles.length === 0) {
    await setStatus({
      status: 'unavailable',
      error: 'AI evaluation needs image answer sheets. PDF pages are stored for manual review.',
    });
    return;
  }

  await setStatus({ status: 'running' });

  const evaluationId = `sub-${submissionId}`;
  try {
    const record = await runEvaluation({
      evaluationId,
      sheetPages: imageFiles.map((f) => ({ buffer: f.buffer, mimetype: f.mimetype })),
      config: { subject },
    });

    const summary = summarizeEvaluation(record);
    await Submission.findByIdAndUpdate(submissionId, {
      aiEvaluation: {
        status: 'completed',
        score: summary.score,
        percentage: summary.percentage,
        teacherFeedback: record.teacherFeedback || '',
        topicsToImprove: Array.isArray(record.topicsToImprove) ? record.topicsToImprove : [],
        statusCounts: summary.statusCounts,
        questions: record.questions || [],
        pages: (record.pages || []).map((p) => ({
          pageNumber: p.pageNumber,
          originalUrl: p.originalUrl,
          annotatedUrl: p.annotatedUrl,
        })),
        averageConfidence: summary.averageConfidence,
        correctedPdfUrl: record.correctedPdfUrl || '',
        error: '',
      },
    });
  } catch (err) {
    logger.error(`AI evaluation failed for submission ${submissionId}: ${err.message}`);
    await setStatus({
      status: 'failed',
      error: err?.isOperational ? err.message : 'AI evaluation failed. A teacher can still review and grade this manually.',
    });
    statusFallback?.();
  }
}

/**
 * Creates a submission, stores the uploaded files and starts the real AI
 * evaluation in the background. The teacher receives a notification.
 */
async function createSubmission({ studentId, body, answerFiles, questionFiles }) {
  const { subject, title, description, remarks } = body || {};
  if (!String(subject || '').trim() || !String(title || '').trim()) {
    const error = new Error('Subject and assignment title are required.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }
  if ((answerFiles || []).length === 0) {
    const error = new Error('Please upload at least one answer sheet page.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  const submission = await Submission.create({
    studentId,
    subject: String(subject).trim(),
    title: String(title).trim(),
    description: String(description || '').trim(),
    remarks: String(remarks || '').trim(),
    status: 'pending',
    aiEvaluation: { status: 'running' },
  });

  const answerSheet = saveUploadedFiles({
    files: answerFiles,
    submissionId: submission._id.toString(),
    prefix: 'answer',
  }).map((entry, index) => ({ ...entry, pageNumber: index + 1 }));

  const questionPaper = saveUploadedFiles({
    files: questionFiles,
    submissionId: submission._id.toString(),
    prefix: 'question',
  });

  submission.answerSheet = answerSheet;
  submission.questionPaper = questionPaper;
  await submission.save();

  const imageAnswerFiles = (answerFiles || []).filter((f) => IMAGE_MIME.has(f.mimetype));
  runAiEvaluation({
    submissionId: submission._id,
    imageFiles: imageAnswerFiles,
    subject: String(subject).trim(),
  });

  // Notify teachers — a new submission is waiting.
  try {
    const teachers = await User.find({ role: 'teacher' }).select('_id').lean();
    for (const teacher of teachers) {
      await notificationService.notify(teacher._id, {
        type: 'submission',
        title: 'New submission',
        message: `${submission.title} (${submission.subject}) was submitted and is awaiting review.`,
        data: { submissionId: submission._id, subject: submission.subject, title: submission.title },
      });
    }
  } catch (err) {
    logger.warn(`Teacher notification dispatch failed: ${err.message}`);
  }

  return submission;
}

/**
 * Dashboard stats for a student.
 */
async function getDashboard(studentId) {
  const [total, pending, evaluated, submissions] = await Promise.all([
    Submission.countDocuments({ studentId }),
    Submission.countDocuments({ studentId, status: 'pending' }),
    Submission.countDocuments({ studentId, status: 'evaluated' }),
    Submission.find({ studentId })
      .sort({ submittedAt: -1 })
      .limit(5)
      .select('title subject status teacherMarks aiEvaluation createdAt submittedAt')
      .lean(),
  ]);

  const evaluatedSubs = await Submission.find({ studentId, status: 'evaluated' }).select('teacherMarks').lean();
  const scored = evaluatedSubs.filter((s) => typeof s.teacherMarks === 'number');
  const averageScore =
    scored.length > 0 ? Math.round((scored.reduce((sum, s) => sum + s.teacherMarks, 0) / scored.length) * 100) / 100 : 0;

  return {
    stats: { total, pending, evaluated, averageScore },
    recent: submissions,
  };
}

/**
 * Lists a student's submissions with search + pagination.
 */
async function listSubmissions(studentId, { page = 1, limit = 10, search = '' }) {
  const query = { studentId };
  const term = String(search || '').trim();
  if (term) {
    query.$or = [{ title: { $regex: term, $options: 'i' } }, { subject: { $regex: term, $options: 'i' } }];
  }
  const total = await Submission.countDocuments(query);
  const items = await Submission.find(query)
    .sort({ submittedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('title subject description status teacherMarks aiEvaluation submittedAt evaluatedAt createdAt')
    .lean();

  return {
    items: items.map((s) => ({
      ...s,
      aiScore: s.aiEvaluation?.percentage ?? null,
      aiStatus: s.aiEvaluation?.status ?? 'unavailable',
    })),
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/**
 * Evaluated submissions the student can view as results.
 */
async function getResults(studentId, { page = 1, limit = 10, search = '' }) {
  const query = { studentId, status: 'evaluated' };
  const term = String(search || '').trim();
  if (term) {
    query.$or = [{ title: { $regex: term, $options: 'i' } }, { subject: { $regex: term, $options: 'i' } }];
  }
  const total = await Submission.countDocuments(query);
  const items = await Submission.find(query)
    .sort({ evaluatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('teacherId', 'name email')
    .select('title subject description status teacherMarks teacherFeedback teacherRemarks aiEvaluation evaluatedAt reportUrl submittedAt createdAt')
    .lean();

  return {
    items,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/**
 * A single evaluated submission the student can view as a result.
 */
async function getResult(studentId, submissionId) {
  const submission = await Submission.findOne({ _id: submissionId, studentId, status: 'evaluated' })
    .populate('teacherId', 'name email')
    .select('title subject description status teacherMarks teacherFeedback teacherRemarks aiEvaluation evaluatedAt reportUrl submittedAt createdAt')
    .lean();
  if (!submission) {
    const error = new Error('Evaluated submission not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }
  return submission;
}

module.exports = { createSubmission, getDashboard, listSubmissions, getResults, getResult };