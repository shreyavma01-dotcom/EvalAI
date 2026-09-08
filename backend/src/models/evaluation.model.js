const mongoose = require('mongoose');

const bboxSchema = new mongoose.Schema(
  {
    left: Number,
    top: Number,
    width: Number,
    height: Number,
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    questionNumber: Number,
    question: String,
    page: Number,
    studentAnswer: String,
    expectedAnswer: String,
    obtainedMarks: Number,
    maxMarks: Number,
    status: { type: String, enum: ['correct', 'partial', 'incorrect', 'unattempted'] },
    confidence: Number,
    feedback: String,
    annotationComment: String,
    bbox: bboxSchema,
    // Agent escalation flags — set when the agent could not judge reliably.
    needsTeacherReview: Boolean,
    reviewReason: String,
  },
  { _id: false }
);

const agentTraceSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // goal | observation | decision | action | verification | adaptation | escalation | completion
    step: String,
    title: String,
    message: String,
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const agentOutcomeSchema = new mongoose.Schema(
  {
    goal: String,
    status: String,
    escalatedQuestionNumbers: [Number],
    unresolvedPages: [Number],
    reason: String,
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    evaluationId: { type: String, required: true, unique: true, index: true },
    studentName: String,
    rollNumber: String,
    subject: String,
    evaluationMode: String,
    negativeMarking: Number,
    passingMarks: Number,
    totalMarks: Number,
    obtainedMarks: Number,
    percentage: Number,
    grade: String,
    passed: Boolean,
    questions: [questionSchema],
    feedback: {
      overall: String,
      strengths: [String],
      weaknesses: [String],
      suggestions: [String],
    },
    pages: [
      {
        pageNumber: Number,
        originalUrl: String,
        annotatedUrl: String,
        ocrText: String,
        ocrConfidence: Number,
        // Agent observation for the page (deterministic sharp metrics).
        quality: String,
        qualityIssues: [String],
      },
    ],
    reportUrl: String,
    csvUrl: String,
    status: {
      type: String,
      // needs_teacher_review — the agent completed but escalated unresolved
      // questions/pages to the teacher instead of grading them automatically.
      enum: ['completed', 'failed', 'needs_teacher_review'],
      default: 'completed',
    },
    error: String,
    // Structured agent trace (auditable, safe for UI) + final outcome summary.
    agentTrace: [agentTraceSchema],
    agentOutcome: agentOutcomeSchema,
    elapsedMs: Number,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);
