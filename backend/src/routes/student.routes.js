const { Router } = require('express');
const multer = require('multer');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const studentService = require('../services/student.service');
const { MAX_FILE_SIZE, MAX_SHEETS_PER_EVALUATION } = require('../config/env');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_SHEETS_PER_EVALUATION + 10 },
});

const router = Router();

// Every student route requires an authenticated student.
router.use(authenticateUser, authorizeRoles('student'));

/**
 * GET /api/student/dashboard — stats + recent submissions.
 */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const data = await studentService.getDashboard(req.user._id);
    return res.json({ success: true, data });
  })
);

/**
 * GET /api/student/submissions — list with search + pagination.
 */
router.get(
  '/submissions',
  asyncHandler(async (req, res) => {
    const data = await studentService.listSubmissions(req.user._id, {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });
    return res.json({ success: true, data });
  })
);

/**
 * POST /api/student/submissions — submit an assignment (images / PDFs).
 * The real AI evaluation runs in the background.
 */
router.post(
  '/submissions',
  upload.fields([
    { name: 'answerSheet', maxCount: MAX_SHEETS_PER_EVALUATION },
    { name: 'questionPaper', maxCount: 10 },
  ]),
  asyncHandler(async (req, res) => {
    const data = await studentService.createSubmission({
      studentId: req.user._id,
      body: req.body,
      answerFiles: req.files?.answerSheet || [],
      questionFiles: req.files?.questionPaper || [],
    });
    return res.status(201).json({ success: true, data });
  })
);

/**
 * GET /api/student/results — evaluated submissions.
 */
router.get(
  '/results',
  asyncHandler(async (req, res) => {
    const data = await studentService.getResults(req.user._id, {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });
    return res.json({ success: true, data });
  })
);

/**
 * GET /api/student/results/:id — one evaluated submission detail.
 */
router.get(
  '/results/:id',
  asyncHandler(async (req, res) => {
    const data = await studentService.getResult(req.user._id, req.params.id);
    return res.json({ success: true, data });
  })
);

module.exports = router;