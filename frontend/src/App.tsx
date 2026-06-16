import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import CharactersPage from '@/pages/CharactersPage'
import CharacterPage from '@/pages/CharacterPage'
import ComparePage from '@/pages/ComparePage'
import PartyPage from '@/pages/PartyPage'
import HomebrewPage from '@/pages/HomebrewPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="characters" element={<CharactersPage />} />
          <Route path="characters/:id" element={<CharacterPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="party" element={<PartyPage />} />
          <Route path="homebrew" element={<HomebrewPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
