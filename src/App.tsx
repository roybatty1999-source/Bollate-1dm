import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

interface Player {
  id: string
  name: string
  number?: number
}

interface TrainingSession {
  id: string
  date: string
  title: string
  created_at?: string
}

interface Attendance {
  id?: string
  session_id: string
  player_id: string
  status: 'present' | 'absent' | 'late'
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPlayerName, setNewPlayerName] = useState('')

  // Caricamento iniziale dei dati da Supabase
  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    
    // 1. Carica Giocatori
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .order('name', { ascending: true })

    // 2. Carica Sessioni di Allenamento
    const { data: sessionsData } = await supabase
      .from('training_sessions')
      .select('*')
      .order('date', { ascending: false })

    // 3. Carica Presenze
    const { data: attendancesData } = await supabase
      .from('attendances')
      .select('*')

    if (playersData) setPlayers(playersData)
    if (sessionsData) {
      setSessions(sessionsData)
      if (sessionsData.length > 0 && !selectedSessionId) {
        setSelectedSessionId(sessionsData[0].id)
      }
    }
    if (attendancesData) setAttendances(attendancesData)

    setLoading(false)
  }

  // Aggiunge una nuova sessione di allenamento
  const handleAddSession = async () => {
    const title = prompt('Inserisci titolo o descrizione allenamento:', 'Allenamento')
    if (!title) return

    const newSession = {
      title,
      date: new Date().toISOString().split('T')[0]
    }

    const { data, error } = await supabase
      .from('training_sessions')
      .insert([newSession])
      .select()

    if (error) {
      alert('Errore nella creazione dell\'allenamento: ' + error.message)
    } else if (data) {
      await loadAllData()
      setSelectedSessionId(data[0].id)
    }
  }

  // Aggiunge un nuovo giocatore
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return

    const { error } = await supabase
      .from('players')
      .insert([{ name: newPlayerName.trim() }])

    if (!error) {
      setNewPlayerName('')
      loadAllData()
    } else {
      alert('Errore nell\'aggiunta del giocatore: ' + error.message)
    }
  }

  // Cambia lo stato della presenza di un giocatore
  const toggleAttendance = async (playerId: string, currentStatus: string | undefined) => {
    if (!selectedSessionId) return

    let newStatus: 'present' | 'absent' | 'late' = 'present'
    if (currentStatus === 'present') newStatus = 'absent'
    else if (currentStatus === 'absent') newStatus = 'late'
    else if (currentStatus === 'late') newStatus = 'present'

    const existing = attendances.find(
      a => a.session_id === selectedSessionId && a.player_id === playerId
    )

    if (existing && existing.id) {
      const { error } = await supabase
        .from('attendances')
        .update({ status: newStatus })
        .eq('id', existing.id)

      if (!error) loadAllData()
    } else {
      const { error } = await supabase
        .from('attendances')
        .insert([{
          session_id: selectedSessionId,
          player_id: playerId,
          status: newStatus
        }])

      if (!error) loadAllData()
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Caricamento dati in corso...</h2>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '2px solid #0055a5', paddingBottom: 15, marginBottom: 20 }}>
        <h1 style={{ color: '#0055a5', margin: 0 }}>Bollate-1dm - Presenze Squadra</h1>
      </header>

      {/* Sezione Creazione e Selezione Allenamenti */}
      <section style={{ backgroundColor: '#f5f5f5', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Allenamenti</h3>
          <button 
            onClick={handleAddSession}
            style={{ backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}
          >
            + Nuovo Allenamento
          </button>
        </div>

        {sessions.length === 0 ? (
          <p>Nessuna sessione trovata. Creane una nuova!</p>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 4,
                  border: selectedSessionId === s.id ? '2px solid #0055a5' : '1px solid #ccc',
                  backgroundColor: selectedSessionId === s.id ? '#e3f2fd' : '#fff',
                  cursor: 'pointer'
                }}
              >
                <strong>{s.title}</strong> ({s.date})
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Sezione Presenze Giocatori */}
      {selectedSessionId && (
        <section style={{ marginBottom: 30 }}>
          <h3>Tabella Presenze</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
            <thead>
              <tr style={{ backgroundColor: '#0055a5', color: '#fff' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>Giocatore</th>
                <th style={{ padding: 10, textAlign: 'center' }}>Stato Presenza</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => {
                const att = attendances.find(
                  a => a.session_id === selectedSessionId && a.player_id === p.id
                )
                const status = att?.status

                let bg = '#eee'
                let text = 'Non Segnato'
                if (status === 'present') { bg = '#c8e6c9'; text = 'Presente'; }
                if (status === 'absent') { bg = '#ffcdd2'; text = 'Assente'; }
                if (status === 'late') { bg = '#fff9c4'; text = 'Ritardo'; }

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: 10 }}>{p.name}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <button
                        onClick={() => toggleAttendance(p.id, status)}
                        style={{
                          backgroundColor: bg,
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {text}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Sezione Aggiungi Giocatore */}
      <section style={{ borderTop: '1px solid #ddd', paddingTop: 15 }}>
        <h4>Aggiungi nuovo giocatore in rosa</h4>
        <form onSubmit={handleAddPlayer} style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Nome cognome giocatore..."
            value={newPlayerName}
            onChange={e => setNewPlayerName(e.target.value)}
            style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>
            Salva Giocatore
          </button>
        </form>
      </section>
    </div>
  )
}
