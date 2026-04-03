'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { AlignJustify, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'list' | 'grid'

type ViewToggleProps = {
  defaultView?: ViewMode
}

export function ViewToggle({ defaultView = 'list' }: ViewToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = (searchParams.get('view') as ViewMode) ?? defaultView

  function setView(view: ViewMode) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
      <button
        onClick={() => setView('list')}
        className={cn(
          'flex cursor-pointer items-center justify-center w-7 h-7 rounded-md transition-colors',
          current === 'list'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Vista lista"
      >
        <AlignJustify className="w-4 h-4" />
      </button>
      <button
        onClick={() => setView('grid')}
        className={cn(
          'flex cursor-pointer items-center justify-center w-7 h-7 rounded-md transition-colors',
          current === 'grid'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Vista cuadrícula"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
    </div>
  )
}
