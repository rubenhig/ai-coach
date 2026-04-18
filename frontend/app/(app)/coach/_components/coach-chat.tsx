'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Zap, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import GoalPanel from './goal-panel'
import type { GoalView, CoachSSEEvent, CoachHistory } from './types'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function CoachChat({ initial }: { initial: CoachHistory }) {
  const [messages, setMessages] = useState<Message[]>(() =>
    initial.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }))
  )
  const [goals, setGoals] = useState<GoalView[]>(initial.goals ?? [])
  const [input, setValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [toolLabel, setToolLabel] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  // Upsert a goal by ID into the goals array
  function upsertGoal(updated: GoalView) {
    setGoals(prev => {
      const idx = prev.findIndex(g => g.id === updated.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = updated
        return next
      }
      return [...prev, updated]
    })
  }

  // Merge sessions into a goal
  function mergeSessions(goalId: number, sessions: GoalView['sessions']) {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g
      return { ...g, sessions }
    }))
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || isStreaming) return

    setValue('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setIsStreaming(true)
    setToolLabel(null)

    let assistantText = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok || !res.body) throw new Error('Request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as CoachSSEEvent

            switch (event.type) {
              case 'text_delta':
                assistantText += event.delta
                setMessages(prev => {
                  const next = [...prev]
                  next[next.length - 1] = { role: 'assistant', content: assistantText }
                  return next
                })
                setToolLabel(null)
                break
              case 'tool_start':
                setToolLabel(event.label)
                break
              case 'goal_update':
                upsertGoal(event.goal)
                break
              case 'sessions_update':
                mergeSessions(event.goalId, event.sessions)
                break
              case 'session_update':
                // Single session update — update within its goal
                setGoals(prev => prev.map(g => {
                  if (g.id !== event.session.goalId) return g
                  return {
                    ...g,
                    sessions: g.sessions.map(s => s.id === event.session.id ? event.session : s),
                  }
                }))
                break
              case 'done':
                break
              case 'error':
                throw new Error(event.message)
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'assistant',
          content: 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
        }
        return next
      })
    } finally {
      setIsStreaming(false)
      setToolLabel(null)
      inputRef.current?.focus()
    }
  }

  async function clearHistory() {
    await fetch('/api/coach/history', { method: 'DELETE' })
    setMessages([])
    setGoals([])
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Chat column */}
      <div className="flex flex-col w-[420px] flex-shrink-0 border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-primary/40 flex items-center justify-center bg-primary/5">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Coach IA</p>
              <p className="text-xs text-muted-foreground">
                {isStreaming ? toolLabel ?? 'Escribiendo...' : 'Listo'}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
              title="Borrar conversación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <p className="text-sm font-medium text-muted-foreground">¿Cuál es tu próximo objetivo?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ej: "El 15 de mayo tengo un Hyrox y quiero hacerlo en 1h15"
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={`rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary/10 border border-primary/20 rounded-tr-sm'
                  : 'bg-muted/50 border border-border/50 rounded-tl-sm'
              }`}>
                {msg.content || (
                  <div className="flex items-center gap-1 h-4">
                    {[0, 150, 300].map((d) => (
                      <div
                        key={d}
                        className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isStreaming && toolLabel && messages[messages.length - 1]?.content === '' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-10">
              <div className="flex gap-1">
                {[0, 150, 300].map((d) => (
                  <div key={d} className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
              {toolLabel}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border flex-shrink-0">
          <div className="relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Cuéntame tu objetivo..."
              disabled={isStreaming}
              className="pr-11"
            />
            <button
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Goal column */}
      <div className="flex-1 overflow-hidden">
        <GoalPanel goals={goals} isThinking={isStreaming} />
      </div>
    </div>
  )
}
