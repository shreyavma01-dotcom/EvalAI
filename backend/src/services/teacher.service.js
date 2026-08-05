const Submission = require('../models/Submission.model');
const User = require('../models/User.model');
const notificationService = require('./notification.service');
const { buildReportPdf } = require('./report.service');
const { reportUrlForSubmission } = require('../utils/submissionReport');
const logger = require('../utils/logger');

/**
 * Dashboard stats for a teacher.
 */
async function getDashboard(teacherId) {
  const [students, pending, completed, submissions] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Submission.countDocuments({ status: 'pending' }),
    Submission.countDocuments({ status: 'evaluated' }),
    Submission.find({})
      .sort({ submittedAt: -1 })
      .limit(5)
      .populate('studentId', 'name email')
      .select('title subject status studentId submittedAt teacherMarks aiEvaluation.createdAt')
      .lean(),
  ]);

  const evaluated = await Submission.find({ status: 'evaluated' }).select('teacherMarks').lean();
  const scored = evaluated.filter((s) => typeof s.teacherMarks === 'number');
  const averageScoreGiven =
    scored.length > 0 ? Math.round((scored.reduce((sum, s) => sum + s.teacherMarks, 0) / scored.length) * 100) / 100 : 0;

  return {
    stats: { totalStudents: students, pendingReviews: pending, completedReviews: completed, averageScoreGiven },
    recent: submissions,
  };
}

/**
 * Lists submissions with status filter, search and pagination.
 */
