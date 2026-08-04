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
      },
    ],
    reportUrl: String,
    csvUrl: String,
    status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
    error: String,
    elapsedMs: Number,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);
