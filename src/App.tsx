import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
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
  RefreshCw,
  ChevronRight,
  Printer,
  X,
  Shield
} from 'lucide-react';

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

export default function App() {
  const [activetab, setActivetab] = useState('register');
  const [teams, setTeams] = useState([]);
  const [selectedteamid, setSelectedteamid] = useState('');
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [selectedsessionid, setSelectedsessionid] = useState('');
  const [loading, setLoading] = useState(true);

  const [searchplayer, setSearchplayer] = useState('');
  const [rolefilter, setRolefilter] = useState('all');

  const [showplayermodal, setShowplayermodal] = useState(false);
  const [editingplayer, setEditingplayer] = useState(null);
  const [playerform, setPlayerform] = useState({ firstname: '', lastname: '', role: DEFAULT_ROLE, number: '' });

  const [showsessionmodal, setShowsessionmodal] = useState(false);
  const [editingsession, setEditingsession] = useState(null);
  const [sessionform, setSessionform] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '18:30',
    notes: ''
  });

  const [showteammodal, setShowteammodal] = useState(false);
  const [teamform, setTeamform] = useState({ name: '' });

  const [selectedplayerdetail, setSelectedplayerdetail] = useState(null);

  useEffect(() => {
    loadSupabaseData();
  }, []);

  const loadSupabaseData = async () => {
    setLoading(true);
    try {
      const { data: teamsData } = await supabase.from('teams').select('*');
      const { data: playersData } = await supabase.from('players').select('*');
      const { data: sessionsData } = await supabase.from('training_sessions').select('*');
      const { data: attendancesData } = await supabase.from('attendances').select('*');

      if (teamsData && teamsData.length > 0) {
        setTeams(teamsData);
        if (!selectedteamid) {
          setSelectedteamid(teamsData[0].id);
        }
      } else {
        const { data: newTeam } = await supabase.from('teams').insert([{ name: 'Prima Divisione' }]).select();
        if (newTeam && newTeam.length > 0) {
          setTeams(newTeam);
          setSelectedteamid(newTeam[0].id);
        }
      }

      if (playersData) {
        setPlayers(playersData.map(p => ({ ...p, role: normalizeRole(p.role) })));
      }
      if (sessionsData) {
        const sortedSessions = sessionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSessions(sortedSessions);
        if (sortedSessions.length > 0 && !selectedsessionid) {
          setSelectedsessionid(sortedSessions[0].id);
        }
      }
      if (attendancesData) {
        setAttendances(attendancesData);
      }
    } catch (error) {
      console.error('Errore nel caricamento da Supabase:', error);
    }
    setLoading(false);
  };

  const currentTeamPlayers = useMemo(() => {
    if (!selectedteamid) return players;
    return players.filter(p => p.team_id === selectedteamid);
  }, [players, selectedteamid]);

  const currentSession = useMemo(() => {
    const session = sessions.find(s => s.id === selectedsessionid) || null;
    if (!session) return null;

    const sessionAttendances = {};
    attendances
      .filter(att => att.session_id === selectedsessionid)
      .forEach(att => {
        sessionAttendances[att.player_id] = { status: att.status, note: att.note || '' };
      });

    return { ...session, attendance: sessionAttendances };
  }, [sessions, attendances, selectedsessionid]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamform.name.trim()) return;

    const { data, error } = await supabase.from('teams').insert([{ name: teamform.name }]).select();
    if (!error && data && data.length > 0) {
      setTeams([...teams, data[0]]);
      setSelectedteamid(data[0].id);
      setShowteammodal(false);
      setTeamform({ name: '' });
      loadSupabaseData();
    } else {
      alert("Errore nella creazione della squadra");
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    const newSessionPayload = {
      date: sessionform.date,
      time: sessionform.time,
      notes: sessionform.notes
    };

    const { data, error } = await supabase
      .from('training_sessions')
      .insert([newSessionPayload])
      .select();

    if (!error && data && data.length > 0) {
      const createdSession = data[0];
      setSessions([createdSession, ...sessions]);
      setSelectedsessionid(createdSession.id);
      setShowsessionmodal(false);
      setSessionform({ date: new Date().toISOString().split('T')[0], time: '18:30', notes: '' });
      loadSupabaseData();
    } else {
      alert('Errore nella creazione della sessione');
    }
  };

  const handleUpdateSession = async (e) => {
    e.preventDefault();
    if (!editingsession) return;

    const { error } = await supabase
      .from('training_sessions')
      .update({
        date: sessionform.date,
        time: sessionform.time,
        notes: sessionform.notes
      })
      .eq('id', editingsession.id);

    if (!error) {
      setEditingsession(null);
      setShowsessionmodal(false);
      setSessionform({ date: new Date().toISOString().split('T')[0], time: '18:30', notes: '' });
      loadSupabaseData();
    } else {
      alert("Errore durante l'aggiornamento dell'allenamento");
    }
  };

  const handleAttendanceChange = async (playerId, status) => {
    if (!selectedsessionid) return;

    const existingAtt = attendances.find(
      att => att.session_id === selectedsessionid && att.player_id === playerId
    );

    const currentNote = existingAtt ? existingAtt.note : '';

    if (existingAtt) {
      const { error } = await supabase
        .from('attendances')
        .update({ status, note: currentNote })
        .eq('id', existingAtt.id);

      if (!error) loadSupabaseData();
    } else {
      const { error } = await supabase
        .from('attendances')
        .insert([{ session_id: selectedsessionid, player_id: playerId, status, note: '' }]);

      if (!error) loadSupabaseData();
    }
  };

  const handleNoteChange = async (playerId, note) => {
    if (!selectedsessionid) return;

    const existingAtt = attendances.find(
      att => att.session_id === selectedsessionid && att.player_id === playerId
    );

    const currentStatus = existingAtt ? existingAtt.status : 'present';

    if (existingAtt) {
      const { error } = await supabase
        .from('attendances')
        .update({ status: currentStatus, note })
        .eq('id', existingAtt.id);

      if (!error) loadSupabaseData();
    } else {
      const { error } = await supabase
        .from('attendances')
        .insert([{ session_id: selectedsessionid, player_id: playerId, status: 'present', note }]);

      if (!error) loadSupabaseData();
    }
  };

  const handleBulkAttendance = async (status) => {
    if (!selectedsessionid) return;

    for (const player of currentTeamPlayers) {
      const existingAtt = attendances.find(
        att => att.session_id === selectedsessionid && att.player_id === player.id
      );

      if (existingAtt) {
        await supabase
          .from('attendances')
          .update({ status })
          .eq('id', existingAtt.id);
      } else {
        await supabase
          .from('attendances')
          .insert([{ session_id: selectedsessionid, player_id: player.id, status, note: '' }]);
      }
    }
    loadSupabaseData();
  };

  const handleSavePlayer = async (e) => {
    e.preventDefault();
    if (!selectedteamid) {
      alert("Seleziona prima una squadra!");
      return;
    }

    if (editingplayer) {
      const { error } = await supabase
        .from('players')
        .update({ first_name: playerform.firstname, last_name: playerform.lastname, role: playerform.role, number: playerform.number, team_id: selectedteamid })
        .eq('id', editingplayer.id);

      if (!error) {
        setShowplayermodal(false);
        setEditingplayer(null);
        setPlayerform({ firstname: '', lastname: '', role: DEFAULT_ROLE, number: '' });
        loadSupabaseData();
      }
    } else {
      const { error } = await supabase
        .from('players')
        .insert([{ first_name: playerform.firstname, last_name: playerform.lastname, role: playerform.role, number: playerform.number, team_id: selectedteamid }]);

      if (!error) {
        setShowplayermodal(false);
        setPlayerform({ firstname: '', lastname: '', role: DEFAULT_ROLE, number: '' });
        loadSupabaseData();
      }
    }
  };

  const handleEditPlayer = (player) => {
    setEditingplayer(player);
    setPlayerform({ firstname: player.first_name, lastname: player.last_name, role: player.role, number: player.number || '' });
    setShowplayermodal(true);
  };

  const handleDeletePlayer = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questo giocatore?")) {
      const { error } = await supabase.from('players').delete().eq('id', id);
      if (!error) loadSupabaseData();
    }
  };

  const handleDeleteSession = async (id) => {
    if (window.confirm("Sei sicuro di voler eliminare questa sessione di allenamento?")) {
      await supabase.from('attendances').delete().eq('session_id', id);
      const { error } = await supabase.from('training_sessions').delete().eq('id', id);
      if (!error) loadSupabaseData();
    }
  };

  const handlePrintStats = () => {
    window.print();
  };

  const playerStats = useMemo(() => {
    return currentTeamPlayers.map(player => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let injured = 0;
      let totalSessions = sessions.length;

      sessions.forEach(session => {
        const att = attendances.find(a => a.session_id === session.id && a.player_id === player.id);
        if (att) {
          if (att.status === 'present') present++;
          else if (att.status === 'absent') absent++;
          else if (att.status === 'late') late++;
          else if (att.status === 'injured') injured++;
        }
      });

      const effectivePresent = present + late;
      const rate = totalSessions > 0 ? Math.round((effectivePresent / totalSessions) * 100) : 0;

      return { ...player, present, absent, late, injured, totalSessions, rate };
    });
  }, [currentTeamPlayers, sessions, attendances]);

  const playerAbsencesDetails = useMemo(() => {
    if (!selectedplayerdetail) return [];
    const details = [];

    sessions.forEach(session => {
      const att = attendances.find(a => a.session_id === session.id && a.player_id === selectedplayerdetail.id);
      if (att) {
        if (att.status === 'absent') {
          details.push({ date: session.date, status: 'assente', note: att.note });
        } else if (att.status === 'injured') {
          details.push({ date: session.date, status: 'infortunato', note: att.note });
        }
      }
    });

    return details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedplayerdetail, sessions, attendances]);

  const globalStats = useMemo(() => {
    if (sessions.length === 0 || currentTeamPlayers.length === 0) return { avgAttendance: 0, totalSessions: 0 };
    let totalPossible = sessions.length * currentTeamPlayers.length;
    let totalPresent = 0;

    sessions.forEach(session => {
      currentTeamPlayers.forEach(player => {
        const att = attendances.find(a => a.session_id === session.id && a.player_id === player.id);
        if (att && (att.status === 'present' || att.status === 'late')) {
          totalPresent++;
        }
      });
    });

    return {
      avgAttendance: totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0,
      totalSessions: sessions.length
    };
  }, [sessions, currentTeamPlayers, attendances]);

  const filteredPlayers = useMemo(() => {
    return currentTeamPlayers.filter(p => {
      const fullname = `${p.first_name} ${p.last_name} ${p.number || ''}`.toLowerCase();
      const matchesSearch = fullname.includes(searchplayer.toLowerCase());
      const matchesRole = rolefilter === 'all' || p.role === rolefilter;
      return matchesSearch && matchesRole;
    });
  }, [currentTeamPlayers, searchplayer, rolefilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-3" />
          <p className="text-sm">Connessione al database Supabase...</p>
        </div>
      </div>
    );
  }

  const currentTeam = teams.find(t => t.id === selectedteamid);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src="/bva-logo.webp" alt="Bollate Volley Academy" width={48} height={48} className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-base sm:text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Gestione Presenze BVA
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <select 
                    value={selectedteamid} 
                    onChange={(e) => setSelectedteamid(e.target.value)}
                    className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg px-2 py-0.5 focus:outline-none"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button onClick={() => setShowteammodal(true)} className="text-[10px] text-slate-400 hover:text-emerald-600 underline">
                    + Nuova Squadra
                  </button>
                </div>
              </div>
            </div>

            {/* Navigazione Desktop */}
            <nav className="hidden md:flex space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <button onClick={() => setActivetab('register')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activetab === 'register' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
                <CheckCircle2 className="w-4 h-4" /> Registro
              </button>
              <button onClick={() => setActivetab('players')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activetab === 'players' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
                <Users className="w-4 h-4" /> Rosa ({currentTeamPlayers.length})
              </button>
              <button onClick={() => setActivetab('history')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activetab === 'history' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
                <Calendar className="w-4 h-4" /> Allenamenti
              </button>
              <button onClick={() => setActivetab('stats')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activetab === 'stats' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
                <BarChart3 className="w-4 h-4" /> Statistiche
              </button>
            </nav>

            <div className="flex items-center gap-2">
              <button onClick={() => { setEditingsession(null); setSessionform({ date: new Date().toISOString().split('T')[0], time: '18:30', notes: '' }); setShowsessionmodal(true); }} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-md transition-all active:scale-95">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuovo Allenamento</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigazione Mobile */}
        <div className="md:hidden flex overflow-x-auto bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-1.5 gap-1 print:hidden">
          <button onClick={() => setActivetab('register')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activetab === 'register' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Registro
          </button>
          <button onClick={() => setActivetab('players')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activetab === 'players' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
            <Users className="w-3.5 h-3.5" /> Rosa
          </button>
          <button onClick={() => setActivetab('history')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activetab === 'history' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
            <Calendar className="w-3.5 h-3.5" /> Storico
          </button>
          <button onClick={() => setActivetab('stats')} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activetab === 'stats' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
            <BarChart3 className="w-3.5 h-3.5" /> Stats
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none">
        {activetab === 'register' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Seleziona Sessione di Allenamento ({currentTeam?.name})
                  </label>
                  {sessions.length > 0 ? (
                    <select
                      value={selectedsessionid}
                      onChange={(e) => setSelectedsessionid(e.target.value)}
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

                {currentSession && (
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700">
                    <button onClick={() => handleBulkAttendance('present')} className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all">
                      <CheckCheck className="w-4 h-4" /> Tutti Presenti
                    </button>
                    <button onClick={() => handleBulkAttendance('absent')} className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all">
                      <UserX className="w-4 h-4" /> Tutti Assenti
                    </button>
                  </div>
                )}
              </div>
            </div>

            {currentSession ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    Appello Rosa: {currentTeam?.name} <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-700 dark:text-slate-300">{currentTeamPlayers.length}</span>
                  </h3>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cerca giocatore..."
                      value={searchplayer}
                      onChange={(e) => setSearchplayer(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredPlayers.length > 0 ? (
                    filteredPlayers.map(player => {
                      const att = currentSession.attendance[player.id] || { status: 'present', note: '' };
                      return (
                        <div key={player.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                          <div className="flex items-center gap-3.5 min-w-[220px]">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-sm shadow-inner shrink-0">
                              #{player.number || '-'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white leading-tight">
                                {player.first_name} {player.last_name}
                              </h4>
                              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold ${getRole(player.role).badge}`}>
                                  {getRole(player.role).code}
                                </span>
                                {getRole(player.role).label}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <button onClick={() => handleAttendanceChange(player.id, 'present')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${att.status === 'present' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Presente
                            </button>
                            <button onClick={() => handleAttendanceChange(player.id, 'absent')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${att.status === 'absent' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                              <XCircle className="w-3.5 h-3.5" /> Assente
                            </button>
                            <button onClick={() => handleAttendanceChange(player.id, 'late')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${att.status === 'late' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                              <Clock className="w-3.5 h-3.5" /> Ritardo
                            </button>
                            <button onClick={() => handleAttendanceChange(player.id, 'injured')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${att.status === 'injured' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                              <AlertCircle className="w-3.5 h-3.5" /> Infortunio
                            </button>
                          </div>

                          <div className="w-full lg:w-64">
                            <input
                              type="text"
                              placeholder="Aggiungi nota..."
                              value={att.note || ''}
                              onChange={(e) => handleNoteChange(player.id, e.target.value)}
                              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-500">Nessun giocatore in questa rosa. Aggiungine uno dalla tab "Rosa"!</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300">
                <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nessuna sessione di allenamento</h3>
                <p className="text-sm text-slate-500 mb-4">Crea il tuo primo allenamento per iniziare.</p>
                <button onClick={() => { setEditingsession(null); setSessionform({ date: new Date().toISOString().split('T')[0], time: '18:30', notes: '' }); setShowsessionmodal(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all">
                  Crea Allenamento Ora
                </button>
              </div>
            )}
          </div>
        )}

        {activetab === 'players' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Rosa Giocatori: {currentTeam?.name}</h2>
                <p className="text-xs text-slate-500">Gestisci i membri della squadra sul database.</p>
              </div>
              <button onClick={() => { setEditingplayer(null); setPlayerform({ firstname: '', lastname: '', role: DEFAULT_ROLE, number: '' }); setShowplayermodal(true); }} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all">
                <Plus className="w-4 h-4" /> Aggiungi Giocatore
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Cerca per nome o numero..." value={searchplayer} onChange={(e) => setSearchplayer(e.target.value)} className="w-full bg-white dark:bg-slate-800 text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <select value={rolefilter} onChange={(e) => setRolefilter(e.target.value)} className="w-full bg-white dark:bg-slate-800 text-sm rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="all">Tutti i ruoli</option>
                {ROLES.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlayers.map(player => {
                const roleObj = getRole(player.role);
                return (
                  <div key={player.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-base shadow-inner shrink-0">
                        #{player.number || '-'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">{player.first_name} {player.last_name}</h4>
                        <span className={`mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleObj.badge}`}>
                          {roleObj.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEditPlayer(player)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeletePlayer(player.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activetab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Storico Allenamenti ({sessions.length})</h2>
              <p className="text-xs text-slate-500">Elenco di tutte le sessioni registrate.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map(s => (
                <div key={s.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1 rounded-full">
                        <Calendar className="w-3.5 h-3.5" /> {new Date(s.date).toLocaleDateString('it-IT')}
                      </span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setEditingsession(s);
                            setSessionform({ date: s.date, time: s.time, notes: s.notes || '' });
                            setShowsessionmodal(true);
                          }} 
                          className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteSession(s.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Orario: {s.time}</p>
                    {s.notes && <p className="text-xs text-slate-500 mt-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">{s.notes}</p>}
                  </div>
                  <button onClick={() => { setSelectedsessionid(s.id); setActivetab('register'); }} className="mt-4 w-full flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 py-2 rounded-xl text-xs font-semibold transition-all">
                    Visualizza Registro <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activetab === 'stats' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Statistiche Squadra: {currentTeam?.name}</h2>
                <p className="text-xs text-slate-500">Riepilogo dedicato alla rosa selezionata. (Tocca un nome per dettagli assenze/infortuni)</p>
              </div>
              <button
                onClick={handlePrintStats}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all print:hidden shadow-sm active:scale-95"
              >
                <Printer className="w-4 h-4" /> Stampa Tabella
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xl"><TrendingUp className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">Media Presenze ({currentTeam?.name})</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{globalStats.avgAttendance}%</h3>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xl"><Calendar className="w-6 h-6" /></div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">Allenamenti Totali</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{globalStats.totalSessions}</h3>
                </div>
              </div>
            </div>

            {/* Tabella Statistiche Ottimizzata per Mobile */}
            <div className="print-section bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm print:border-none print:shadow-none print:rounded-none">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 print:py-1.5 print:px-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm print:text-black">Riepilogo Presenze - {currentTeam?.name}</h3>
                <p className="text-[10px] text-slate-500 hidden print:block">Allenamenti totali: {globalStats.totalSessions} | Media squadra: {globalStats.avgAttendance}%</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs print:text-[10px] print:text-black">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-700 print:bg-slate-100 print:border-black">
                      <th className="p-3 sm:p-4 font-semibold">Giocatore</th>
                      <th className="p-2 sm:p-4 font-semibold text-center">Pres.</th>
                      <th className="p-2 sm:p-4 font-semibold text-center">Ass.</th>
                      <th className="p-2 sm:p-4 font-semibold text-center">Inf.</th>
                      <th className="p-2 sm:p-4 font-semibold text-center">Rit.</th>
                      <th className="p-3 sm:p-4 font-semibold text-center bg-emerald-50/50 dark:bg-emerald-950/30">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 print:divide-slate-300">
                    {playerStats.map(stat => (
                      <tr key={stat.id} className="hover:bg-slate-50/50 print:hover:bg-none">
                        <td className="p-3 sm:p-4 font-semibold text-slate-900 dark:text-white print:text-black">
                          <button 
                            onClick={() => setSelectedplayerdetail(stat)}
                            className="hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-dotted underline-offset-4 text-left transition-colors cursor-pointer block"
                            title="Clicca per vedere dettagli assenze/infortuni"
                          >
                            <span className="text-[10px] text-slate-400 mr-1">#{stat.number || '-'}</span>
                            {stat.first_name} {stat.last_name}
                          </button>
                        </td>
                        <td className="p-2 sm:p-4 text-center font-medium text-emerald-600">{stat.present}</td>
                        <td className="p-2 sm:p-4 text-center font-medium text-rose-600">{stat.absent}</td>
                        <td className="p-2 sm:p-4 text-center font-medium text-indigo-600">{stat.injured}</td>
                        <td className="p-2 sm:p-4 text-center font-medium text-amber-600">{stat.late}</td>
                        <td className="p-3 sm:p-4 text-center font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/20 text-sm">
                          {stat.rate}%
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

      {/* Modale Dettaglio Assenze / Infortuni Giocatore */}
      {selectedplayerdetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedplayerdetail.first_name} {selectedplayerdetail.last_name}
                </h3>
                <p className="text-xs text-slate-500">Storico Assenze e Infortuni</p>
              </div>
              <button 
                onClick={() => setSelectedplayerdetail(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-700 pr-1">
              {playerAbsencesDetails.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3 font-semibold">Data Allenamento</th>
                      <th className="p-3 font-semibold text-center">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {playerAbsencesDetails.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-900 dark:text-white">
                          {new Date(item.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                            item.status === 'assente' 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {item.status}
                          </span>
                          {item.note && <span className="block text-[10px] text-slate-400 mt-0.5">Nota: {item.note}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">
                  Nessuna assenza o infortunio registrato per questo giocatore. 🎉
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button 
                onClick={() => setSelectedplayerdetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Creazione Nuova Squadra */}
      {showteammodal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Crea Nuova Squadra / Rosa</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome Squadra / Categoria</label>
                <input type="text" placeholder="Es. Under 18 / Serie D..." value={teamform.name} onChange={(e) => setTeamform({ name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 text-sm rounded-xl px-4 py-2.5 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowteammodal(false)} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Annulla</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">Crea</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showsessionmodal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingsession ? 'Modifica Allenamento' : 'Nuovo Allenamento'}
            </h3>
            <form onSubmit={editingsession ? handleUpdateSession : handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data</label>
                <input type="date" value={sessionform.date} onChange={(e) => setSessionform({ ...sessionform, date: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 text-sm rounded-xl px-4 py-2.5 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Orario</label>
                <input type="text" value={sessionform.time} onChange={(e) => setSessionform({ ...sessionform, time: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 text-sm rounded-xl px-4 py-2.5 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Note (opzionale)</label>
                <input type="text" placeholder="Es. Rifinitura / Palestra..." value={sessionform.notes} onChange={(e) => setSessionform({ ...sessionform, notes: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 text-sm rounded-xl px-4 py-2.5 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setEditingsession(null); setShowsessionmodal(false); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Annulla</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                  {editingsession ? 'Salva Modifiche' : 'Crea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showplayermodal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{editingplayer ? 'Modifica Giocatore' : `Nuovo Giocatore (${currentTeam?.name})`}</h3>
            <form onSubmit={handleSavePlayer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome</label>
                <input type="text" value={playerform.firstname} onChange={(e) => setPlayerform({ ...playerform, firstname: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 text-sm rounded-xl px-4 py-2.5 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cognome</label>
                <input type="text" value={playerform.lastname} onChange={(e) => setPlayerform({ ...playerform, lastname: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 text-sm rounded-xl px-4 py-2.5 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ruolo</label>
                  <select value={playerform.role} onChange={(e) => setPlayerform({ ...playerform, role: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 text-sm rounded-xl px-4 py-2.5 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {ROLES.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Numero Maglia</label>
                  <input type="text" value={playerform.number} onChange={(e) => setPlayerform({ ...playerform, number: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-900 text-sm rounded-xl px-4 py-2.5 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowplayermodal(false)} className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Annulla</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regole CSS per forzare la stampa in una singola pagina A4 verticale */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: portrait;
            margin: 5mm;
          }
          body, html {
            width: 100%;
            height: 100%;
            font-size: 10px;
            background: white !important;
            color: black !important;
          }
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-height: 100vh;
            overflow: hidden;
            page-break-inside: avoid;
          }
          table {
            font-size: 10px !important;
          }
          th, td {
            padding: 4px 6px !important;
          }
        }
      `}} />
    </div>
  );
}
