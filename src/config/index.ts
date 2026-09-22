/**
 * App-wide runtime config.
 * Dev API goes through Vite proxy (`/api` → localhost:4000).
 */
function resolveDevServiceUrl(url: string | undefined): string {
  if (!url) return ''
  if (typeof window === 'undefined') return url

  const pageHost = window.location.hostname

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(pageHost)) {
    return url.replace(
      /^(https?):\/\/(?:localhost|127\.0\.0\.1|\d{1,3}(?:\.\d{1,3}){3})(?=:\d+|\/|$)/i,
      `http://${pageHost}`,
    )
  }

  if (pageHost === 'localhost' || pageHost === '127.0.0.1') {
    return url.replace(
      /^(https?):\/\/(?:\d{1,3}(?:\.\d{1,3}){3})(?=:\d+|\/|$)/i,
      `http://${pageHost}`,
    )
  }

  return url
}

const envApi = import.meta.env.VITE_API_URL as string | undefined

export const config = {
  appName: 'EduConsult CRM',
  nodeEnv: import.meta.env.MODE,
  /** Absolute API origin when set; otherwise relative `/api` (Vite proxy). */
  api: resolveDevServiceUrl(envApi) || '/api',
  imageAccessUrl: resolveDevServiceUrl(import.meta.env.VITE_IMAGE_ACCESS_URL as string | undefined),
}
