import { eq, and } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { goals, plannedSessions } from '../../db/schema.js'
import type { AgentMessage } from '@mariozechner/pi-agent-core'

/**
 * Builds a transformContext function that injects a one-liner summary
 * of the athlete's active goals before each LLM turn.
 *
 * This gives the LLM minimal awareness of current state without the
 * overhead of a full tool call. The LLM can then decide whether to
 * call get_current_goals for detailed information.
 */
export function buildContextTransformer(userId: number) {
  return async (messages: AgentMessage[]): Promise<AgentMessage[]> => {
    const activeGoals = await db.query.goals.findMany({
      where: and(eq(goals.userId, userId), eq(goals.status, 'active')),
      with: {
        plannedSessions: true,
      },
    })

    // Only top-level goals (no subGoals)
    const topLevel = activeGoals.filter(g => g.parentId === null)

    if (topLevel.length === 0) return messages

    const summaries = topLevel.map(g => {
      const sessions = g.plannedSessions ?? []
      const planned = sessions.filter(s => s.status === 'planned').length
      const completed = sessions.filter(s => s.status === 'completed').length
      const skipped = sessions.filter(s => s.status === 'skipped').length
      const dateStr = g.targetDate
        ? ` (${g.targetDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`
        : ''
      return `"${g.name}"${dateStr} [${planned} planned, ${completed} completed, ${skipped} skipped]`
    })

    const contextLine = `[Estado actual] Goals activos: ${summaries.join(' · ')}`

    const contextMsg: AgentMessage = {
      role: 'user',
      content: contextLine,
      timestamp: Date.now(),
    }

    return [contextMsg, ...messages]
  }
}
