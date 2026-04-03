'use client'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from './app-sidebar'
import ChatPanel from './chat-panel'
import type { AppUser } from '../layout'

type DashboardShellProps = {
  children: React.ReactNode
  user: AppUser
}

export default function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="flex flex-col min-h-screen">
        <header className="flex items-center gap-2 px-4 h-12 border-b border-border flex-shrink-0 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
