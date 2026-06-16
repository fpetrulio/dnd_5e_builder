import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { partyApi } from '@/lib/api'

export interface PartyMemberSummary {
  character_id: string
  name: string
  class_id: string
  level: number
  hp: number
  ac: number
  race_id: string
  background_id: string
}

export interface PartyDetail {
  id: string
  name: string
  members: PartyMemberSummary[]
  role_coverage: Record<string, boolean>
}

export interface PartySummary {
  id: string
  name: string
  member_count: number
}

export function useParties() {
  return useQuery({
    queryKey: ['parties'],
    queryFn: () => partyApi.list() as Promise<PartySummary[]>,
  })
}

export function useParty(partyId: string | undefined) {
  return useQuery({
    queryKey: ['party', partyId],
    queryFn: () => partyApi.get(partyId as string) as Promise<PartyDetail>,
    enabled: !!partyId,
  })
}

export function useCreateParty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => partyApi.create(name) as Promise<PartyDetail>,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['parties'] }),
  })
}

export function useDeleteParty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (partyId: string) => partyApi.delete(partyId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['parties'] }),
  })
}

export function useAddMember(partyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (characterId: string) =>
      partyApi.addMember(partyId, characterId) as Promise<PartyDetail>,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['party', partyId] }),
  })
}

export function useRemoveMember(partyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (characterId: string) => partyApi.removeMember(partyId, characterId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['party', partyId] }),
  })
}
