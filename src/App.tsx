import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar, Button, cn } from './components/Navigation';
import { useAppStore } from './store/useAppStore';
import { useGeolocationTracker } from './hooks/useGeolocationTracker';
import { Shield, MapPin, Activity, CheckCircle2, TrendingUp, AlertTriangle, Clock, PlusSquare, User, Globe } from 'lucide-react';
import { LGPPSEngine } from './lib/engine';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeminiTriageService, TriageResult } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { initAuth } from './lib/firebase';

// --- Screens ---

const LandingHero = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="max-w-2xl"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-nexus-primary/10 text-nexus-primary text-xs font-semibold uppercase tracking-wider">
        <Shield size={14} /> Protocolo L-GPPS Ativo
      </div>
      <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-[1.1]">
        Sua Navegação é a <span className="text-nexus-primary italic">Evidência</span>.
      </h1>
      <p className="text-nexus-text/70 text-lg mb-10 max-w-lg mx-auto">
        Transformamos trajetórias humanas em provas cívicas auditáveis. Sem vigilância, com coerência matemática.
      </p>
      <div className="flex gap-4 justify-center">
        <Button className="h-12 px-8">Explorar Território</Button>
        <Button variant="secondary" className="h-12 px-8">Saiba Mais</Button>
      </div>
    </motion.div>
  </div>
);

