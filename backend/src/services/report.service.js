const PDFDocument = require('pdfkit');

const STATUS_LABELS = { correct: 'Correct', partial: 'Partial', incorrect: 'Incorrect', unattempted: 'Unattempted' };

function gradeFor(percent, passing) {
  if (percent >= 90) return 'A+';
  if (percent >= 80) return 'A';
  if (percent >= 70) return 'B';
  if (percent >= 60) return 'C';
  if (percent >= 50) return 'D';
  if (percent >= Number(passing)) return 'E';
  return 'F';
}

function computeSummary(result) {
  const questions = result?.questions || [];
  const counts = { correct: 0, partial: 0, incorrect: 0, unattempted: 0 };
  for (const q of questions) counts[q.status] = (counts[q.status] || 0) + 1;

  const obtainedMarks = Number(result?.obtainedMarks) || questions.reduce((s, q) => s + (q.obtainedMarks || 0), 0);
  const totalMarks = Number(result?.totalMarks) || questions.reduce((s, q) => s + (q.maxMarks || 0), 0);
  const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;
  const passingMarks = Number(result?.passingMarks) || 0;
  const grade = result?.grade || gradeFor(percentage, passingMarks);
  const passed = percentage >= (passingMarks > 0 ? (passingMarks / totalMarks) * 100 : 40) || obtainedMarks >= passingMarks;

  return { counts, obtainedMarks, totalMarks, percentage, grade, passed, passingMarks };
}

/**
 * Generates a polished PDF evaluation report (pdfkit). Includes the student's
 * summary, score, grade, per-question breakdown and teacher feedback.
 */
