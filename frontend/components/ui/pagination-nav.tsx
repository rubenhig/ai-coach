import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type PaginationNavProps = {
  page: number
  totalPages: number
  buildHref: (page: number) => string
}

export function PaginationNav({ page, totalPages, buildHref }: PaginationNavProps) {
  if (totalPages <= 1) return null

  // Muestra hasta 5 páginas centradas en la actual
  const delta = 2
  const range: number[] = []
  for (
    let i = Math.max(1, page - delta);
    i <= Math.min(totalPages, page + delta);
    i++
  ) {
    range.push(i)
  }

  const showLeftEllipsis = range[0] > 2
  const showRightEllipsis = range[range.length - 1] < totalPages - 1

  return (
    <nav className="flex items-center justify-center gap-1 mt-6" aria-label="Paginación">
      {/* Anterior */}
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className="flex items-center justify-center w-8 h-8 rounded-md border border-border hover:bg-muted transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center justify-center w-8 h-8 rounded-md border border-border opacity-40 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </span>
      )}

      {/* Primera página */}
      {range[0] > 1 && (
        <Link href={buildHref(1)} className={pageClass(1 === page)}>1</Link>
      )}
      {showLeftEllipsis && <span className="w-8 h-8 flex items-center justify-center text-muted-foreground text-sm">…</span>}

      {/* Páginas centrales */}
      {range.map((p) => (
        <Link key={p} href={buildHref(p)} className={pageClass(p === page)} aria-current={p === page ? 'page' : undefined}>
          {p}
        </Link>
      ))}

      {/* Última página */}
      {showRightEllipsis && <span className="w-8 h-8 flex items-center justify-center text-muted-foreground text-sm">…</span>}
      {range[range.length - 1] < totalPages && (
        <Link href={buildHref(totalPages)} className={pageClass(totalPages === page)}>{totalPages}</Link>
      )}

      {/* Siguiente */}
      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          className="flex items-center justify-center w-8 h-8 rounded-md border border-border hover:bg-muted transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span className="flex items-center justify-center w-8 h-8 rounded-md border border-border opacity-40 cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  )
}

function pageClass(isActive: boolean) {
  return cn(
    'flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-colors',
    isActive
      ? 'bg-foreground text-background'
      : 'border border-border hover:bg-muted'
  )
}
