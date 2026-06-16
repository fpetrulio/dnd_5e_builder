import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import CharactersPage from '@/pages/CharactersPage'
import CharacterPage from '@/pages/CharacterPage'
import CharacterWizardPage from '@/pages/CharacterWizardPage'
import LevelUpWizardPage from '@/pages/LevelUpWizardPage'
import SnapshotPage from '@/pages/SnapshotPage'
import ComparePage from '@/pages/ComparePage'
import PartyPage from '@/pages/PartyPage'
import PartyDetailPage from '@/pages/PartyDetailPage'
import HomebrewPage from '@/pages/HomebrewPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="characters" element={<CharactersPage />} />
          <Route path="characters/new" element={<CharacterWizardPage />} />
          <Route path="characters/:id" element={<CharacterPage />} />
          <Route path="characters/:id/level-up" element={<LevelUpWizardPage />} />
          <Route path="characters/:id/snapshot/:level" element={<SnapshotPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="party" element={<PartyPage />} />
          <Route path="party/:id" element={<PartyDetailPage />} />
          <Route path="homebrew" element={<HomebrewPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
