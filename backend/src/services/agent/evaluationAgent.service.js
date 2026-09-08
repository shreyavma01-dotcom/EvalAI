const fs = require('fs');
const path = require('path');
const storage = require('../storage.service');
const { evaluateAnswerSheet } = require('../gemini-evaluate.service');
const { annotatePages } = require('../annotation.service');
const { resetTesseractWorker } = require('../ocr.service');
const { withRetry, buildCorrectedPdf } = require('../../utils/pipeline');
const logger = require('../../utils/logger');
const tools = require('./tools.service');
const { createAgentState, record, bumpRetry, finish, toTraceDocuments } = require('./agentState.service');
const { observePageQuality, summarizeObservation } = require('./observation.service');
const { verifyOcrResult, isBetterOcr, verifyEvaluation, verifyAnnotations } = require('./verification.service');
const {
  decidePreprocessing,
  planOcrStrategies,
  classifyQuestion,
  shouldRecheckQuestion,
  adoptReanalysis,
  MAX_OCR_STRATEGIES_PER_PAGE,
  MAX_QUESTION_RECHECKS,
} = require('./decision.service');

// Progress span for the per-page OCR loop, mirroring the original pipeline.
const OCR_PROGRESS = { start: 18, end: 40 };

function ocrProgressFor(pageIndex, pageCount) {
  return OCR_PROGRESS.start + Math.round(((OCR_PROGRESS.end - OCR_PROGRESS.start) * (pageIndex + 1)) / pageCount);
}

/**
 * AGENTIC EVALUATION CONTROLLER
 *
 * Goal → Observe → Decide → Act → Verify → Adapt → Escalate / Final outcome.
 * Orchestrates the existing services (image prep, OCR, Gemini, annotation,
 * storage) as tools. Every decision is based on a real intermediate result
 * and recorded as a concise, human-readable trace event.
 */
