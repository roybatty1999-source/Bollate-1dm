import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCheck,
  UserX,
  FileText,
  TrendingUp,
  Award,
  ChevronRight,
  Save,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

// Dati di esempio pre-caricati per la prima esecuzione
const ROLES = [
  { code: 'P', label: 'Palleggiatore', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
  { code: 'O', label: 'Opposto', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
  { code: 'L', label: 'Libero', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { code: 'C', label: 'Centrale', badge: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300' },
  { code: 'M', label: 'Banda', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
];

const DEFAULT_ROLE = 'M';

const getRole = (code) => ROLES.find((r) => r.code === code) || ROLES.find((r) => r.code === DEFAULT_ROLE);

const normalizeRole = (role) => {
  const match = ROLES.find((r) => r.code === role || r.label === role);
  return match ? match.code : DEFAULT_ROLE;
};

const DEFAULT_PLAYERS = [
  { id: '1', name: 'Riccardo', surname: 'Boga', role: 'M', number: '75' },
  { id: '2', name: 'Luca', surname: 'Bontempi', role: 'M', number: '4' },
  { id: '3', name: 'Mattia Michele', surname: 'Canevari', role: 'C', number: '33' },
  { id: '4', name: 'Mirko', surname: 'De Santis', role: 'L', number: '80' },
  { id: '5', name: 'Linfeng', surname: 'Hu', role: 'O', number: '74' },
  { id: '6', name: 'Matteo', surname: 'Mariani', role: 'M', number: '10' },
  { id: '7', name: 'Manuel', surname: 'Martinazzi', role: 'M', number: '7' },
  { id: '8', name: 'Daniel', surname: 'Mc Millan', role: 'M', number: '1' },
  { id: '9', name: 'Federico', surname: 'Missoni', role: 'C', number: '78' },
  { id: '10', name: 'Matteo', surname: 'Moscatelli', role: 'O', number: '9' },
  { id: '11', name: 'Christian', surname: 'Rezzano', role: 'M', number: '11' },
  { id: '12', name: 'Alessandro', surname: 'Salvadori del Prato', role: 'C', number: '22' },
  { id: '13', name: 'Lorenzo', surname: 'Salvadori Del Prato', role: 'C', number: '3' },
  { id: '14', name: 'Dennis', surname: 'Tocci', role: 'M', number: '14' },
  { id: '15', name: 'Mattia', surname: 'Vicinanza', role: 'P', number: '67' },
  { id: '16', name: 'Mirko', surname: 'Faggiano', role: 'P', number: '21' },
];

const DEFAULT_SESSIONS = [];

export default function App() {
  // Stato Principale
  const [activeTab, setActiveTab] = useState('register'); // register, players, history, stats
  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem('team_players_v2');
    if (!saved) return DEFAULT_PLAYERS;
    return JSON.parse(saved).map((p) => ({ ...p, role: normalizeRole(p.role) }));
  });

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('team_sessions_v2');
    return saved ? JSON.parse(saved) : DEFAULT_SESSIONS;
  });

  // Sessione Selezionata Corrente
  const [selectedSessionId, setSelectedSessionId] = useState(() => {
    const saved = localStorage.getItem('team_sessions_v2');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_SESSIONS;
    return parsed.length > 0 ? parsed[0].id : '';
  });

  // Filtri e Ricerca
  const [searchPlayer, setSearchPlayer] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modali e Form State
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [playerForm, setPlayerForm] = useState({ name: '', surname: '', role: DEFAULT_ROLE, number: '' });

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '18:30',
    notes: ''
  });

  // Salvataggio automatico in LocalStorage
  useEffect(() => {
    localStorage.setItem('team_players_v2', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('team_sessions_v2', JSON.stringify(sessions));
  }, [sessions]);

  // Gestione Sessione Attuale
  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  // Creazione Nuova Sessione
  const handleCreateSession = (e) => {
    e.preventDefault();
    const newSession = {
      id: 's_' + Date.now(),
      date: sessionForm.date,
      time: sessionForm.time,
      notes: sessionForm.notes,
      attendance: {}
    };

    // Inizializza le presenze per tutti i giocatori attuali
    players.forEach(p => {
      newSession.attendance[p.id] = { status: 'present', note: '' };
    });

    setSessions([newSession, ...sessions]);
    setSelectedSessionId(newSession.id);
    setShowSessionModal(false);
    setSessionForm({ date: new Date().toISOString().split('T')[0], time: '18:30', notes: '' });
  };

  // Cambio Stato Presenza Singolo Giocatore
  const handleAttendanceChange = (playerId, status) => {
    if (!selectedSessionId) return;

    setSessions(prevSessions =>
      prevSessions.map(session => {
        if (session.id === selectedSessionId) {
          const currentAttendance = session.attendance[playerId] || { status: 'present', note: '' };
          return {
            ...session,
            attendance: {
              ...session.attendance,
              [playerId]: { ...currentAttendance, status }
            }
          };
        }
        return session;
      })
    );
  };

  // Cambio Nota Singolo Giocatore
  const handleNoteChange = (playerId, note) => {
    if (!selectedSessionId) return;

    setSessions(prevSessions =>
      prevSessions.map(session => {
        if (session.id === selectedSessionId) {
          const currentAttendance = session.attendance[playerId] || { status: 'present', note: '' };
          return {
            ...session,
            attendance: {
              ...session.attendance,
              [playerId]: { ...currentAttendance, note }
            }
          };
        }
        return session;
      })
    );
  };

  // Imposta Presenza Massa
  const handleBulkAttendance = (status) => {
    if (!selectedSessionId) return;

    setSessions(prevSessions =>
      prevSessions.map(session => {
        if (session.id === selectedSessionId) {
          const updatedAttendance = { ...session.attendance };
          players.forEach(p => {
            const currentNote = updatedAttendance[p.id]?.note || '';
            updatedAttendance[p.id] = { status, note: currentNote };
          });
          return { ...session, attendance: updatedAttendance };
        }
        return session;
      })
    );
  };

  // Gestione Giocatori (Aggiunta / Modifica / Elimina)
  const handleSavePlayer = (e) => {
    e.preventDefault();
    if (editingPlayer) {
      setPlayers(players.map(p => p.id === editingPlayer.id ? { ...playerForm, id: editingPlayer.id } : p));
    } else {
      const newPlayer = { ...playerForm, id: 'p_' + Date.now() };
      setPlayers([...players, newPlayer]);
      
      // Aggiungi di default il giocatore presente in tutte le sessioni esistenti
      setSessions(prev => prev.map(s => ({
        ...s,
        attendance: {
          ...s.attendance,
          [newPlayer.id]: { status: 'present', note: '' }
        }
      })));
    }
    setShowPlayerModal(false);
    setEditingPlayer(null);
    setPlayerForm({ name: '', surname: '', role: DEFAULT_ROLE, number: '' });
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setPlayerForm({ name: player.name, surname: player.surname, role: player.role, number: player.number });
    setShowPlayerModal(true);
  };

  const handleDeletePlayer = (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo giocatore?")) {
      setPlayers(players.filter(p => p.id !== id));
    }
  };

  const handleDeleteSession = (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questa sessione di allenamento?")) {
      const filtered = sessions.filter(s => s.id !== id);
      setSessions(filtered);
      if (selectedSessionId === id) {
        setSelectedSessionId(filtered.length > 0 ? filtered[0].id : '');
      }
    }
  };

  // Calcolo Statistiche Globali ed Individuali
  const playerStats = useMemo(() => {
    return players.map(player => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let injured = 0;
      let totalSessions = 0;

      sessions.forEach(session => {
        const att = session.attendance[player.id];
        if (att) {
          totalSessions++;
          if (att.status === 'present') present++;
          else if (att.status === 'absent') absent++;
          else if (att.status === 'late') late++;
          else if (att.status === 'injured') injured++;
        }
      });

      const effectivePresent = present + late; // Consideriamo anche i ritardi come presenze effive per la percentuale
      const rate = totalSessions > 0 ? Math.round((effectivePresent / totalSessions) * 100) : 0;

      return {
        ...player,
        present,
        absent,
        late,
        injured,
        totalSessions,
        rate
      };
    });
  }, [players, sessions]);

  const globalStats = useMemo(() => {
    if (sessions.length === 0 || players.length === 0) return { avgAttendance: 0, totalSessions: 0 };
    
    let totalPossible = sessions.length * players.length;
    let totalPresent = 0;

    sessions.forEach(s => {
      Object.values(s.attendance).forEach(att => {
        if (att.status === 'present' || att.status === 'late') {
          totalPresent++;
        }
      });
    });

    return {
      avgAttendance: Math.round((totalPresent / totalPossible) * 100) || 0,
      totalSessions: sessions.length
    };
  }, [sessions, players]);

  // Filtro Giocatori Visibili
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      const matchesSearch = `${p.name} ${p.surname} ${p.number}`.toLowerCase().includes(searchPlayer.toLowerCase());
      const matchesRole = roleFilter === 'all' || p.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [players, searchPlayer, roleFilter]);

  // Helper Badge Stato Presenza
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> Presente</span>;
      case 'absent':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"><XCircle className="w-3.5 h-3.5" /> Assente</span>;
      case 'late':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"><Clock className="w-3.5 h-3.5" /> In Ritardo</span>;
      case 'injured':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"><AlertCircle className="w-3.5 h-3.5" /> Infortunato</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* HEADER / NAVIGATION */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo / Titolo */}
            <div className="flex items-center gap-3">
  <img
  src="/bva-logo.webp"
  alt="Bollate Volley Academy"
  width={48}
  height={48}
  className="w-12 h-12 object-contain"
  />
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
  Prima Divisione Presenze 2026/27
  </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Gestione Rosa & Allenamenti</p>
              </div>
            </div>

            {/* Navigazione Desktop */}
            <nav className="hidden md:flex space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('register')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Registro Presenze
              </button>
              <button
                onClick={() => setActiveTab('players')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'players'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" /> Rosa Giocatori ({players.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4" /> Allenamenti ({sessions.length})
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'stats'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Statistiche
              </button>
            </nav>

            {/* Pulsante Nuova Sessione */}
            <button
              onClick={() => setShowSessionModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuovo Allenamento</span>
            </button>
          </div>
        </div>

        {/* Bottom Nav Mobile */}
        <div className="flex md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 justify-around">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex flex-col items-center py-1.5 px-3 text-xs font-medium rounded-lg ${
              activeTab === 'register' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Presenze</span>
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`flex flex-col items-center py-1.5 px-3 text-xs font-medium rounded-lg ${
              activeTab === 'players' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Rosa</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center py-1.5 px-3 text-xs font-medium rounded-lg ${
              activeTab === 'history' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Storico</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center py-1.5 px-3 text-xs font-medium rounded-lg ${
              activeTab === 'stats' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Stats</span>
          </button>
        </div>
      </header>

      {/* CONTENUTO PRINCIPALE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* 1. SEZIONE REGISTRO PRESENZE */}
        {activeTab === 'register' && (
          <div className="space-y-6">
            
            {/* Selettore Sessione & Azioni Veloci */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Dropdown seleziona allenamento */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Seleziona Sessione di Allenamento
                  </label>
                  {sessions.length > 0 ? (
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {sessions.map(s => (
                        <option key={s.id} value={s.id}>
                          {new Date(s.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} - Ore {s.time} {s.notes ? `(${s.notes})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-slate-500 italic">Nessuna sessione creata. Creane una nuova!</p>
                  )}
                </div>

                {/* Pulsanti Rapidi Massa */}
                {currentSession && (
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleBulkAttendance('present')}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all"
                    >
                      <CheckCheck className="w-4 h-4" /> Tutti Presenti
                    </button>
                    <button
                      onClick={() => handleBulkAttendance('absent')}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all"
                    >
                      <UserX className="w-4 h-4" /> Tutti Assenti
                    </button>
                  </div>
                )}
              </div>

              {/* Dettagli Sessione Selezionata */}
              {currentSession && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    {new Date(currentSession.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    {currentSession.time}
                  </span>
                  {currentSession.notes && (
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {currentSession.notes}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Lista Giocatori per Registro Presenze */}
            {currentSession ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    Appello Giocatori <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-700 dark:text-slate-300">{players.length}</span>
                  </h3>
                  
                  {/* Ricerca Veloce */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cerca giocatore..."
                      value={searchPlayer}
                      onChange={(e) => setSearchPlayer(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map(player => {
                      const att = currentSession.attendance[player.id] || { status: 'present', note: '' };
                      return (
                        <div key={player.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors">
                          
                          {/* Info Giocatore */}
                          <div className="flex items-center gap-3.5 min-w-[220px]">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-sm shadow-inner shrink-0">
                              #{player.number || '-'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white leading-tight">
                                {player.name} {player.surname}
                              </h4>
                              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold ${getRole(player.role).badge}`}>
                                  {getRole(player.role).code}
                                </span>
                                {getRole(player.role).label}
                              </span>
                            </div>
                          </div>

                          {/* Selettore Stato Presenza */}
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <button
                              onClick={() => handleAttendanceChange(player.id, 'present')}
                              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                att.status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                            </button>

                            <button
                              onClick={() => handleAttendanceChange(player.id, 'absent')}
                              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                att.status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Assente
                            </button>

                            <button
                              onClick={() => handleAttendanceChange(player.id, 'late')}
                              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                att.status === 'late'
                                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" /> Ritardo
                            </button>

                            <button
                              onClick={() => handleAttendanceChange(player.id, 'injured')}
                              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                att.status === 'injured'
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                              }`}
                            >
                              <AlertCircle className="w-3.5 h-3.5" /> Infortunio
                            </button>
                          </div>

                          {/* Campo Note Singolo Giocatore */}
                          <div className="w-full lg:w-64">
                            <input
                              type="text"
                              placeholder="Aggiungi nota (es. Ritardo 10m)..."
                              value={att.note || ''}
                              onChange={(e) => handleNoteChange(player.id, e.target.value)}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-500">Nessun giocatore trovato.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nessuna sessione di allenamento</h3>
                <p className="text-sm text-slate-500 mb-4">Crea il tuo primo allenamento per iniziare a segnare le presenze.</p>
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all"
                >
                  Crea Allenamento Ora
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. SEZIONE GESTIONE ROSA GIOCATORI */}
        {activeTab === 'players' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Rosa Giocatori</h2>
                <p className="text-xs text-slate-500">Gestisci i membri della squadra, aggiungi o modifica i loro ruoli.</p>
              </div>
              <button
                onClick={() => {
                  setEditingPlayer(null);
                  setPlayerForm({ name: '', surname: '', role: DEFAULT_ROLE, number: '' });
                  setShowPlayerModal(true);
                }}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> Aggiungi Giocatore
              </button>
            </div>

            {/* Filtri Ricerca e Ruolo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cerca per nome o numero..."
                  value={searchPlayer}
                  onChange={(e) => setSearchPlayer(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 text-sm rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Tutti i Ruoli</option>
                {ROLES.map((r) => (
                  <option key={r.code} value={r.code}>{r.code} - {r.label}</option>
                ))}
              </select>
            </div>

            {/* Griglia Giocatori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPlayers.map(player => (
                <div key={player.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-sm">
                        #{player.number || '-'}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditPlayer(player)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Modifica"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {player.name} {player.surname}
                    </h3>
                    <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 text-xs rounded-md font-medium ${getRole(player.role).badge}`}>
                      <span className="font-bold">{getRole(player.role).code}</span>
                      {getRole(player.role).label}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 flex justify-between items-center">
                    <span>Presenze Totali:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {sessions.filter(s => s.attendance[player.id]?.status === 'present' || s.attendance[player.id]?.status === 'late').length} / {sessions.length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. SEZIONE STORICO ALLENAMENTI */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Storico Allenamenti</h2>
                <p className="text-xs text-slate-500">Elenco completo di tutte le sessioni svolte.</p>
              </div>
              <button
                onClick={() => setShowSessionModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nuova Sessione
              </button>
            </div>

            <div className="space-y-4">
              {sessions.length > 0 ? (
                sessions.map(session => {
                  // Calcolo statistiche della singola sessione
                  const total = players.length;
                  let presentCount = 0;
                  let absentCount = 0;
                  let lateCount = 0;
                  let injuredCount = 0;

                  Object.values(session.attendance).forEach(att => {
                    if (att.status === 'present') presentCount++;
                    if (att.status === 'absent') absentCount++;
                    if (att.status === 'late') lateCount++;
                    if (att.status === 'injured') injuredCount++;
                  });

                  return (
                    <div key={session.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-500/50 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg text-slate-900 dark:text-white">
                              {new Date(session.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-md">
                              Ore {session.time}
                            </span>
                          </div>
                          {session.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {session.notes}
                            </p>
                          )}
                        </div>

                        {/* Contatori rapidi */}
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            Presenti: {presentCount + lateCount}
                          </span>
                          <span className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800">
                            Assenti: {absentCount}
                          </span>
                          {injuredCount > 0 && (
                            <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800">
                              Infortunati: {injuredCount}
                            </span>
                          )}
                        </div>

                        {/* Azioni */}
                        <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
                          <button
                            onClick={() => {
                              setSelectedSessionId(session.id);
                              setActiveTab('register');
                            }}
                            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                          >
                            Visualizza/Modifica <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Elimina Sessione"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-500">Nessun allenamento registrato nello storico.</div>
              )}
            </div>
          </div>
        )}

        {/* 4. SEZIONE STATISTICHE E DASHBOARD */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            
            {/* Cards Panoramica Globale */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Media Presenze Squadra</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{globalStats.avgAttendance}%</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Allenamenti Totali</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{globalStats.totalSessions}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Giocatori in Rosa</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{players.length}</p>
                </div>
              </div>
            </div>

            {/* Tabella Dettaglio Giocatori */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Statistiche Individuali Giocatori
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-4">Giocatore</th>
                      <th className="p-4">Ruolo</th>
                      <th className="p-4 text-center">Presenze</th>
                      <th className="p-4 text-center">Ritardi</th>
                      <th className="p-4 text-center">Assenze</th>
                      <th className="p-4 text-center">Infortuni</th>
                      <th className="p-4 text-center">% Presenza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs sm:text-sm">
                    {playerStats.map(stat => (
                      <tr key={stat.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">
                          <span className="text-slate-400 mr-2">#{stat.number}</span>
                          {stat.name} {stat.surname}
                        </td>
                        <td className="p-4 text-slate-500">{getRole(stat.role).code} - {getRole(stat.role).label}</td>
                        <td className="p-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">{stat.present}</td>
                        <td className="p-4 text-center font-semibold text-amber-500">{stat.late}</td>
                        <td className="p-4 text-center font-semibold text-rose-500">{stat.absent}</td>
                        <td className="p-4 text-center font-semibold text-indigo-500">{stat.injured}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  stat.rate >= 80 ? 'bg-emerald-500' : stat.rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${stat.rate}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 w-8">{stat.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODALE AGGIUNGI/MODIFICA GIOCATORE */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingPlayer ? 'Modifica Giocatore' : 'Aggiungi Nuovo Giocatore'}
            </h3>
            
            <form onSubmit={handleSavePlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Es. Marco"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Cognome</label>
                <input
                  type="text"
                  required
                  value={playerForm.surname}
                  onChange={(e) => setPlayerForm({ ...playerForm, surname: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Es. Rossi"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Ruolo</label>
                  <select
                    value={playerForm.role}
                    onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r.code} value={r.code}>{r.code} - {r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Numero Maglia</label>
                  <input
                    type="text"
                    value={playerForm.number}
                    onChange={(e) => setPlayerForm({ ...playerForm, number: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Es. 10"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPlayerModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all"
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE NUOVA SESSIONE */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Nuova Sessione di Allenamento
            </h3>
            
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.date}
                    onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Ora Inizio</label>
                  <input
                    type="time"
                    required
                    value={sessionForm.time}
                    onChange={(e) => setSessionForm({ ...sessionForm, time: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descrizione / Note Sessione</label>
                <textarea
                  rows="3"
                  value={sessionForm.notes}
                  onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Es. Tattica di gioco, Partitella, Preparazione atletica..."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all"
                >
                  Crea Sessione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
