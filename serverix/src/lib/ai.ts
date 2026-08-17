// ─── AI Abstraction Layer ──────────────────────────────
// Supports MOCK / LIVE modes.
// Default: MOCK (no paid calls during development).
//
// Set env vars:
//   AI_MODE=mock|live
//   AI_PAID_REQUESTS_ENABLED=false|true   ← hard safety switch

import { prisma } from './prisma'

export type AIMode = 'mock' | 'live'
export type AIOperation =
  | 'ticket_classify'
  | 'ticket_reply_suggest'
  | 'player_risk_score'
  | 'moderation_summary'
  | 'general'

export interface AIRequest {
  operation: AIOperation
  prompt: string
  context?: Record<string, unknown>
  adminId?: string
  relatedId?: string
}

export interface AIResponse {
  content: string
  model: string
  provider: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  isMock: boolean
}

// ─── Mode detection ─────────────────────────────────

function getMode(): AIMode {
  return (process.env.AI_MODE ?? 'mock') as AIMode
}

function isPaidEnabled(): boolean {
  return process.env.AI_PAID_REQUESTS_ENABLED === 'true'
}

// ─── Mock responses ──────────────────────────────────

const MOCK_RESPONSES: Record<AIOperation, string> = {
  ticket_classify: JSON.stringify({
    category: 'PURCHASE_ISSUE',
    priority: 'HIGH',
    summary: 'Hráč si zakoupil VIP rank, ale nebyl mu přiřazen.',
    suggestedAction: 'Zkontrolovat transakci a přiřadit rank ručně.',
    confidence: 0.91,
  }),
  ticket_reply_suggest: `Dobrý den,

děkujeme za nahlášení problému. Vaši transakci jsme zkontrolovali a rank vám byl nyní přiřazen. Pokud budete mít další otázky, neváhejte nás kontaktovat.

S pozdravem,
Tým Aunaria`,
  player_risk_score: JSON.stringify({
    score: 0.15,
    level: 'LOW',
    flags: [],
    summary: 'Hráč vykazuje standardní chování, bez anomálií.',
  }),
  moderation_summary: 'Hráč má 2 dřívější varování za griefing. Doporučuje se dočasný ban 24h.',
  general: '[MOCK AI odpověď — nastavte AI_MODE=live pro reálné výsledky]',
}

// ─── Core execute function ────────────────────────────

export async function executeAI(req: AIRequest): Promise<AIResponse> {
  const mode = getMode()
  const start = Date.now()

  // Safety: never accidentally charge money in dev
  if (mode === 'live' && !isPaidEnabled()) {
    throw new Error(
      'AI_PAID_REQUESTS_ENABLED=false — live AI calls are disabled. ' +
      'Set AI_PAID_REQUESTS_ENABLED=true to enable (costs real money).'
    )
  }

  let response: AIResponse

  if (mode === 'mock') {
    // Simulate slight delay for realism
    await new Promise(r => setTimeout(r, 50 + Math.random() * 100))
    response = {
      content: MOCK_RESPONSES[req.operation] ?? MOCK_RESPONSES.general,
      model: 'mock-1.0',
      provider: 'mock',
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      isMock: true,
    }
  } else {
    // TODO: implement live providers (OpenAI / Anthropic)
    // Cheap model for classification, strong model for reasoning
    throw new Error('Live AI provider not yet configured. Set AI_MODE=mock for development.')
  }

  // Record usage
  try {
    await prisma.aIUsage.create({
      data: {
        provider: response.provider,
        model: response.model,
        operation: req.operation,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        costUsd: response.costUsd,
        latencyMs: Date.now() - start,
        success: true,
        relatedId: req.relatedId,
        adminId: req.adminId,
      },
    })
  } catch {
    // Non-fatal: don't fail the request if usage logging fails
  }

  return response
}

// ─── Typed helpers ────────────────────────────────────

export async function classifyTicket(subject: string, content: string, adminId?: string, ticketId?: string) {
  const result = await executeAI({
    operation: 'ticket_classify',
    prompt: `Ticket subject: ${subject}\n\nContent: ${content}`,
    adminId,
    relatedId: ticketId,
  })
  try {
    return JSON.parse(result.content) as {
      category: string
      priority: string
      summary: string
      suggestedAction: string
      confidence: number
    }
  } catch {
    return null
  }
}

export async function suggestTicketReply(
  subject: string,
  messages: { role: 'player' | 'staff'; content: string }[],
  adminId?: string,
  ticketId?: string
) {
  const history = messages.map(m => `[${m.role}]: ${m.content}`).join('\n')
  const result = await executeAI({
    operation: 'ticket_reply_suggest',
    prompt: `Ticket: ${subject}\n\nHistory:\n${history}`,
    adminId,
    relatedId: ticketId,
  })
  return result.content
}

export async function getPlayerRiskScore(playerId: string, adminId?: string) {
  const result = await executeAI({
    operation: 'player_risk_score',
    prompt: `Analyze player risk for playerId: ${playerId}`,
    adminId,
    relatedId: playerId,
  })
  try {
    return JSON.parse(result.content) as {
      score: number
      level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      flags: string[]
      summary: string
    }
  } catch {
    return null
  }
}
