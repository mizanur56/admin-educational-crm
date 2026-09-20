export function readUrlSearchQuery(search: string) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return (params.get('q') || params.get('search') || '').trim()
}
