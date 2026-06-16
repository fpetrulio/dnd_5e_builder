import { useParams } from 'react-router-dom'

export default function CharacterPage() {
  const { id } = useParams()
  return <div><h1 className="text-2xl font-bold">Personaggio #{id}</h1></div>
}
