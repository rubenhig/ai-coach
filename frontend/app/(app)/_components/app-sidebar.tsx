'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BarChart3, Calendar, Map, Zap } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import NavUser from './nav-user'
import type { AppUser } from '../layout'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/coach', label: 'Coach IA', icon: Zap },
  { href: '/activities', label: 'Mis Actividades', icon: Activity },
  { href: '/plan', label: 'Plan de Entrenamiento', icon: Calendar },
]

type AppSidebarProps = {
  user: AppUser
}

export default function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <SidebarHeader className="border-b border-sidebar-border h-12 justify-center group-data-[collapsible=icon]:p-0">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2.5 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <div className="w-8 h-8 rounded-md bg-strava flex items-center justify-center flex-shrink-0 shadow-sm">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-bold tracking-tight text-sidebar-accent-foreground whitespace-nowrap group-data-[collapsible=icon]:hidden">
            GPTrainer
          </span>
        </Link>
      </SidebarHeader>

      {/* Navegación */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={(props) => <Link href={href} {...props} />}
                    isActive={pathname === href}
                    tooltip={label}
                    className="flex items-center gap-2 w-full"
                  >
                    <Icon className="shrink-0" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer con usuario */}
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={user} />
      </SidebarFooter>

      {/* Rail — permite colapsar/expandir pinchando el borde */}
      <SidebarRail />
    </Sidebar>
  )
}
