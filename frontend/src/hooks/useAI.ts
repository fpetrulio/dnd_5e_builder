import { useMutation } from '@tanstack/react-query'
import { aiApi } from '@/lib/api'

export interface AISuggestion {
  priority: 'high' | 'medium' | 'low'
  category: string
  suggestion: string
  reasoning: string
}

export interface AIAlternative {
  name: string
  description: string
  trade_offs: string
}

export interface AIAnalysis {
  analysis?: string
  strengths?: string[]
  weaknesses?: string[]
  suggestions?: AISuggestion[]
  alternative_builds?: AIAlternative[]
  raw?: string
}

export interface AIComparison {
  summary?: string
  comparison?: Record<string, { winner: string; reasoning: string }>
  recommendation?: string
  raw?: string
}

export function useAIAdvise() {
  return useMutation({
    mutationFn: ({ characterId, goal }: { characterId: string; goal: string }) =>
      aiApi.advise(characterId, goal) as Promise<AIAnalysis>,
  })
}

export function useAICompare() {
  return useMutation({
    mutationFn: (characterIds: string[]) =>
      aiApi.compare(characterIds) as Promise<AIComparison>,
  })
}
