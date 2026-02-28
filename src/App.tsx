import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, LogOut, QrCode, Scan, User, Award, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// --- Types ---
interface UserProfile {
  id: number;
  email: string;
  role: 'customer' | 'merchant';
  loyalty_code: string | null;
  points: number;
}

// --- API Helper ---
const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Components ---

const Navbar = ({ user, onLogout }: { user: UserProfile | null, onLogout: () => void }) => {
  return (
    <nav className="bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900">
          <Award className="w-6 h-6 text-emerald-600" />
          <span>iFoneLab</span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-zinc-500">{user.email}</span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Esci</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">Accedi</Link>
              <Link to="/signup" className="text-sm font-medium bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors">Registrati</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const Login = ({ onLogin }: { onLogin: (token: string, user: any) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      onLogin(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante l\'accesso');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-12 p-8 bg-white rounded-3xl shadow-sm border border-zinc-100"
    >
      <h2 className="text-2xl font-bold mb-6 text-zinc-900">Bentornato</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          Accedi
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Non hai un account? <Link to="/signup" className="text-emerald-600 font-medium hover:underline">Registrati</Link>
      </p>
    </motion.div>
  );
};

const Signup = ({ onLogin }: { onLogin: (token: string, user: any) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'merchant'>('customer');
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/signup', { email, password, role });
      setSuccessData(res.data);
      // Auto login after 3 seconds or when they click a button
      setTimeout(() => {
        onLogin(res.data.token, res.data.user);
        navigate('/');
      }, 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante la registrazione');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-12 p-8 bg-white rounded-3xl shadow-sm border border-zinc-100"
    >
      <h2 className="text-2xl font-bold mb-6 text-zinc-900">Crea Account</h2>
      {successData ? (
        <div className="text-center py-4">
          <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-zinc-900">Registrazione completata!</p>
          
          {successData.user.role === 'customer' && (
            <div className="mt-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-sm text-zinc-500 mb-2">Il tuo Codice Tessera Fedeltà:</p>
              <p className="text-xl font-mono font-bold text-emerald-600 break-all">{successData.user.loyalty_code}</p>
              <div className="mt-4 flex justify-center">
                <QRCodeSVG value={successData.user.loyalty_code} size={120} />
              </div>
            </div>
          )}
          
          <p className="text-zinc-400 text-xs mt-6">Verrai reindirizzato alla tua area personale tra pochi secondi...</p>
          <button 
            onClick={() => {
              onLogin(successData.token, successData.user);
              navigate('/');
            }}
            className="mt-4 w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
          >
            Vai alla Dashboard ora
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Tipo di Account</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${role === 'customer' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
              >
                Cliente
              </button>
              <button
                type="button"
                onClick={() => setRole('merchant')}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${role === 'merchant' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
              >
                Commerciante
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Registrati
          </button>
        </form>
      )}
      {!successData && (
        <p className="mt-6 text-center text-sm text-zinc-500">
          Hai già un account? <Link to="/login" className="text-emerald-600 font-medium hover:underline">Accedi</Link>
        </p>
      )}
    </motion.div>
  );
};

const CustomerDashboard = ({ user, refreshProfile }: { user: UserProfile, refreshProfile: () => void }) => {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">Punti Fedeltà</p>
          <h2 className="text-6xl font-bold tracking-tighter mb-4">{user.points}</h2>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <Award className="w-4 h-4" />
            <span>Livello Bronzo</span>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100 text-center"
      >
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Il Tuo Codice</h3>
        <p className="text-zinc-500 text-sm mb-6">Mostra questo codice al commerciante per ricevere punti</p>
        <div className="bg-zinc-50 p-6 rounded-3xl inline-block border border-zinc-100">
          {user.loyalty_code && (
            <QRCodeSVG
              value={user.loyalty_code}
              size={200}
              level="H"
              includeMargin={true}
              className="mx-auto"
            />
          )}
        </div>
        <p className="mt-4 font-mono text-xs text-zinc-400">{user.loyalty_code}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-zinc-100">
          <p className="text-zinc-400 text-xs font-bold uppercase mb-1">Ultima Visita</p>
          <p className="text-zinc-900 font-semibold">Oggi</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-100">
          <p className="text-zinc-400 text-xs font-bold uppercase mb-1">Prossimo Premio</p>
          <p className="text-zinc-900 font-semibold">500 pts</p>
        </div>
      </div>
    </div>
  );
};

const MerchantDashboard = () => {
  const [scanning, setScanning] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState(10);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scanning) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(async (decodedText) => {
        setScanning(false);
        if (scanner) scanner.clear();
        
        try {
          const res = await api.post('/merchant/add-points', {
            loyaltyCode: decodedText,
            points: pointsToAdd
          });
          setMessage({ text: res.data.message, type: 'success' });
        } catch (err: any) {
          setMessage({ text: err.response?.data?.error || 'Errore durante l\'assegnazione punti', type: 'error' });
        }
      }, (error) => {
        // console.warn(error);
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [scanning, pointsToAdd]);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
          <Scan className="w-6 h-6 text-emerald-600" />
          Pannello Commerciante
        </h2>

        <div className="space-y-4 mb-8">
          <label className="block text-sm font-medium text-zinc-700">Punti da assegnare</label>
          <div className="flex gap-2">
            {[10, 20, 50, 100].map(val => (
              <button
                key={val}
                onClick={() => setPointsToAdd(val)}
                className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${pointsToAdd === val ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
              >
                +{val}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={pointsToAdd}
            onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            placeholder="Altro importo..."
          />
        </div>

        {!scanning ? (
          <button
            onClick={() => {
              setMessage(null);
              setScanning(true);
            }}
            className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex flex-col items-center gap-2"
          >
            <QrCode className="w-8 h-8" />
            Scansiona Codice
          </button>
        ) : (
          <div className="space-y-4">
            <div id="reader" className="overflow-hidden rounded-2xl border-2 border-emerald-500"></div>
            <button
              onClick={() => setScanning(false)}
              className="w-full bg-zinc-100 text-zinc-600 py-3 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
            >
              Annulla
            </button>
          </div>
        )}

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-6 p-4 rounded-2xl text-sm font-medium text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Statistiche Oggi</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-zinc-900">12</p>
            <p className="text-xs text-zinc-500">Clienti serviti</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-900">850</p>
            <p className="text-xs text-zinc-500">Punti totali</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/user/profile');
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    fetchProfile();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="px-4 py-8">
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  user.role === 'customer' ? (
                    <CustomerDashboard user={user} refreshProfile={fetchProfile} />
                  ) : (
                    <MerchantDashboard />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/signup" element={!user ? <Signup onLogin={handleLogin} /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