function buildReportPdf(result) {
  const summary = computeSummary(result);
  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const GREEN = '#2D6A4F';
  const LIGHT = '#D8F3DC';
  const GRAY = '#6B7280';
  const DARK = '#1F2937';

  // Header band
  doc.rect(0, 0, doc.page.width, 110).fill(GREEN);
  doc
    .fill('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text('EvalAI — Evaluation Report', 48, 32);
  doc
    .font('Helvetica')
    .fontSize(11)
    .text(`Generated ${new Date().toLocaleString()}`, 48, 62);
  doc
    .fontSize(12)
    .text(`${result.subject || 'General'} · Powered by Gemini 2.5 Flash`, 48, 80);

  // Student + score grid
  doc
    .fill(DARK)
    .font('Helvetica-Bold')
    .fontSize(15)
    .text('Student', 48, 132);
  const studentY = 152;
  doc
    .font('Helvetica')
    .fontSize(11)
    .fill(GRAY)
    .text(`Name: ${result.studentName || '—'}`, 48, studentY)
    .text(`Roll Number: ${result.rollNumber || '—'}`, 48, studentY + 16);

  const scoreBox = { x: 330, y: 132, w: 210, h: 92 };
  doc.roundedRect(scoreBox.x, scoreBox.y, scoreBox.w, scoreBox.h, 12).fill(LIGHT);
  doc
    .fill(DARK)
    .fontSize(26)
    .font('Helvetica-Bold')
    .text(`${summary.obtainedMarks}/${summary.totalMarks}`, scoreBox.x + 16, scoreBox.y + 12);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fill(GRAY)
    .text(`Percentage: ${summary.percentage}%`, scoreBox.x + 16, scoreBox.y + 48)
    .text(`Grade: ${summary.grade}`, scoreBox.x + 16, scoreBox.y + 64)
    .text(`Result: ${summary.passed ? 'PASS' : 'FAIL'}`, scoreBox.x + 16, scoreBox.y + 80);

  // Status counts
  let y = 258;
  doc.fill(DARK).font('Helvetica-Bold').fontSize(15).text('Summary', 48, y);
  y += 22;
  const countItems = [
    ['Total Questions', String(result.questions?.length || 0)],
    ['Correct', String(summary.counts.correct || 0)],
    ['Partial', String(summary.counts.partial || 0)],
    ['Incorrect', String(summary.counts.incorrect || 0)],
    ['Unattempted', String(summary.counts.unattempted || 0)],
    ['Passing Marks', String(summary.passingMarks || 0)],
  ];
  for (const [label, value] of countItems) {
    doc.fill(GRAY).font('Helvetica').fontSize(11).text(label, 48, y);
    doc.fill(DARK).font('Helvetica-Bold').text(value, 200, y);
    y += 18;
  }

  // Question-wise breakdown
  y += 10;
  doc.fill(DARK).font('Helvetica-Bold').fontSize(15).text('Question-wise breakdown', 48, y);
  y += 24;
  const tableLeft = 48;
  const colWidths = { num: 36, status: 80, marks: 60, answer: 200, feedback: 190 };
  const tableRight = tableLeft + colWidths.num + colWidths.status + colWidths.marks + colWidths.answer + colWidths.feedback;

  doc.rect(tableLeft, y, tableRight - tableLeft, 22).fill(LIGHT);
  doc.fill(DARK).font('Helvetica-Bold').fontSize(9);
  let cx = tableLeft;
  doc.text('Q', cx + 4, y + 6); cx += colWidths.num;
  doc.text('Status', cx + 4, y + 6); cx += colWidths.status;
  doc.text('Marks', cx + 4, y + 6); cx += colWidths.marks;
  doc.text('Student answer', cx + 4, y + 6); cx += colWidths.answer;
  doc.text('Feedback', cx + 4, y + 6);
  y += 22;

  doc.font('Helvetica').fontSize(9);
  for (const q of result.questions || []) {
    const statusColor =
      q.status === 'correct' ? '#16a34a'
        : q.status === 'partial' ? '#b45309'
          : q.status === 'incorrect' ? '#b91c1c' : '#6B7280';
    const rowHeight = 52;
    cx = tableLeft;
    doc.fill(DARK).text(String(q.questionNumber ?? ''), cx + 4, y + 4); cx += colWidths.num;
    doc.fill(statusColor).font('Helvetica-Bold').text(STATUS_LABELS[q.status] || q.status, cx + 4, y + 4); cx += colWidths.status;
    doc.fill(DARK).font('Helvetica').text(`${q.obtainedMarks}/${q.maxMarks}`, cx + 4, y + 4); cx += colWidths.marks;
    doc.fill(GRAY).text(String(q.studentAnswer || '—').slice(0, 110), cx + 4, y + 4, { width: colWidths.answer - 8 }); cx += colWidths.answer;
    doc.text(String(q.feedback || '—').slice(0, 130), cx + 4, y + 4, { width: colWidths.feedback - 8 });
    doc.moveTo(tableLeft, y + rowHeight - 6).lineTo(tableRight, y + rowHeight - 6).strokeColor('#E5E7EB').lineWidth(1).stroke();
    y += rowHeight;
    if (y > doc.page.height - 120) {
      doc.addPage();
      y = 48;
      doc.moveTo(tableLeft, y - 24).lineTo(tableRight, y - 24).strokeColor('#E5E7EB').lineWidth(1).stroke();
    }
  }

  // Feedback sections
  const feedback = result?.feedback || {};
  const sections = [
    ['Overall feedback', feedback.overall],
    ['Strengths', (feedback.strengths || []).join(' · ')],
    ['Weak areas', (feedback.weaknesses || []).join(' · ')],
    ['Suggestions', (feedback.suggestions || []).join(' · ')],
  ];
  y += 20;
  for (const [title, body] of sections) {
    if (y > doc.page.height - 140) {
      doc.addPage();
      y = 48;
    }
    doc.fill(DARK).font('Helvetica-Bold').fontSize(12).text(title, 48, y);
    y += 18;
    doc.fill(GRAY).font('Helvetica').fontSize(10).text(body || '—', 48, y, { width: doc.page.width - 96 });
    y += doc.heightOfString(body || '—', { width: doc.page.width - 96 }) + 14;
  }

  doc.end();
  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

/**
 * Builds a CSV marks report (question-wise). Returns a Buffer.
 */
function buildMarksCsv(result) {
  const rows = [
    ['Question', 'Status', 'Obtained', 'Max', 'Student Answer', 'Expected Answer', 'Confidence', 'Feedback'],
  ];
  for (const q of result?.questions || []) {
    rows.push([
      String(q.questionNumber ?? ''),
      STATUS_LABELS[q.status] || q.status || '',
      String(q.obtainedMarks ?? ''),
      String(q.maxMarks ?? ''),
      String(q.studentAnswer ?? '').replace(/,/g, ';'),
      String(q.expectedAnswer ?? '').replace(/,/g, ';'),
      String(q.confidence ?? ''),
      String(q.feedback ?? '').replace(/,/g, ';'),
    ]);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  return Buffer.from('\uFEFF' + csv, 'utf8');
}

module.exports = { buildReportPdf, buildMarksCsv, computeSummary, gradeFor };
