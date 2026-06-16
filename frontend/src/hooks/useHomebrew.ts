import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { homebrewApi } from '@/lib/api'

export interface HomebrewResource {
  id: string
  type: string
  name: string
  source: string
  data: Record<string, unknown>
  created_at: string
}

export interface HomebrewCreatePayload {
  type: string
  name: string
  source_label?: string
  data?: Record<string, unknown>
}

export function useHomebrew(type?: string) {
  return useQuery({
    queryKey: ['homebrew', type ?? 'all'],
    queryFn: () => homebrewApi.list(type) as Promise<HomebrewResource[]>,
  })
}

export function useCreateHomebrew() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: HomebrewCreatePayload) =>
      homebrewApi.create(payload) as Promise<{ id: string; name: string; type: string }>,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['homebrew'] }),
  })
}

export function useDeleteHomebrew() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => homebrewApi.delete(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['homebrew'] }),
  })
}