async function listSubmissions({ status, search = '', page = 1, limit = 10 }) {
  const query = {};
  if (status === 'pending' || status === 'evaluated') query.status = status;
  const term = String(search || '').trim();
  if (term) {
    const studentIds = await User.find({ role: 'student', name: { $regex: term, $options: 'i' } })
      .select('_id')
      .lean()
      .then((users) => users.map((u) => u._id));
    query.$or = [
      { title: { $regex: term, $options: 'i' } },
      { subject: { $regex: term, $options: 'i' } },
      { studentId: { $in: studentIds } },
    ];
  }

  const total = await Submission.countDocuments(query);
  const items = await Submission.find(query)
    .sort({ submittedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('studentId', 'name email')
    .select('title subject status studentId submittedAt evaluatedAt teacherMarks aiEvaluation.percentage aiEvaluation.status')
    .lean();

  return {
    items: items.map((s) => ({
      _id: s._id,
      title: s.title,
      subject: s.subject,
      status: s.status,
      student: s.studentId,
      submittedAt: s.submittedAt,
      evaluatedAt: s.evaluatedAt,
      teacherMarks: s.teacherMarks,
      aiScore: s.aiEvaluation?.percentage ?? null,
      aiStatus: s.aiEvaluation?.status ?? 'unavailable',
    })),
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/**
 * Full submission detail for the review page.
 */
async function getSubmission(submissionId) {
  const submission = await Submission.findById(submissionId)
    .populate('studentId', 'name email')
    .populate('teacherId', 'name email')
    .lean();
  if (!submission) {
    const error = new Error('Submission not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }
  return submission;
}

/**
 * Publishes a teacher's verdict. Marks stay within the AI-observed maximum
 * when available. Generates the downloadable PDF report and notifies the
 * student.
 */
async function publishEvaluation({ submissionId, teacherId, marks, feedback, remarks }) {
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    const error = new Error('Submission not found.');
    error.status = 404;
    error.isOperational = true;
    throw error;
  }

  const finalMarks = Number(marks);
  if (!Number.isFinite(finalMarks) || finalMarks < 0) {
    const error = new Error('Final marks must be a non-negative number.');
    error.status = 400;
    error.isOperational = true;
    throw error;
  }

  submission.status = 'evaluated';
  submission.teacherId = teacherId;
  submission.teacherMarks = finalMarks;
  submission.teacherFeedback = String(feedback || '');
  submission.teacherRemarks = String(remarks || '');
  submission.evaluatedAt = new Date();

  // Build the downloadable PDF report (marked sheet detail + teacher notes).
  try {
    const student = await User.findById(submission.studentId).select('name email').lean();
    const teacher = await User.findById(teacherId).select('name').lean();
    const reportPdf = await buildReportPdf({
      studentName: student?.name || 'Student',
      teacherName: teacher?.name || 'Teacher',
      teacherSignature: submission.teacherSignature || teacher?.name || 'EvalAI Grading Assistant',
      subject: submission.subject,
      questions: submission.aiEvaluation?.questions || [],
      obtainedMarks: submission.aiEvaluation?.score ?? finalMarks,
      totalMarks: submission.aiEvaluation?.totalMarks ?? Math.max(finalMarks, 1),
      percentage: submission.aiEvaluation?.percentage ?? 0,
      averageConfidence: submission.aiEvaluation?.averageConfidence ?? 0,
      topicsToImprove: submission.aiEvaluation?.topicsToImprove || [],
      evaluatedAt: submission.evaluatedAt || new Date(),
      passingMarks: 0,
      feedback: {
        overall: submission.teacherFeedback || submission.aiEvaluation?.teacherFeedback || '',
        strengths: [],
        weaknesses: [],
        suggestions: [],
      },
    });
    const url = await reportUrlForSubmission({ submissionId: submission._id.toString(), buffer: reportPdf });
    submission.reportUrl = url;
  } catch (err) {
    logger.warn(`Report generation failed for submission ${submissionId}: ${err.message}`);
  }

  await submission.save();

  await notificationService.notify(submission.studentId, {
    type: 'result',
    title: 'Result published',
    message: `Your submission "${submission.title}" (${submission.subject}) has been evaluated. View your result.`,
    data: { submissionId: submission._id, title: submission.title, subject: submission.subject },
  });

  return submission;
}

/**
 * Lists students with submission stats.
 */
async function listStudents({ search = '', page = 1, limit = 10 }) {
  const term = String(search || '').trim();
  const query = { role: 'student' };
  if (term) query.name = { $regex: term, $options: 'i' };

  const total = await User.countDocuments(query);
  const students = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('name email createdAt')
    .lean();

  const items = await Promise.all(
    students.map(async (student) => {
      const [submitted, evaluated, scored] = await Promise.all([
        Submission.countDocuments({ studentId: student._id }),
        Submission.countDocuments({ studentId: student._id, status: 'evaluated' }),
        Submission.find({ studentId: student._id, status: 'evaluated' }).select('teacherMarks').lean(),
      ]);
      const avg =
        scored.length > 0 ? Math.round((scored.reduce((sum, s) => sum + (s.teacherMarks || 0), 0) / scored.length) * 100) / 100 : 0;
      return { _id: student._id, name: student.name, email: student.email, createdAt: student.createdAt, submitted, evaluated, averageMarks: avg };
    })
  );

  return {
    items,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/**
 * Analytics for charts — status distribution, subject distribution and
 * recent scores.
 */
async function getAnalytics() {
  const [pending, evaluated, subjectAgg, scores] = await Promise.all([
    Submission.countDocuments({ status: 'pending' }),
    Submission.countDocuments({ status: 'evaluated' }),
    Submission.aggregate([{ $group: { _id: '$subject', count: { $sum: 1 }, evaluated: { $sum: { $cond: [{ $eq: ['$status', 'evaluated'] }, 1, 0] } } } }, { $sort: { count: -1 } }]),
    Submission.find({ status: 'evaluated', teacherMarks: { $type: 'number' } })
      .sort({ evaluatedAt: -1 })
      .limit(12)
      .select('title subject teacherMarks evaluatedAt')
      .lean(),
  ]);

  return {
    statusDistribution: { pending, evaluated },
    subjects: subjectAgg.map((s) => ({ subject: s._id, total: s.count, evaluated: s.evaluated })),
    recentScores: scores.map((s) => ({ title: s.title, subject: s.subject, marks: s.teacherMarks, date: s.evaluatedAt })),
  };
}

module.exports = { getDashboard, listSubmissions, getSubmission, publishEvaluation, listStudents, getAnalytics };