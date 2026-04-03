'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal, Zap } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import ChatMessage, { type ChatMessageProps } from './chat-message'
import ChatInput from './chat-input'

const INITIAL_MESSAGES: ChatMessageProps[] = [
  {
    role: 'assistant',
    content:
      '¡Buen trabajo en las series de pista esta mañana! Tu ritmo medio en los 400m fue de 3:45/km y tu recuperación cardíaca fue excelente.',
  },
  {
    role: 'assistant',
    content:
      'Dado el esfuerzo (TSS 65), ¿cómo te sientes de las piernas? Tenemos un rodaje Z2 de 60 min programado para mañana.',
  },
  {
    role: 'user',
    content: 'Me siento un poco cargado en los gemelos derechos, la verdad. El cardio muy bien.',
  },
]

export default function ChatPanel() {
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState<ChatMessageProps[]>(INITIAL_MESSAGES)
  const [isTyping, setIsTyping] = useState(false)

  function handleSend(content: string) {
    setMessages((prev) => [...prev, { role: 'user', content }])
    setIsTyping(true)
    // Simulación de respuesta — se reemplazará con la IA real
    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Entendido. Ajustaré el plan teniendo en cuenta esa carga muscular.' },
      ])
    }, 1500)
  }

  return (
    <div
      className={cn(
        'relative flex flex-col border-l border-border bg-card transition-all duration-300 ease-in-out flex-shrink-0',
        open ? 'w-80' : 'w-0 border-l-0 overflow-hidden'
      )}
    >
      {/* Toggle button — siempre visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-6 h-12 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
        aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
      >
        {open ? (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-strava flex items-center justify-center bg-card">
              <Zap className="w-5 h-5 text-strava" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Coach IA</h3>
            <p className="text-xs text-muted-foreground">Analizando tus métricas...</p>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 text-sm">
          <div className="flex justify-center">
            <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full border border-border">
              Hoy
            </span>
          </div>
          <Separator className="opacity-0" />
          {messages.map((msg, i) => (
            <ChatMessage key={i} {...msg} />
          ))}
          {isTyping && <ChatMessage role="assistant" content="" isTyping />}
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  )
}
