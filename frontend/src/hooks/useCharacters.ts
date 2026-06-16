import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { charactersApi } from '@/lib/api'

export interface SnapshotSummary {
  id: number
  level: number
  created_at: string
}

export interface LevelUpInfo {
  can_level_up: boolean
  reason?: string
  new_total_level?: number
  new_class_level?: number
  class_id?: string
  hit_die?: number
  average_hp?: number
  has_asi?: boolean
  has_subclass_choice?: boolean
}

export interface ASIChoice {
  method: 'single' | 'split' | 'feat' | 'none'
  ability_single?: string
  ability_a?: string
  ability_b?: string
  feat_name?: string
}

export interface LevelUpChoices {
  hp_method: 'average' | 'roll' | 'manual'
  hp_value?: number
  subclass_id?: string
  asi_choice?: ASIChoice
  new_skill_proficiencies?: string[]
}

export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: () => charactersApi.list() as Promise<CharacterApiResponse[]>,
  })
}

export function useCharacter(id: string | undefined) {
  return useQuery({
    queryKey: ['characters', id],
    queryFn: () => charactersApi.get(id as string) as Promise<CharacterApiResponse>,
    enabled: !!id,
  })
}

export function useCreateCharacter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CharacterCreatePayload) => charactersApi.create(data) as Promise<CharacterApiResponse>,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['characters'] }),
  })
}

export function useUpdateCharacter(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CharacterCreatePayload>) =>
      charactersApi.update(id, data) as Promise<CharacterApiResponse>,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['characters'] })
      void qc.invalidateQueries({ queryKey: ['characters', id] })
    },
  })
}

export function useDeleteCharacter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => charactersApi.delete(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['characters'] }),
  })
}

export function useSnapshots(characterId: string | undefined) {
  return useQuery({
    queryKey: ['snapshots', characterId],
    queryFn: () => charactersApi.snapshots(characterId as string) as Promise<SnapshotSummary[]>,
    enabled: !!characterId,
  })
}

export function useCharacterSnapshot(characterId: string | undefined, level: number | undefined) {
  return useQuery({
    queryKey: ['snapshot', characterId, level],
    queryFn: () =>
      charactersApi.snapshot(characterId as string, level as number) as Promise<CharacterApiResponse>,
    enabled: !!characterId && level !== undefined,
  })
}

export function useLevelUpInfo(characterId: string | undefined) {
  return useQuery({
    queryKey: ['level-up-info', characterId],
    queryFn: () => charactersApi.levelUpInfo(characterId as string) as Promise<LevelUpInfo>,
    enabled: !!characterId,
  })
}

export function useLevelUp(characterId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (choices: LevelUpChoices) =>
      charactersApi.levelUp(characterId, choices) as Promise<CharacterApiResponse>,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['characters'] })
      void qc.invalidateQueries({ queryKey: ['characters', characterId] })
      void qc.invalidateQueries({ queryKey: ['snapshots', characterId] })
      void qc.invalidateQueries({ queryKey: ['level-up-info', characterId] })
    },
  })
}

export function useRevert(characterId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (level: number) =>
      charactersApi.revert(characterId, level) as Promise<CharacterApiResponse>,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['characters'] })
      void qc.invalidateQueries({ queryKey: ['characters', characterId] })
      void qc.invalidateQueries({ queryKey: ['snapshots', characterId] })
      void qc.invalidateQueries({ queryKey: ['level-up-info', characterId] })
    },
  })
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface CharacterApiResponse {
  id: string
  name: string
  state: CharacterState
  computed: ComputedStats
  created_at: string
}

export interface CharacterState {
  race_id: string
  subrace_id?: string
  background_id: string
  alignment: string
  classes: ClassEntry[]
  ability_scores: Record<string, number>
  skill_proficiencies: string[]
  skill_expertise: string[]
  hp_rolls: number[]
  armor_id?: string
  shield_equipped: boolean
  spells_known: string[]
  cantrips_known: string[]
  feats: string[]
  current_level: number
  xp: number
  notes: string
  inspiration: boolean
}

export interface ClassEntry {
  class_id: string
  level: number
  subclass_id?: string
}

export interface ComputedStats {
  total_level: number
  proficiency_bonus: number
  ability_modifiers: Record<string, number>
  hp_max: number
  armor_class: number
  initiative: number
  speed: number
  saving_throws: Record<string, number>
  skills: Record<string, number>
  passive_perception: number
  spell_slots: Record<string, number>
  spell_save_dc?: number
  spell_attack_bonus?: number
}

export interface CharacterCreatePayload {
  name: string
  state: Partial<CharacterState>
}
