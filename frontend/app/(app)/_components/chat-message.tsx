import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MessageRole = 'assistant' | 'user'

export type ChatMessageProps = {
  role: MessageRole
  content: string
  isTyping?: boolean
}

export default function ChatMessage({ role, content, isTyping }: ChatMessageProps) {
  const isAssistant = role === 'assistant'

  return (
    <div className={cn('flex gap-3', !isAssistant && 'justify-end')}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-strava" />
        </div>
      )}

      <div
        className={cn(
          'rounded-2xl p-3 text-sm shadow-sm max-w-[85%]',
          isAssistant
            ? 'bg-muted/50 border border-border/50 text-foreground rounded-tl-sm'
            : 'bg-strava/10 border border-strava/20 text-foreground rounded-tr-sm'
        )}
      >
        {isTyping ? (
          <div className="flex items-center gap-1.5 h-4 px-1">
            {[0, 150, 300].map((delay) => (
              <div
                key={delay}
                className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        ) : (
          <p>{content}</p>
        )}
      </div>

      {!isAssistant && (
        <div className="w-8 h-8 opacity-0 flex-shrink-0" />
      )}
    </div>
  )
}
