import { useQuery } from '@tanstack/react-query'
import { resourcesApi } from '@/lib/api'

export interface DndClassApi {
  id: string
  name: string
  hit_die: number
  saving_throws: string[]
  spellcasting_ability?: string
  is_spellcaster: boolean
  source: string
}

export interface DndRaceApi {
  id: string
  name: string
  size: string
  speed: number
  ability_bonuses: Record<string, number>
  subraces?: DndSubraceApi[]
  source: string
}

export interface DndSubraceApi {
  id: string
  name: string
  race_id: string
  ability_bonuses: Record<string, number>
}

export interface DndBackgroundApi {
  id: string
  name: string
  skill_proficiencies: string[]
  tool_proficiencies: string[]
  source: string
}

export interface ClassSkillsApi {
  skills: string[]
  count: number
}

export interface ClassFeatureApi {
  level: number
  name: string
  description: string
}

export function useClasses() {
  return useQuery({
    queryKey: ['resources', 'classes'],
    queryFn: () => resourcesApi.classes() as Promise<DndClassApi[]>,
    staleTime: 1000 * 60 * 60,
  })
}

export function useRaces() {
  return useQuery({
    queryKey: ['resources', 'races'],
    queryFn: () => resourcesApi.races() as Promise<DndRaceApi[]>,
    staleTime: 1000 * 60 * 60,
  })
}

export function useBackgrounds() {
  return useQuery({
    queryKey: ['resources', 'backgrounds'],
    queryFn: () => resourcesApi.backgrounds() as Promise<DndBackgroundApi[]>,
    staleTime: 1000 * 60 * 60,
  })
}

export function useClassSkills() {
  return useQuery({
    queryKey: ['resources', 'class-skills'],
    queryFn: () => resourcesApi.classSkills() as Promise<Record<string, ClassSkillsApi>>,
    staleTime: Infinity,
  })
}

export function useClassFeatures(classId: string | undefined, level: number) {
  return useQuery({
    queryKey: ['resources', 'class-features', classId, level],
    queryFn: () => resourcesApi.classFeatures(classId as string, level) as Promise<ClassFeatureApi[]>,
    enabled: !!classId && level > 0,
    staleTime: Infinity,
  })
}
