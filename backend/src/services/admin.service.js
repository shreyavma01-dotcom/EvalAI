const User = require('../models/User.model');
const Submission = require('../models/Submission.model');

/**
 * Minimal admin dashboard — user counts by role and submission stats.
 */
async function getDashboard() {
  const [students, teachers, admins, submissions, pending, evaluated] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'admin' }),
    Submission.countDocuments({}),
    Submission.countDocuments({ status: 'pending' }),
    Submission.countDocuments({ status: 'evaluated' }),
  ]);

  const recent = await Submission.find({})
    .sort({ submittedAt: -1 })
    .limit(8)
    .populate('studentId', 'name email')
    .select('title subject status submittedAt teacherMarks')
    .lean()
    .then((items) =>
      items.map((s) => ({
        _id: s._id,
        title: s.title,
        subject: s.subject,
        status: s.status,
        student: s.studentId,
        submittedAt: s.submittedAt,
        teacherMarks: s.teacherMarks,
      }))
    );

  return {
    stats: { students, teachers, admins, submissions, pending, evaluated },
    recent,
  };
}

module.exports = { getDashboard };