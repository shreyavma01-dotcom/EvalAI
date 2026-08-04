import apiClient from './apiClient'

/**
 * Evaluation API service — real end-to-end evaluation.
 * Handwritten page images are posted to the backend, which runs real OCR and
 * Gemini evaluation, annotates the sheets and returns the full result.
 * No answer key is required — Gemini evaluates using its own reasoning.
 */
export const evaluationsApi = {
  /**
   * Run a live evaluation.
   * @param {{ answerSheets: File[], evaluationId: string }} payload
   */
  evaluate: (payload) => {
    const form = new FormData()
    for (const file of payload.answerSheets ?? []) form.append('answerSheets', file)
    form.append('evaluationId', payload.evaluationId)
    return apiClient
      .post('/evaluation/evaluate', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300_000,
      })
      .then((response) => response.data.data)
  },
}

export default evaluationsApi
