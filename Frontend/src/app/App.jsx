import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { EvaluationPage } from '@/pages/evaluation/EvaluationPage'

/**
 * EvalAI — a single-screen AI answer sheet evaluation studio.
 * The app opens directly here: upload handwritten pages, Gemini reads and
 * evaluates them, and the annotated result is shown on the same screen.
 */
export function App() {
  return (
    <ErrorBoundary>
      <EvaluationPage />
    </ErrorBoundary>
  )
}

export default App
