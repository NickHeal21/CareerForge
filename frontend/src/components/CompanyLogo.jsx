import { useEffect, useState } from 'react'
import { companyLogoUrl } from '../utils/companyLogo'

export default function CompanyLogo({ value, name, className = 'h-11 w-11', textClassName = 'text-lg' }) {
  const [failed, setFailed] = useState(false)
  const src = companyLogoUrl(value)
  useEffect(() => setFailed(false), [src])
  const initials = (name || 'CO').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-indigo-500/10 font-bold text-indigo-200 ${textClassName} ${className}`}>
    {src && !failed ? <img src={src} alt={`${name || 'Company'} logo`} className="h-full w-full object-cover" onError={() => setFailed(true)} /> : initials}
  </div>
}