const LiveMap = () => {
  const events = useAppStore((state) => state.events);
  
  return (
    <div className="h-full w-full rounded-md overflow-hidden shadow-2xl border border-nexus-border relative">
      <MapContainer center={[-23.5505, -46.6333]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {events.map((event) => (
          <Circle
            key={event.id}
            center={[event.lat, event.lng]}
            radius={300}
            pathOptions={{ 
              fillColor: event.status === 'resolved' ? '#005f73' : '#ae2012',
              color: 'transparent',
              fillOpacity: 0.4
            }}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold">{event.type.toUpperCase()}</p>
                <p className="text-xs opacity-70">{event.description}</p>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-nexus-primary font-bold">
                  <Activity size={10} /> ICF: {(event.icf_score * 100).toFixed(0)}%
                </div>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        <div className="nexus-glass p-3 rounded-xl flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-nexus-primary animate-pulse" />
          <span className="text-xs font-bold uppercase">Monitoramento Vivo</span>
        </div>
      </div>
    </div>
  );
};

const RegisterEvent = () => {
  const [description, setDescription] = useState('');
  const [type, setType] = useState('infrastructure');
  const [loading, setLoading] = useState(false);
  const [triage, setTriage] = useState<TriageResult | null>(null);
  
  const trajectory = useAppStore((state) => state.trajectory);
  const addEvent = useAppStore((state) => state.addEvent);
  const updateReputation = useAppStore((state) => state.updateReputation);

  const handleSubmit = async () => {
    if (!description || trajectory.length < 2) return;
    setLoading(true);
    
    // 1. Calculate ICF
    const icf = LGPPSEngine.calculateICF(trajectory, trajectory.length - 1);
    
    // 2. IA Triage L3
    const result = await GeminiTriageService.analyzeEvent(description, type);
    setTriage(result);

    // 3. Register Event
    const prevHash = trajectory.length > 1 ? LGPPSEngine.generateHashChain('GENESIS', trajectory[trajectory.length-2], Date.now(), 0.5) : 'GENESIS';
    const currentHash = LGPPSEngine.generateHashChain(prevHash, trajectory[trajectory.length-1], Date.now(), icf);

    const newEvent = {
        id: currentHash.substring(0, 12),
        type: type as any,
        description,
        lat: trajectory[trajectory.length - 1].lat,
        lng: trajectory[trajectory.length - 1].lng,
        icf_score: icf,
        timestamp: Date.now(),
        status: 'pending' as const,
        hash_chain: currentHash,
        userId: 'temp' // Will be set by store.addEvent
    };
    
    await addEvent(newEvent);
    setLoading(false);
    setDescription('');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-6 px-4 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-nexus-primary/10 text-nexus-primary">
          <PlusSquare size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Novo Registro Cívico</h2>
          <p className="text-nexus-text/60 text-sm">Protocolo de nexo causal em tempo real</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
           <label className="text-xs font-bold uppercase mb-2 block opacity-60">Tipo de Evento</label>
           <div className="grid grid-cols-2 gap-2">
             {['Infrastrutura', 'Segurança', 'Saneamento', 'Iluminação'].map((t) => (
               <button
                 key={t}
                 onClick={() => setType(t.toLowerCase())}
                 className={cn(
                   "p-3 rounded-xl border text-sm font-medium transition-all",
                   type === t.toLowerCase() ? "bg-nexus-primary text-white border-nexus-primary" : "bg-white border-black/5 hover:border-nexus-primary/40"
                 )}
               >
                 {t}
               </button>
             ))}
           </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase mb-2 block opacity-60">Evidência Narrativa</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-32 p-4 rounded-xl border border-black/5 focus:border-nexus-primary focus:ring-1 focus:ring-nexus-primary outline-none transition-all resize-none bg-white"
            placeholder="Descreva o que seu fluxo humano detectou..."
          />
        </div>

        <div className="nexus-card-sleek bg-nexus-primary/5 border-nexus-primary/20 flex flex-col items-center justify-center p-6 text-center">
            <Activity className="text-nexus-primary mb-2" size={32} />
            <div className="text-2xl font-bold text-nexus-primary">
               {(trajectory.length > 5 ? 0.88 : 0.42 * (trajectory.length / 5)).toFixed(2)}
            </div>
            <div className="nexus-mono-label mt-2">ICF Estimado (Edge)</div>
            <p className="text-[10px] mt-2 max-w-[200px] opacity-60">Quanto mais você navega organicamente, maior a credibilidade do seu registro.</p>
        </div>

        <Button 
          disabled={loading || description.length < 5 || trajectory.length < 2}
          onClick={handleSubmit} 
          className="w-full h-14"
        >
          {loading ? 'Processando L3 Intelligence...' : 'Selar Registro no Ledger'}
        </Button>

        {triage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="nexus-card-sleek border-emerald-500/20 bg-emerald-500/5"
          >
            <div className="flex items-center gap-2 mb-3 text-emerald-700">
              <CheckCircle2 size={18} />
              <span className="font-bold text-xs uppercase tracking-wider">Triagem IA Concluída</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="opacity-60 italic">Órgão Destino</span>
                <span className="font-bold">{triage.organ}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-60 italic">Prioridade Território</span>
                <span className={cn("font-bold uppercase", triage.priority === 'critical' ? 'text-nexus-danger' : 'text-nexus-primary')}>
                  {triage.priority}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed opacity-80 border-t border-black/5 pt-2 italic">
                {triage.legal_context}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
    const data = [
        { name: 'Pinheiros', latencia: 24, eficiencia: 88 },
        { name: 'Centro', latencia: 48, eficiencia: 62 },
        { name: 'Moema', latencia: 12, eficiencia: 94 },
        { name: 'Itaquera', latencia: 72, eficiencia: 45 },
        { name: 'Lapa', latencia: 36, eficiencia: 70 },
    ];

    return (
        <div className="space-y-8 pt-6 px-4 pb-24">
            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold">Dashboard Cidade</h2>
                    <p className="text-nexus-text/60 text-sm">Métricas de eficiência e latência institucional</p>
                </div>
                <TrendingUp className="text-nexus-success" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="nexus-card-sleek flex flex-col gap-1">
                    <span className="nexus-mono-label">Latência Média</span>
                    <div className="text-2xl font-bold flex items-baseline gap-1">
                        38.4h <span className="text-xs font-normal text-red-600">-12% ▼</span>
                    </div>
                </div>
                <div className="nexus-card-sleek flex flex-col gap-1">
                    <span className="nexus-mono-label">ICF Médio Local</span>
                    <div className="text-2xl font-bold flex items-baseline gap-1">
                        0.82 <span className="text-xs font-normal text-emerald-600">+5% ▲</span>
                    </div>
                </div>
                <div className="nexus-card-sleek flex flex-col gap-1">
                    <span className="nexus-mono-label">Registros Selados</span>
                    <div className="text-2xl font-bold">1,204</div>
                </div>
            </div>

            <div className="nexus-card-sleek h-80 pt-10">
                <span className="nexus-mono-label mb-6 block text-center">Eficiência Institucional por Bairro (%)</span>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="eficiencia" radius={[10, 10, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.eficiencia > 70 ? '#005f73' : '#ae2012'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-4">
                <span className="text-xs font-bold uppercase block opacity-70">Alertas de Recorrência Crítica</span>
                {[
                    { loc: 'Rua Augusta', type: 'Saneamento', time: '2h ago', level: 'high' },
                    { loc: 'Praça da República', type: 'Segurança', time: '14m ago', level: 'critical' },
                ].map((alert, i) => (
                    <div key={i} className="nexus-glass rounded-xl p-4 flex items-center justify-between border-l-4 border-l-nexus-danger">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-nexus-danger" size={20} />
                            <div>
                                <p className="font-bold text-sm">{alert.type} em {alert.loc}</p>
                                <p className="text-[10px] opacity-60 flex items-center gap-1"><Clock size={10} /> {alert.time}</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="text-xs">Ver Contexto</Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Profile = () => {
    const reputation = useAppStore((state) => state.reputation);
    
    return (
        <div className="space-y-8 pt-6 px-4 pb-24 text-center">
            <div className="relative inline-block mx-auto">
                <div className="w-24 h-24 rounded-full bg-nexus-primary/20 border-2 border-nexus-primary flex items-center justify-center overflow-hidden">
                    <User size={48} className="text-nexus-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-nexus-primary text-white p-1.5 rounded-full border-4 border-[var(--surface)]">
                    <Shield size={16} />
                </div>
            </div>

            <div>
                <h2 className="text-3xl font-bold">{reputation.title}</h2>
                <p className="text-nexus-text/60 italic">Nível {reputation.level} · {reputation.score} Pontos Cívicos</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="nexus-card-sleek">
                    <div className="text-2xl font-bold">12</div>
                    <div className="nexus-mono-label">Validações</div>
                </div>
                <div className="nexus-card-sleek">
                    <div className="text-2xl font-bold">3</div>
                    <div className="nexus-mono-label">Alertas Ativos</div>
                </div>
            </div>

            <div className="text-left space-y-4">
                <h3 className="text-sm font-bold uppercase opacity-50">Certificações L-GPPS</h3>
                <div className="nexus-glass rounded-2xl p-4 flex gap-4 items-center">
                    <CheckCircle2 className="text-nexus-success" />
                    <div>
                        <p className="font-bold text-sm">Nexo Causal Verificado</p>
                        <p className="text-xs opacity-60">Sua trajetória média mantém ICF {'>'} 0.82</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const { startTracking } = useGeolocationTracker();
  const syncEvents = useAppStore((state) => state.syncEvents);
  const syncUser = useAppStore((state) => state.syncUser);

  useEffect(() => {
    const init = async () => {
      await initAuth();
      const unsubEvents = syncEvents();
      const unsubUser = syncUser();
      return () => {
        unsubEvents();
        unsubUser();
      };
    };
    init();
  }, [syncEvents, syncUser]);

  useEffect(() => {
    const cleanup = startTracking();
    return cleanup;
  }, [startTracking]);

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text)] font-sans max-w-4xl mx-auto shadow-sm">
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center nexus-glass bg-white/20 md:hidden">
        <div className="flex items-center gap-2">
            <div className="bg-nexus-primary p-2 rounded-lg text-white">
                <Shield size={18} />
            </div>
            <span className="font-bold tracking-tight">Isonomia</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
            <div className="w-2 h-2 rounded-full bg-nexus-primary animate-pulse" />
            LIVE-LEDGER
        </div>
      </header>

      <main className="pt-20 pb-24 md:pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'home' && <LandingHero />}
            {activeTab === 'map' && <LiveMap />}
            {activeTab === 'register' && <RegisterEvent />}
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'profile' && <Profile />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
