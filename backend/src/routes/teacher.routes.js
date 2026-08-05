const { Router } = require('express');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const teacherService = require('../services/teacher.service');

const router = Router();

// Every teacher route requires an authenticated teacher.
router.use(authenticateUser, authorizeRoles('teacher'));

/**
 * GET /api/teacher/dashboard — stats + recent submissions.
 */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const data = await teacherService.getDashboard(req.user._id);
    return res.json({ success: true, data });
  })
);

/**
 * GET /api/teacher/submissions — filterable list (status, search, page).
 */
router.get(
  '/submissions',
  asyncHandler(async (req, res) => {
    const data = await teacherService.listSubmissions({
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.json({ success: true, data });
  })
);

/**
 * GET /api/teacher/submission/:id — full detail for the review page.
 */
router.get(
  '/submission/:id',
  asyncHandler(async (req, res) => {
    const data = await teacherService.getSubmission(req.params.id);
    return res.json({ success: true, data });
  })
);

/**
 * PUT /api/teacher/evaluate/:id — publish marks + feedback + remarks.
 */
router.put(
  '/evaluate/:id',
  asyncHandler(async (req, res) => {
    const data = await teacherService.publishEvaluation({
      submissionId: req.params.id,
      teacherId: req.user._id,
      marks: req.body?.marks,
      feedback: req.body?.feedback,
      remarks: req.body?.remarks,
    });
    return res.json({ success: true, data });
  })
);

/**
 * GET /api/teacher/students — students with submission stats.
 */
router.get(
  '/students',
  asyncHandler(async (req, res) => {
    const data = await teacherService.listStudents({
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.json({ success: true, data });
  })
);

/**
 * GET /api/teacher/analytics — chart data.
 */
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const data = await teacherService.getAnalytics();
    return res.json({ success: true, data });
  })
);

module.exports = router;