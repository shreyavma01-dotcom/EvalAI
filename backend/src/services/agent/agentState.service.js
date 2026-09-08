const logger = require('../../utils/logger');

/**
 * Structured state for the evaluation agent.
 *
 * The trace records concise, human-readable summaries of what the agent
 * actually observed, decided, did and verified — auditable and safe to show
 * in the UI. Raw prompts and chain-of-thought are never stored here.
 */
const TRACE_TYPES = ['goal', 'observation', 'decision', 'action', 'verification', 'adaptation', 'escalation', 'completion'];

const CATEGORY_BY_TYPE = {
  observation: 'observations',
  decision: 'decisions',
  action: 'actions',
  verification: 'verifications',
  adaptation: 'adaptations',
  escalation: 'escalations',
};

function createAgentState({ evaluationId, goal, onAgentEvent }) {
  return {
    evaluationId,
    goal: goal || "Evaluate the student's answer sheet accurately",
    status: 'running',
    currentStep: null,
    trace: [],
    observations: [],
    decisions: [],
    actions: [],
    verifications: [],
    adaptations: [],
    escalations: [],
    retryCount: 0,
    pages: [],
    unresolvedQuestions: [],
    unresolvedPages: [],
    finalOutcome: null,
    startedAt: new Date().toISOString(),
    onAgentEvent: typeof onAgentEvent === 'function' ? onAgentEvent : null,
  };
}

/**
 * Records one real agent event: pushes it into the structured state, emits
 * it as a live socket update (when a callback is wired) and logs it.
 */
function record(state, { type, step = null, title = '', message = '', metadata = null }) {
  if (!TRACE_TYPES.includes(type)) return null;
  const event = {
    type,
    step,
    title,
    message,
    metadata: metadata || undefined,
    timestamp: new Date().toISOString(),
  };
  state.currentStep = step || state.currentStep;
  state.trace.push(event);
  const category = CATEGORY_BY_TYPE[type];
  if (category) state[category].push(event);

  try {
    state.onAgentEvent?.({ ...event, evaluationId: state.evaluationId });
  } catch (err) {
    logger.warn(`Agent event emit failed: ${err.message}`);
  }
  logger.debug(`[agent:${type}]${step ? ` ${step}:` : ''} ${message}`);
  return event;
}

function bumpRetry(state) {
  state.retryCount += 1;
}

function finish(state, { status, outcome }) {
  state.status = status;
  state.finalOutcome = outcome;
}

/** Maps the live trace into the persisted mongoose `agentTrace` shape. */
function toTraceDocuments(state) {
  return state.trace.map((event) => ({
    type: event.type,
    step: event.step || undefined,
    title: event.title || undefined,
    message: event.message || '',
    metadata: event.metadata || undefined,
    createdAt: event.timestamp ? new Date(event.timestamp) : new Date(),
  }));
}

module.exports = { createAgentState, record, bumpRetry, finish, toTraceDocuments, TRACE_TYPES };