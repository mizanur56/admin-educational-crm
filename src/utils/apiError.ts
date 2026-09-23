export function getApiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const data = (err as { data?: unknown }).data
    if (data && typeof data === 'object') {
      const body = data as { error?: string; message?: string }
      if (typeof body.error === 'string' && body.error.trim()) return body.error
      if (typeof body.message === 'string' && body.message.trim()) return body.message
    }
  }
  return fallback
}

export function getApiErrorFields(err: unknown): Record<string, string> {
  if (err && typeof err === 'object') {
    const data = (err as { data?: unknown }).data
    if (data && typeof data === 'object') {
      const fields = (data as { fields?: unknown }).fields
      if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
        return fields as Record<string, string>
      }
    }
  }
  return {}
}
