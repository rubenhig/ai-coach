import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { ProfileSummary } from '../types'

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 60)  return `hace ${mins}m`
  if (hours < 24) return `hace ${hours}h`
  return `hace ${days}d`
}

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

export default function ProfileHeader({ user }: { user: ProfileSummary['user'] }) {
  const initials = [user.firstname, user.lastname]
    .filter(Boolean)
    .map(n => n![0].toUpperCase())
    .join('')

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg" className="size-14">
        {user.profilePicture && <AvatarImage src={user.profilePicture} alt={initials} />}
        <AvatarFallback>{initials || '?'}</AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {[user.firstname, user.lastname].filter(Boolean).join(' ') || 'Atleta'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Miembro desde {formatMemberSince(user.createdAt)}
          {user.lastSyncAt && (
            <span className="ml-3 text-muted-foreground/60">
              · Sincronizado {formatRelativeTime(user.lastSyncAt)}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
