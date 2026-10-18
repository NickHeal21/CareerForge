const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function companyLogoUrl(value) {
  if (!value) return ''
  if (/^(https?:\/\/|blob:)/i.test(value)) return value // Keep old URLs and local previews working.
  const filename = value.split(/[\\/]/).pop()
  return `${API_BASE_URL}/api/company-logos/${encodeURIComponent(filename)}`
}