async function runAgenticEvaluation({ evaluationId, sheetPages, config, onStage, onAgentEvent }) {
  const startedAt = Date.now();
  const { subject = 'General' } = config || {};

  const state = createAgentState({
    evaluationId,
    goal: `Evaluate the student's ${subject} answer sheet accurately`,
    onAgentEvent,
  });

  record(state, { type: 'goal', step: 'goal', title: 'Goal started', message: state.goal });

  try {
    // ---- 1. PREPARE (existing normalizer reused as a tool) ----
    onStage?.('preparing', 8, 'Preparing images');
    record(state, {
      type: 'action',
      step: 'preparing',
      title: 'Preparing page images',
      message: `Normalizing ${sheetPages.length} uploaded page(s) — EXIF rotation, size cap, PNG (HEIC included).`,
      metadata: { pageCount: sheetPages.length },
    });
    const pages = [];
    for (let i = 0; i < sheetPages.length; i++) {
      pages.push(await tools.preparePage({ buffer: sheetPages[i].buffer, mimetype: sheetPages[i].mimetype, index: i }));
    }
    const pageCount = pages.length;

    // ---- 2. OBSERVE + ADAPTIVE OCR, page by page ----
    onStage?.('ocr', OCR_PROGRESS.start, pageCount > 1 ? `Reading handwriting on ${pageCount} pages` : 'Reading handwriting on the sheet');
    const strategies = planOcrStrategies();
    const ocrResults = [];

    for (let i = 0; i < pageCount; i++) {
      const pageNumber = i + 1;
      onStage?.('ocr', ocrProgressFor(i, pageCount), `Reading page ${pageNumber} of ${pageCount}`);

      // OBSERVE — deterministic page-quality metrics.
      const observation = await observePageQuality(pages[i].buffer, pageNumber);
      state.pages.push(observation);
      record(state, {
        type: 'observation',
        step: 'ocr',
        title: `Page ${pageNumber} quality: ${observation.quality}`,
        message: summarizeObservation(observation),
        metadata: { pageNumber, quality: observation.quality, issues: observation.issues, metrics: observation.metrics },
      });

      // DECIDE — preprocess only when the observation justifies it.
      const prepDecision = decidePreprocessing(observation);
      record(state, {
        type: 'decision',
        step: 'ocr',
        title: prepDecision.enhance ? 'Preprocess before OCR' : 'OCR directly, no preprocessing',
        message: `Page ${pageNumber}: ${prepDecision.message}`,
        metadata: { pageNumber, enhance: prepDecision.enhance, reasons: prepDecision.reasons },
      });
      if (prepDecision.enhance) {
        record(state, {
          type: 'action',
          step: 'ocr',
          title: 'Enhancing page image',
          message: `Applied grayscale contrast stretch + sharpening on page ${pageNumber}.`,
          metadata: { pageNumber },
        });
      }

      // ACT + VERIFY — bounded strategy loop (max 3 strategies per page).
      const attemptedStrategies = [];
      let best = null;
      for (let s = 0; s < strategies.length; s++) {
        const strategy = strategies[s];
        attemptedStrategies.push(strategy.name);
        bumpRetry(state);
        record(state, {
          type: 'action',
          step: 'ocr',
          title: `OCR attempt (${strategy.name})`,
          message: `Reading page ${pageNumber} with ${tools.describeStrategy(strategy)}.`,
          metadata: { pageNumber, strategy: strategy.name },
        });

        let result;
        try {
          result = await tools.runOcrStrategy(strategy, pages[i].buffer);
        } catch (err) {
          logger.warn(`OCR strategy ${strategy.name} failed on page ${pageNumber}: ${err.message}`);
          record(state, {
            type: 'verification',
            step: 'ocr',
            title: 'OCR attempt failed',
            message: `Strategy ${strategy.name} failed on page ${pageNumber}: ${err.message}`,
            metadata: { pageNumber, strategy: strategy.name, status: 'failed' },
          });
          if (s < strategies.length - 1) {
            record(state, {
              type: 'adaptation',
              step: 'ocr',
              title: 'Adapting OCR strategy',
              message: `Selecting the next strategy (${strategies[s + 1].name}) after the failure.`,
              metadata: { pageNumber, nextStrategy: strategies[s + 1].name },
            });
          }
          continue;
        }

        const verdict = verifyOcrResult(result);
        record(state, {
          type: 'verification',
          step: 'ocr',
          title: `OCR result: ${verdict.status}`,
          message: `${strategy.name} on page ${pageNumber}: ${verdict.reason}`,
          metadata: { pageNumber, strategy: strategy.name, status: verdict.status, ...verdict.metrics },
        });

        if (isBetterOcr({ result, verdict }, best)) {
          best = { result, verdict, strategy: strategy.name };
        }
        if (verdict.status === 'sufficient') break;

        if (s < strategies.length - 1) {
          record(state, {
            type: 'adaptation',
            step: 'ocr',
            title: 'OCR quality not sufficient — adapting',
            message: `Result from ${strategy.name} is not good enough for page ${pageNumber}; retrying with ${strategies[s + 1].name}.`,
            metadata: { pageNumber, fromStrategy: strategy.name, toStrategy: strategies[s + 1].name },
          });
        }
      }

      // Page outcome — accept the best attempt or escalate the page.
      if (!best || best.verdict.status === 'insufficient') {
        state.unresolvedPages.push(pageNumber);
        record(state, {
          type: 'escalation',
          step: 'ocr',
          title: `Page ${pageNumber} could not be read reliably`,
          message: `No usable text after ${attemptedStrategies.length} bounded OCR strategy attempt(s). The page is flagged for teacher review.`,
          metadata: { pageNumber, attemptedStrategies },
        });
        ocrResults.push({ text: '', confidence: 0, confidenceScale: null, strategy: null, attemptedStrategies });
        continue;
      }
      if (best.verdict.status === 'weak') {
        state.unresolvedPages.push(pageNumber);
        record(state, {
          type: 'adaptation',
          step: 'ocr',
          title: 'Accepting the best available OCR',
          message: `Page ${pageNumber}: no strategy reached full confidence; keeping the best result (${best.strategy}) and flagging the page for teacher review.`,
          metadata: { pageNumber, strategy: best.strategy },
        });
      } else {
        record(state, {
          type: 'verification',
          step: 'ocr',
          title: `Page ${pageNumber} OCR accepted`,
          message: `${best.strategy} produced readable text — continuing.`,
          metadata: { pageNumber, strategy: best.strategy },
        });
      }
      ocrResults.push({
        text: best.result.text,
        confidence: best.result.confidence,
        confidenceScale: best.result.confidenceScale,
        strategy: best.strategy,
        attemptedStrategies,
      });
    }

    // Existing safety net: without any readable page there is nothing to evaluate.
    const noTextPages = ocrResults.filter((r) => !r.text.trim()).length;
    if (noTextPages === pageCount) {
      finish(state, { status: 'failed', outcome: { reason: 'ocr_failed_all_pages' } });
      const error = new Error('No handwriting could be read on any page. Try a clearer, higher-contrast scan.');
      error.status = 422;
      error.isOperational = true;
      throw error;
    }

    // ---- 3. GEMINI EVALUATION (existing tool + existing bounded retry) ----
    onStage?.('sending', 45, 'Sending pages to Gemini');
    record(state, {
      type: 'decision',
      step: 'evaluating',
      title: 'Handing reading + grading to Gemini Vision',
      message: 'Gemini reads the handwriting directly from the page images; the verified OCR text is passed as a hint only.',
      metadata: { subject, provider: 'gemini' },
    });

    const geminiInput = pages.map((p, i) => ({ buffer: p.buffer, mimeType: p.mimetype, text: ocrResults[i].text }));

    let evaluation;
    try {
      evaluation = await withRetry(
        () => evaluateAnswerSheet({ sheetPages: geminiInput, subject, onStage }),
        { attempts: 2, baseDelayMs: 1500, label: 'Gemini evaluation' }
      );
    } catch (err) {
      record(state, {
        type: 'verification',
        step: 'evaluating',
        title: 'Evaluation failed',
        message: `The evaluation provider did not return a usable result after the bounded retries: ${err.message}`,
        metadata: { status: 'failed' },
      });
      finish(state, { status: 'failed', outcome: { reason: 'evaluation_failed' } });
      throw err;
    }

    const evalVerdict = verifyEvaluation(evaluation, pageCount);
    record(state, {
      type: 'verification',
      step: 'evaluating',
      title: evalVerdict.status === 'valid' ? 'Evaluation output is valid' : 'Evaluation output is unreliable',
      message: evalVerdict.reason,
      metadata: { status: evalVerdict.status, questionCount: evalVerdict.questionCount },
    });
    if (evalVerdict.status === 'invalid') {
      finish(state, { status: 'failed', outcome: { reason: 'evaluation_invalid' } });
      const error = new Error('The AI evaluation returned an unreliable result. Please try again.');
      error.status = 502;
      error.isOperational = true;
      throw error;
    }

    // ---- 4. QUESTION-LEVEL ADAPTATION ----
    // Uncertain questions get ONE bounded focused re-analysis; whatever is
    // still unresolved is escalated to the teacher instead of being guessed.
    let rechecksUsed = 0;
    const escalatedQuestionNumbers = [];
    for (const question of evaluation.questions) {
      let classification = classifyQuestion(question);
      if (classification.outcome === 'AUTO_EVALUATED') continue;

      if (shouldRecheckQuestion(classification) && rechecksUsed < MAX_QUESTION_RECHECKS) {
        rechecksUsed += 1;
        const pageIndex = Math.min(pageCount, Math.max(1, Number(question.page) || 1)) - 1;
        record(state, {
          type: 'decision',
          step: 'evaluating',
          title: `Question ${question.questionNumber} needs another look`,
          message: `${classification.reason} A focused Gemini Vision re-read of page ${pageIndex + 1} is selected.`,
          metadata: { questionNumber: question.questionNumber, page: question.page },
        });
        try {
          const recheck = await evaluateAnswerSheet({
            sheetPages: [
              {
                buffer: pages[pageIndex].buffer,
                mimeType: pages[pageIndex].mimetype,
                text: ocrResults[pageIndex].text,
              },
            ],
            subject,
          });
          const rematch = (recheck.questions || []).find(
            (rq) => Number(rq.questionNumber) === Number(question.questionNumber)
          );
          const adopted = rematch ? adoptReanalysis(question, rematch) : null;
          if (adopted) {
            Object.assign(question, adopted, { page: question.page });
            record(state, {
              type: 'adaptation',
              step: 'evaluating',
              title: `Question ${question.questionNumber} re-evaluated`,
              message: `The focused re-analysis improved confidence to ${Math.round(Number(question.confidence) * 100)}% — the updated judgment is adopted.`,
              metadata: { questionNumber: question.questionNumber, confidence: Number(question.confidence) },
            });
            classification = classifyQuestion(question);
            if (classification.outcome === 'AUTO_EVALUATED') continue;
          } else {
            record(state, {
              type: 'verification',
              step: 'evaluating',
              title: `Question ${question.questionNumber} re-analysis inconclusive`,
              message: 'The focused re-read did not produce a better-supported judgment.',
              metadata: { questionNumber: question.questionNumber },
            });
            record(state, {
              type: 'adaptation',
              step: 'evaluating',
              title: `Question ${question.questionNumber} keeps the original judgment`,
              message: 'Additional analysis was attempted but did not improve the result — the question moves to teacher review.',
              metadata: { questionNumber: question.questionNumber },
            });
          }
        } catch (err) {
          record(state, {
            type: 'verification',
            step: 'evaluating',
            title: `Question ${question.questionNumber} re-analysis failed`,
            message: `Additional analysis could not be completed: ${err.message}`,
            metadata: { questionNumber: question.questionNumber },
          });
          record(state, {
            type: 'adaptation',
            step: 'evaluating',
            title: `Question ${question.questionNumber} keeps the original judgment`,
            message: 'The additional analysis failed — the question moves to teacher review instead of being guessed.',
            metadata: { questionNumber: question.questionNumber },
          });
        }
      }

      // ESCALATE — no invented grade.
      question.needsTeacherReview = true;
      question.reviewReason = classification.reason;
      escalatedQuestionNumbers.push(question.questionNumber);
      state.unresolvedQuestions.push({ questionNumber: question.questionNumber, reason: classification.reason });
      record(state, {
        type: 'escalation',
        step: 'evaluating',
        title: `Question ${question.questionNumber} escalated to teacher review`,
        message: `${classification.reason} No automatic grade is invented — the teacher decides.`,
        metadata: { questionNumber: question.questionNumber, reason: classification.reason },
      });
    }

    // ---- 5. ANNOTATE (existing tool) + VERIFY ----
    onStage?.('annotating', 86, 'Marking corrections on the sheets');
    record(state, {
      type: 'action',
      step: 'annotating',
      title: 'Drawing teacher annotations',
      message: 'Rendering ticks, crosses, circles and correction notes onto the page images.',
      metadata: { pageCount },
    });
    const annotated = await annotatePages({
      pageBuffers: pages.map((p) => p.buffer),
      questions: evaluation.questions,
      mimeTypes: pages.map((p) => p.mimetype),
    });
    const annotationVerdict = await verifyAnnotations(annotated, pageCount);
    record(state, {
      type: 'verification',
      step: 'annotating',
      title: annotationVerdict.status === 'valid' ? 'Annotations verified' : 'Annotation output invalid',
      message: annotationVerdict.reason,
      metadata: { status: annotationVerdict.status },
    });
    if (annotationVerdict.status === 'invalid') {
      finish(state, { status: 'failed', outcome: { reason: 'annotation_failed' } });
      const error = new Error('The corrected sheets could not be rendered. Please try again.');
      error.status = 500;
      error.isOperational = true;
      throw error;
    }

    // ---- 6. STORE FILES + CORRECTED PDF (existing storage/report flow) ----
    onStage?.('report', 94, 'Preparing corrected sheets');
    const dir = storage.ensureEvaluationDir(evaluationId);

    const storedPages = [];
    for (let i = 0; i < pages.length; i++) {
      const originalName = `page-${i + 1}-original.png`;
      const annotatedName = `page-${i + 1}-annotated.png`;
      fs.writeFileSync(path.join(dir, originalName), pages[i].buffer);
      fs.writeFileSync(path.join(dir, annotatedName), annotated[i].buffer);
      storedPages.push({
        pageNumber: i + 1,
        originalUrl: storage.toPublicUrl(path.join(dir, originalName)),
        annotatedUrl: storage.toPublicUrl(path.join(dir, annotatedName)),
        ocrText: ocrResults[i].text,
        ocrConfidence: ocrResults[i].confidence,
        quality: state.pages[i]?.quality,
        qualityIssues: state.pages[i]?.issues || [],
      });
    }

    const obtainedMarks = evaluation.questions.reduce((sum, q) => sum + (Number(q.obtainedMarks) || 0), 0);
    const totalMarks = evaluation.questions.reduce((sum, q) => sum + (Number(q.maxMarks) || 0), 0);
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;
    const averageConfidence =
      evaluation.questions.length > 0
        ? Math.round(
            (evaluation.questions.reduce((sum, q) => sum + (Number(q.confidence) || 0), 0) /
              evaluation.questions.length) *
              100
          ) / 100
        : 0;

    const escalated = escalatedQuestionNumbers.length > 0 || state.unresolvedPages.length > 0;
    const outcome = {
      goal: state.goal,
      status: escalated ? 'needs_teacher_review' : 'auto_evaluated',
      escalatedQuestionNumbers,
      unresolvedPages: [...state.unresolvedPages],
      reason: escalated
        ? [
            escalatedQuestionNumbers.length > 0
              ? `${escalatedQuestionNumbers.length} question(s) need teacher review.`
              : null,
            state.unresolvedPages.length > 0
              ? `Page(s) ${state.unresolvedPages.join(', ')} could not be read reliably.`
              : null,
          ]
            .filter(Boolean)
            .join(' ')
        : 'Every question was auto-evaluated with sufficient confidence.',
    };

    onStage?.('completed', 100, 'Evaluation complete');
    finish(state, { status: 'completed', outcome });
    record(state, {
      type: 'completion',
      step: 'completed',
      title: escalated ? 'Evaluation finished — teacher review requested' : 'Evaluation finished successfully',
      message: outcome.reason,
      metadata: { status: escalated ? 'needs_teacher_review' : 'completed', elapsedMs: Date.now() - startedAt, retries: state.retryCount },
    });

    const recordResult = {
      evaluationId,
      subject,
      questions: evaluation.questions,
      teacherFeedback: evaluation.teacherFeedback,
      topicsToImprove: evaluation.topicsToImprove,
      obtainedMarks,
      totalMarks,
      percentage,
      averageConfidence,
      pages: storedPages,
      status: escalated ? 'needs_teacher_review' : 'completed',
      agentOutcome: outcome,
      agentTrace: toTraceDocuments(state),
      elapsedMs: Date.now() - startedAt,
      createdAt: new Date().toISOString(),
    };

    const correctedPdf = await buildCorrectedPdf({ pageBuffers: annotated.map((a) => a.buffer) });
    const pdfName = 'corrected-sheets.pdf';
    fs.writeFileSync(path.join(dir, pdfName), correctedPdf);
    recordResult.correctedPdfUrl = storage.toPublicUrl(path.join(dir, pdfName));

    await storage.saveEvaluation(recordResult);

    // Free Tesseract resources between evaluations.
    resetTesseractWorker().catch(() => {});

    return recordResult;
  } catch (err) {
    if (state.status === 'running') {
      finish(state, { status: 'failed', outcome: { reason: err.message } });
    }
    record(state, {
      type: 'completion',
      step: 'completed',
      title: 'Evaluation failed',
      message: err?.isOperational ? err.message : 'An unexpected error stopped the evaluation.',
      metadata: { status: 'failed' },
    });
    throw err;
  }
}

module.exports = { runAgenticEvaluation };