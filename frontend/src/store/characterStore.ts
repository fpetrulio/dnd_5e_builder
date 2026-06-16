import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Character, CharacterState } from '@/types/dnd'

interface CharacterStore {
  characters: Character[]
  activeCharacterId: string | null
  snapshotCache: Record<string, Record<number, CharacterState> | undefined>

  setCharacters: (chars: Character[]) => void
  setActiveCharacter: (id: string | null) => void
  cacheSnapshot: (id: string, level: number, state: CharacterState) => void
  getSnapshot: (id: string, level: number) => CharacterState | undefined
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
      characters: [],
      activeCharacterId: null,
      snapshotCache: {},

      setCharacters: (chars) => set({ characters: chars }),
      setActiveCharacter: (id) => set({ activeCharacterId: id }),

      cacheSnapshot: (id, level, state) =>
        set((s) => ({
          snapshotCache: {
            ...s.snapshotCache,
            [id]: { ...(s.snapshotCache[id] ?? {}), [level]: state },
          },
        })),

      getSnapshot: (id, level) => get().snapshotCache[id]?.[level],
    }),
    { name: 'dnd-characters' },
  ),
)
