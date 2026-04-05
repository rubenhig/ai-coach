import { Agent } from '@mariozechner/pi-agent-core'
import { getModel } from '@mariozechner/pi-ai'
import { eq, asc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { coachMessages, goals } from '../db/schema.js'
import { COACH_SYSTEM_PROMPT } from './prompts/coach.js'
import { createGetTrainingContextTool } from './tools/get-training-context.js'
import { createUpdatePlanTool } from './tools/update-plan.js'
import type { TrainingPlan, CoachSSEEvent } from './types.js'
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

    let latestPlan: TrainingPlan | null = null

    const agent = new Agent({
      initialState: {
        systemPrompt: COACH_SYSTEM_PROMPT,
        model: getModel('openrouter', 'anthropic/claude-3.7-sonnet'),
        tools: [
          createGetTrainingContextTool(userId),
          createUpdatePlanTool((plan) => {
            latestPlan = plan
            onEvent({ type: 'plan_update', plan })
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
          : 'Actualizando el plan...'
        await onEvent({ type: 'tool_start', label })
      }
    })

    await agent.prompt(userMessage)

    const newMessages = agent.state.messages.slice(history.length)
    if (newMessages.length > 0) {
      await db.insert(coachMessages).values(
        newMessages.map(m => ({ userId, data: m as unknown as Record<string, unknown> }))
      )
    }

    if (latestPlan) {
      const existing = await db.query.goals.findFirst({ where: eq(goals.userId, userId) })
      const planDescription = (latestPlan as TrainingPlan).goal.description
      if (existing) {
        await db.update(goals)
          .set({ plan: latestPlan as Record<string, unknown>, description: planDescription, updatedAt: new Date() })
          .where(eq(goals.id, existing.id))
      } else {
        await db.insert(goals).values({ userId, description: planDescription, plan: latestPlan as Record<string, unknown> })
      }
    }
  }

  async getHistory(userId: number): Promise<{ messages: AgentMessage[]; plan: TrainingPlan | null }> {
    const [msgs, activeGoal] = await Promise.all([
      db.select().from(coachMessages).where(eq(coachMessages.userId, userId)).orderBy(asc(coachMessages.id)),
      db.query.goals.findFirst({ where: eq(goals.userId, userId), orderBy: asc(goals.id) }),
    ])

    return {
      messages: msgs.map(m => m.data) as AgentMessage[],
      plan: (activeGoal?.plan ?? null) as TrainingPlan | null,
    }
  }

  async clearHistory(userId: number): Promise<void> {
    await db.delete(coachMessages).where(eq(coachMessages.userId, userId))
  }
}

export const agentService = new AgentService()
