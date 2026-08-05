const mongoose = require('mongoose');

/**
 * Assignment — future-ready model. Assignments can later be created by
 * teachers, distributed to students and linked to submissions.
 */
const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    maxMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    questionPaperUrl: String,
    dueDate: Date,
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
