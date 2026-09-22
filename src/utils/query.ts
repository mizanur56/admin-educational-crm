/** Build a query string from defined string values. */
export function toQuery(params: Record<string, string | undefined | null>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value)
    }
  })
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}
