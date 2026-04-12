import { Agent } from '@mariozechner/pi-agent-core'
import { getModel } from '@mariozechner/pi-ai'
import { eq, asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { coachMessages, goals, plannedSessions } from '../db/schema.js'
import { COACH_SYSTEM_PROMPT } from './prompts/coach.js'
import { createGetTrainingContextTool } from './tools/get-training-context.js'
import { createUpdateGoalTool } from './tools/update-goal.js'
import type { GoalData, CoachSSEEvent } from './types.js'
import type { AgentMessage } from '@mariozechner/pi-agent-core'

export class AgentService {
  async runCoachSession(
    userId: number,
    userMessage: string,
    onEvent: (event: CoachSSEEvent) => Promise<void>
  ): Promise<void> {
    const stored = await db
      .select()
      .from(coachMessages)
      .where(eq(coachMessages.userId, userId))
      .orderBy(asc(coachMessages.id))

    const history = stored.map(r => r.data) as AgentMessage[]

    let latestGoal: GoalData | null = null

    const agent = new Agent({
      initialState: {
        systemPrompt: COACH_SYSTEM_PROMPT,
        model: getModel('openrouter', 'anthropic/claude-3.7-sonnet'),
        tools: [
          createGetTrainingContextTool(userId),
          createUpdateGoalTool((goal) => {
            latestGoal = goal
            onEvent({ type: 'goal_update', goal })
          }),
        ],
        messages: history,
      },
    })

    agent.subscribe(async (event) => {
      if (
        event.type === 'message_update' &&
        event.assistantMessageEvent.type === 'text_delta'
      ) {
        await onEvent({ type: 'text_delta', delta: event.assistantMessageEvent.delta })
      } else if (event.type === 'tool_execution_start') {
        const label = event.toolName === 'get_training_context'
          ? 'Analizando tu historial...'
          : 'Actualizando objetivo...'
        await onEvent({ type: 'tool_start', label })
      }
    })

    await agent.prompt(userMessage)

    // Persist new messages
    const newMessages = agent.state.messages.slice(history.length)
    if (newMessages.length > 0) {
      await db.insert(coachMessages).values(
        newMessages.map(m => ({ userId, data: m as unknown as Record<string, unknown> }))
      )
    }

    // Persist goal + subgoals + sessions
    if (latestGoal) {
      await this.persistGoal(userId, latestGoal)
    }
  }

  private async persistGoal(userId: number, goalData: GoalData): Promise<void> {
    // Upsert main goal (find existing active goal or create new)
    const existing = await db.query.goals.findFirst({
      where: eq(goals.userId, userId),
    })

    let goalId: number
    const goalRow = {
      name: goalData.name,
      sport: goalData.sport,
      targetDescription: goalData.targetDescription,
      targetDate: goalData.targetDate ? new Date(goalData.targetDate) : null,
      priority: goalData.priority ?? 'A',
      status: 'active' as const,
      updatedAt: new Date(),
    }

    if (existing) {
      await db.update(goals).set(goalRow).where(eq(goals.id, existing.id))
      goalId = existing.id
      // Clear old sub-goals and sessions (cascade will handle sessions of sub-goals)
      await db.delete(goals).where(eq(goals.parentId, goalId))
      await db.delete(plannedSessions).where(eq(plannedSessions.goalId, goalId))
    } else {
      const [inserted] = await db.insert(goals).values({ userId, ...goalRow }).returning({ id: goals.id })
      goalId = inserted.id
    }

    // Insert sub-goals
    if (goalData.subGoals?.length) {
      await db.insert(goals).values(
        goalData.subGoals.map(sg => ({
          userId,
          name: sg.name,
          sport: sg.sport,
          targetDescription: sg.targetDescription,
          parentId: goalId,
          priority: 'C' as const,
          status: 'active' as const,
        }))
      )
    }

    // Insert planned sessions
    if (goalData.sessions.length) {
      await db.insert(plannedSessions).values(
        goalData.sessions.map(s => ({
          goalId,
          date: new Date(s.date),
          sport: s.sport,
          title: s.title,
          description: s.description ?? null,
          targetDuration: s.targetDuration ?? null,
          status: 'planned' as const,
        }))
      )
    }
  }

  async getHistory(userId: number): Promise<{ messages: AgentMessage[]; goal: GoalData | null }> {
    const [msgs, activeGoal] = await Promise.all([
      db.select().from(coachMessages).where(eq(coachMessages.userId, userId)).orderBy(asc(coachMessages.id)),
      db.query.goals.findFirst({
        where: eq(goals.userId, userId),
        with: { subGoals: true, plannedSessions: true },
      }),
    ])

    let goal: GoalData | null = null
    if (activeGoal) {
      goal = {
        name: activeGoal.name,
        sport: activeGoal.sport,
        targetDescription: activeGoal.targetDescription,
        targetDate: activeGoal.targetDate?.toISOString(),
        priority: activeGoal.priority,
        subGoals: (activeGoal.subGoals ?? []).map(sg => ({
          name: sg.name,
          sport: sg.sport,
          targetDescription: sg.targetDescription,
        })),
        sessions: (activeGoal.plannedSessions ?? []).map(s => ({
          date: s.date.toISOString(),
          sport: s.sport,
          title: s.title,
          description: s.description ?? undefined,
          targetDuration: s.targetDuration ?? undefined,
        })),
      }
    }

    return { messages: msgs.map(m => m.data) as AgentMessage[], goal }
  }

  async clearHistory(userId: number): Promise<void> {
    await db.delete(coachMessages).where(eq(coachMessages.userId, userId))
  }
}

export const agentService = new AgentService()
