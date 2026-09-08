const { runAgenticEvaluation } = require('./agent/evaluationAgent.service');

/**
 * Public entry point kept for every existing caller (evaluate routes,
 * student-submission AI evaluation). Orchestration lives in the agentic
 * evaluation controller; the shared pipeline helpers it uses as tools
 * (image normalization, retry, PDF compilation) live in utils/pipeline.js.
 */
async function runEvaluation({ evaluationId, sheetPages, config, onStage, onAgentEvent }) {
  return runAgenticEvaluation({ evaluationId, sheetPages, config, onStage, onAgentEvent });
}

module.exports = { runEvaluation };