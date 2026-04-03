'use client'

import { useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Input } from '@/components/ui/input'

type ChatInputProps = {
  onSend: (message: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta sobre tu plan o métricas..."
          disabled={disabled}
          className="pr-12 rounded-full bg-background border-border focus-visible:ring-strava"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-strava text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>
      <p className="text-center text-[10px] text-muted-foreground mt-2">
        La IA puede cometer errores. Verifica tu plan.
      </p>
    </div>
  )
}
