import { useEffect, useState } from 'react'
import { getProfilePhoto } from '../api/profile'

export default function ProfilePhotoAvatar({ profileImage, previewUrl = '', name, size = 'h-16 w-16', className = '' }) {
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    let active = true
    let objectUrl = ''
    setImageUrl('')
    if (profileImage && !previewUrl) {
      getProfilePhoto()
        .then(({ data }) => {
          objectUrl = URL.createObjectURL(data)
          if (active) setImageUrl(objectUrl)
          else URL.revokeObjectURL(objectUrl)
        })
        .catch(() => {
          if (active) setImageUrl('')
        })
    }
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [profileImage, previewUrl])

  const displayedImage = previewUrl || imageUrl
  return <div className={`relative ${size} shrink-0 overflow-hidden rounded-full border border-indigo-400/25 bg-indigo-500/10 ${className}`} aria-label={name ? `${name}'s profile photo` : 'Profile photo'}>
    {displayedImage ? <img src={displayedImage} alt={`${name || 'User'} profile`} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-lg font-bold text-indigo-200">{name?.trim()?.charAt(0)?.toUpperCase() || 'U'}</span>}
  </div>
}
