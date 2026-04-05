'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Palette, Moon, Sun } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

// ─── Accent presets ──────────────────────────────────────────────────────────

type Preset = { name: string; label: string; swatch: string }

const PRESETS: Preset[] = [
  { name: 'zinc',   label: 'Zinc',    swatch: '#71717a' },
  { name: 'orange', label: 'Naranja', swatch: '#f97316' },
  { name: 'blue',   label: 'Azul',    swatch: '#3b82f6' },
  { name: 'green',  label: 'Verde',   swatch: '#22c55e' },
  { name: 'violet', label: 'Violeta', swatch: '#8b5cf6' },
  { name: 'rose',   label: 'Rosa',    swatch: '#f43f5e' },
]

const STORAGE_KEY = 'gpt-accent'
const DEFAULT = 'zinc'

function applyAccent(name: string) {
  if (name === 'zinc' || !name) {
    document.documentElement.removeAttribute('data-accent')
  } else {
    document.documentElement.setAttribute('data-accent', name)
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ThemeCustomizer({ collapsed }: { collapsed?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [accent, setAccent] = useState(DEFAULT)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(STORAGE_KEY) ?? DEFAULT
    setAccent(saved)
    applyAccent(saved)
  }, [])

  function handleAccent(name: string) {
    setAccent(name)
    localStorage.setItem(STORAGE_KEY, name)
    applyAccent(name)
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Sheet>
      <SheetTrigger
        title="Apariencia"
        className="flex items-center gap-2 w-full rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      >
        <Palette className="w-4 h-4 shrink-0" />
        {!collapsed && <span>Apariencia</span>}
      </SheetTrigger>

      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Apariencia</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-1">
          {/* Mode toggle */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Modo</p>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors
                  ${mounted && !isDark
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Sun className="w-4 h-4" />
                Claro
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors
                  ${mounted && isDark
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Moon className="w-4 h-4" />
                Oscuro
              </button>
            </div>
          </div>

          {/* Accent color */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Color de acento</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => handleAccent(preset.name)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors
                    ${accent === preset.name
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-black/10"
                    style={{ background: preset.swatch }}
                  />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
