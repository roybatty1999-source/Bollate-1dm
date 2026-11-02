import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Carica i dati da Supabase all'avvio
  const fetchSessions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setSessions(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  // Aggiungi un allenamento su Supabase
  const handleAddSession = async () => {
    const newSession = {
      title: 'Nuovo Allenamento',
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('training_sessions')
      .insert([newSession])

    if (!error) {
      fetchSessions() // Ricarica la lista per sincronizzare PC e telefono
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Bollate-1dm - Presenze</h1>
      <button onClick={handleAddSession}>Aggiungi Allenamento</button>
      
      {loading ? (
        <p>Caricamento in corso...</p>
      ) : (
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>{s.title || 'Allenamento'} - {new Date(s.created_at).toLocaleString()}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
