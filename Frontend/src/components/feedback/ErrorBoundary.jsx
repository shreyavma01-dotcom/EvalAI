import { Component } from 'react'
import { ErrorState } from './ErrorState'

/**
 * Catches render errors anywhere below it and shows a graceful error state.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message ?? '' }
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error)
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-[60vh] place-items-center p-6">
          <ErrorState
            title="Something went wrong"
            message={this.state.message || 'An unexpected error occurred in this section.'}
            onRetry={this.handleRetry}
            retryLabel="Reload section"
          />
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
