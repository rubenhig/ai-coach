import { Agent } from '@mariozechner/pi-agent-core'
import { getModel } from '@mariozechner/pi-ai'
import { eq, asc, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { coachMessages, goals, plannedSessions } from '../db/schema.js'
import { buildSystemPrompt } from './prompts/coach.js'
import { buildContextTransformer } from './context/transformer.js'
import { createGetTrainingContextTool } from './tools/get-training-context.js'
import { createGetCurrentGoalsTool } from './tools/get-current-goals.js'
import { createSaveGoalTool } from './tools/save-goal.js'
import { createPrescribeSessionsTool } from './tools/prescribe-sessions.js'
import { createUpdateSessionTool } from './tools/update-session.js'
import type { CoachSSEEvent, GoalView } from './types.js'
import type { AgentMessage } from '@mariozechner/pi-agent-core'

export class AgentService {
  async runCoachSession(
    userId: number,
    userMessage: string,
    onEvent: (event: CoachSSEEvent) => Promise<void>,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    const stored = await db
      .select()
      .from(coachMessages)
      .where(eq(coachMessages.userId, userId))
      .orderBy(asc(coachMessages.id))

    const history = stored.map(r => r.data) as AgentMessage[]

    const emitEvent = (event: CoachSSEEvent) => {
      if (abortSignal?.aborted) return
      onEvent(event)
    }

    const agent = new Agent({
      initialState: {
        systemPrompt: buildSystemPrompt(),
        model: getModel('openrouter', 'anthropic/claude-3.7-sonnet'),
        tools: [
          createGetTrainingContextTool(userId),
          createGetCurrentGoalsTool(userId),
          createSaveGoalTool(userId, emitEvent),
          createPrescribeSessionsTool(userId, emitEvent),
          createUpdateSessionTool(userId, emitEvent),
        ],
        messages: history,
      },
      toolExecution: 'sequential',
      transformContext: buildContextTransformer(userId),
      sessionId: `coach-${userId}`,
    })

    agent.subscribe(async (event) => {
      if (
        event.type === 'message_update' &&
        event.assistantMessageEvent.type === 'text_delta'
      ) {
        await onEvent({ type: 'text_delta', delta: event.assistantMessageEvent.delta })
      } else if (event.type === 'tool_execution_start') {
        const labels: Record<string, string> = {
          get_training_context: 'Analizando tu historial...',
          get_current_goals: 'Revisando tus objetivos...',
          save_goal: 'Guardando objetivo...',
          prescribe_sessions: 'Prescribiendo sesiones...',
          update_session: 'Actualizando sesión...',
        }
        await onEvent({ type: 'tool_start', label: labels[event.toolName] ?? 'Procesando...' })
      }
    })

    // Abort support: if client disconnects, abort the agent
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => agent.abort(), { once: true })
    }

    await agent.prompt(userMessage)

    // Don't persist if aborted
    if (abortSignal?.aborted) return

    // Persist new messages
    const newMessages = agent.state.messages.slice(history.length)
    if (newMessages.length > 0) {
      await db.insert(coachMessages).values(
        newMessages.map(m => ({ userId, data: m as unknown as Record<string, unknown> }))
      )
    }
  }

  async getHistory(userId: number): Promise<{ messages: AgentMessage[]; goals: GoalView[] }> {
    const [msgs, activeGoals] = await Promise.all([
      db.select().from(coachMessages).where(eq(coachMessages.userId, userId)).orderBy(asc(coachMessages.id)),
      db.query.goals.findMany({
        where: and(eq(goals.userId, userId), eq(goals.status, 'active')),
        with: {
          subGoals: true,
          plannedSessions: { orderBy: (ps, { asc }) => [asc(ps.date)] },
        },
      }),
    ])

    const topLevel = activeGoals.filter(g => g.parentId === null)

    const goalViews: GoalView[] = topLevel.map(g => ({
      id: g.id,
      name: g.name,
      sport: g.sport,
      targetDescription: g.targetDescription,
      targetDate: g.targetDate?.toISOString() ?? null,
      priority: g.priority,
      status: g.status,
      subGoals: (g.subGoals ?? []).map(sg => ({
        id: sg.id,
        name: sg.name,
        sport: sg.sport,
        targetDescription: sg.targetDescription,
        status: sg.status,
      })),
      sessions: (g.plannedSessions ?? []).map(s => ({
        id: s.id,
        date: s.date.toISOString(),
        sport: s.sport,
        title: s.title,
        description: s.description,
        targetDuration: s.targetDuration,
        status: s.status,
        linkedActivityId: s.linkedActivityId,
      })),
    }))

    return { messages: msgs.map(m => m.data) as AgentMessage[], goals: goalViews }
  }

  async clearHistory(userId: number): Promise<void> {
    await db.delete(coachMessages).where(eq(coachMessages.userId, userId))
  }
}

export const agentService = new AgentService()
