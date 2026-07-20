export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return `${base}${url}`
}
