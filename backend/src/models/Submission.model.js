const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema(
  {
    fileUrl: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: String,
    size: Number,
    pageNumber: Number,
  },
  { _id: false }
);

const aiEvaluationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['running', 'completed', 'failed', 'unavailable'],
      default: 'running',
    },
    score: Number,
    percentage: Number,
    teacherFeedback: String,
    topicsToImprove: [String],
    statusCounts: {
      correct: Number,
      partial: Number,
      incorrect: Number,
      unattempted: Number,
    },
    questions: mongoose.Schema.Types.Mixed,
    pages: [
      {
        pageNumber: Number,
        originalUrl: String,
        annotatedUrl: String,
      },
    ],
    averageConfidence: Number,
    correctedPdfUrl: String,
    error: String,
  },
  { _id: false }
);

/**
 * Submission — a student's assignment hand-in with answer sheets, the AI
 * evaluation result and the teacher's final verdict.
 */
const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    answerSheet: [uploadedFileSchema],
    questionPaper: [uploadedFileSchema],
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'evaluated'],
      default: 'pending',
      index: true,
    },
    aiEvaluation: aiEvaluationSchema,
    teacherMarks: Number,
    teacherFeedback: String,
    teacherRemarks: String,
    submittedAt: { type: Date, default: Date.now },
    evaluatedAt: Date,
    reportUrl: String,
  },
  { timestamps: true }
);

submissionSchema.index({ studentId: 1, submittedAt: -1 });

module.exports = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);
