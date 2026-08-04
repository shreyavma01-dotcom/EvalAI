import { QueryClient } from '@tanstack/react-query'
import { queryConfig } from '@/config/site'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: queryConfig,
  },
})

export default queryClient
