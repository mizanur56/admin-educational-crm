export function userPhotoSrc(photoUrl?: string | null) {
  if (!photoUrl) {
    return ''
  }
  if (photoUrl.startsWith('http') || photoUrl.startsWith('/')) {
    return photoUrl
  }
  return ''
}

export function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 'U'
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

export default function UserAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string
  photoUrl?: string | null
  className?: string
}) {
  const src = userPhotoSrc(photoUrl)
  return (
    <span className={className}>
      {src ? <img key={src} src={src} alt="" /> : userInitials(name)}
    </span>
  )
}
