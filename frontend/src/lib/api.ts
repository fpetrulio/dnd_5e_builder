/* eslint-disable @typescript-eslint/no-unsafe-return */
import axios, { type AxiosError } from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ detail?: string }>) => {
    const message = err.response?.data.detail ?? err.message
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
  snapshot: (id: string, level: number) =>
    api.get(`/characters/${id}/snapshot/${level}`).then((r) => r.data),
  levelUp: (id: string, choices: unknown) =>
    api.post(`/characters/${id}/level-up`, choices).then((r) => r.data),
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
}

// ─── Party ───────────────────────────────────────────────────────────────────

export const partyApi = {
  list: () => api.get('/party').then((r) => r.data),
  get: (id: string) => api.get(`/party/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/party', data).then((r) => r.data),
  optimize: (id: string) => api.get(`/party/${id}/optimize`).then((r) => r.data),
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export const aiApi = {
  advise: (characterId: string, goal: string) =>
    api.post('/ai/advise', { character_id: characterId, goal }).then((r) => r.data),
  compare: (characterIds: string[]) =>
    api.post('/compare', { character_ids: characterIds }).then((r) => r.data),
}
