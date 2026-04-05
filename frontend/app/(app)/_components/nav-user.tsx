'use client'

import { useRouter } from 'next/navigation'
import { ChevronsUpDown, LogOut, Settings } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { AppUser } from '../layout'

type NavUserProps = {
  user: AppUser
}

export default function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ') || 'Atleta'
  const initials = [user.firstname?.[0], user.lastname?.[0]].filter(Boolean).join('').toUpperCase() || 'A'

  async function handleLogout() {
    await fetch('/auth/logout', { method: 'POST' })
    // Hard redirect — descarga el estado React por completo en lugar de navegar client-side
    window.location.replace('/')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex items-center gap-2 group-data-[collapsible=icon]:p-0!"
                tooltip={fullName}
              />
            }
          >
            <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
              <AvatarImage src={user.profilePicture ?? undefined} alt={fullName} />
              <AvatarFallback className="rounded-lg bg-strava text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{fullName}</span>
              <span className="truncate text-xs text-sidebar-foreground/60">Strava Athlete</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
            className="min-w-56"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-2">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.profilePicture ?? undefined} alt={fullName} />
                    <AvatarFallback className="rounded-lg bg-strava text-white text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{fullName}</span>
                    <span className="truncate text-xs text-muted-foreground">Conectado con Strava</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="size-4" />
              Ajustes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              Desconectar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
