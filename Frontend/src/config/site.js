import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '@/constants/app'

export const siteConfig = {
  name: APP_NAME,
  tagline: APP_TAGLINE,
  description: APP_DESCRIPTION,
  url: 'https://evalai.app',
  author: 'EvalAI Team',
  keywords: [
    'EvalAI',
    'answer sheet evaluation',
    'AI grading',
    'OCR',
    'education',
    'exam evaluation',
  ],
}

export const apiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 30_000,
}

export const queryConfig = {
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  retry: 1,
  refetchOnWindowFocus: false,
}
