/* eslint-disable @typescript-eslint/no-unsafe-return */
import axios, { type AxiosError } from 'axios'
import { createLogger } from './logger'

const _log = createLogger('api')

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  _log.debug(`→ ${config.method?.toUpperCase() ?? 'REQ'} ${config.url ?? ''}`)
  return config
})

api.interceptors.response.use(
  (res) => {
    _log.debug(`← ${res.status} ${res.config.url ?? ''}`)
    return res
  },
  (err: AxiosError<{ detail?: string }>) => {
    const message = err.response?.data.detail ?? err.message
    _log.error(`← ${err.response?.status ?? 'ERR'} ${err.config?.url ?? ''}: ${message}`)
    return Promise.reject(new Error(message))
  },
)

// ─── Characters ──────────────────────────────────────────────────────────────

export const charactersApi = {
  list: () => api.get('/characters').then((r) => r.data),
  get: (id: string) => api.get(`/characters/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/characters', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/characters/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/characters/${id}`),
  snapshots: (id: string) => api.get(`/characters/${id}/snapshots`).then((r) => r.data),
  snapshot: (id: string, level: number) =>
    api.get(`/characters/${id}/snapshot/${level}`).then((r) => r.data),
  levelUp: (id: string, choices: unknown) =>
    api.post(`/characters/${id}/level-up`, choices).then((r) => r.data),
  levelUpInfo: (id: string) => api.get(`/characters/${id}/level-up-info`).then((r) => r.data),
  progression: (id: string) => api.get(`/characters/${id}/progression`).then((r) => r.data),
  revert: (id: string, level: number) =>
    api.post(`/characters/${id}/revert/${level}`).then((r) => r.data),
  stats: (id: string) => api.get(`/characters/${id}/stats`).then((r) => r.data),
  simulate: (id: string, params: unknown) =>
    api.post(`/characters/${id}/simulate`, params).then((r) => r.data),
}

// ─── Resources ───────────────────────────────────────────────────────────────

export const resourcesApi = {
  classes: () => api.get('/resources/classes').then((r) => r.data),
  races: () => api.get('/resources/races').then((r) => r.data),
  backgrounds: () => api.get('/resources/backgrounds').then((r) => r.data),
  feats: () => api.get('/resources/feats').then((r) => r.data),
  spells: (params?: Record<string, unknown>) =>
    api.get('/resources/spells', { params }).then((r) => r.data),
  classSkills: () => api.get('/resources/class-skills').then((r) => r.data),
  classFeatures: (classId: string, level: number) =>
    api.get('/resources/class-features', { params: { class_id: classId, level } }).then((r) => r.data),
  subclasses: (classId: string) =>
    api.get('/resources/subclasses', { params: { class_id: classId } }).then((r) => r.data),
  armor: (classId: string) =>
    api.get('/resources/armor', { params: { class_id: classId } }).then((r) => r.data),
}

// ─── Party ───────────────────────────────────────────────────────────────────

export const partyApi = {
  list: () => api.get('/party').then((r) => r.data),
  get: (id: string) => api.get(`/party/${id}`).then((r) => r.data),
  create: (name: string) => api.post('/party', { name }).then((r) => r.data),
  delete: (id: string) => api.delete(`/party/${id}`),
  addMember: (partyId: string, characterId: string) =>
    api.post(`/party/${partyId}/members`, { character_id: characterId }).then((r) => r.data),
  removeMember: (partyId: string, characterId: string) =>
    api.delete(`/party/${partyId}/members/${characterId}`),
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export const aiApi = {
  advise: (characterId: string, goal: string) =>
    api.post('/ai/advise', { character_id: characterId, goal }).then((r) => r.data),
  compare: (characterIds: string[]) =>
    api.post('/ai/compare', { character_ids: characterIds }).then((r) => r.data),
}

// ─── Homebrew ─────────────────────────────────────────────────────────────────

export const homebrewApi = {
  list: (type?: string) =>
    api.get('/homebrew', { params: type ? { resource_type: type } : undefined }).then((r) => r.data),
  create: (data: unknown) => api.post('/homebrew', data).then((r) => r.data),
  delete: (id: string) => api.delete(`/homebrew/${id}`),
}
