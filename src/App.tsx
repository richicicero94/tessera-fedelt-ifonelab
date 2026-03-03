import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, LogOut, QrCode, Scan, User, Award, ShieldCheck, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// --- Types ---
interface UserProfile {
  id: string | number;
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
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'reset'>('request');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
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

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.debugToken) {
        alert('DEBUG: Il tuo codice di reset è ' + res.data.debugToken);
      }
      setResetStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante la richiesta');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/reset-password', { email, token: resetToken, newPassword });
      setMessage('Password aggiornata! Ora puoi accedere.');
      setForgotPassword(false);
      setResetStep('request');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante il reset');
    }
  };

  if (forgotPassword) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto mt-12 p-8 bg-white rounded-3xl shadow-sm border border-zinc-100"
      >
        <h2 className="text-2xl font-bold mb-6 text-zinc-900">Recupero Password</h2>
        
        {resetStep === 'request' ? (
          <form onSubmit={handleResetRequest} className="space-y-4">
            <p className="text-sm text-zinc-500 mb-4">Inserisci la tua email per ricevere un codice di recupero.</p>
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
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
            >
              Invia Codice
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-zinc-500 mb-4">Inserisci il codice ricevuto e la nuova password.</p>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Codice di Reset</label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nuova Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
            >
              Aggiorna Password
            </button>
          </form>
        )}
        
        <button
          onClick={() => setForgotPassword(false)}
          className="mt-6 w-full text-center text-sm text-zinc-500 hover:text-zinc-700"
        >
          Torna al login
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-12 p-8 bg-white rounded-3xl shadow-sm border border-zinc-100"
    >
      <h2 className="text-2xl font-bold mb-6 text-zinc-900">Bentornato</h2>
      {message && <p className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm">{message}</p>}
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
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-zinc-700">Password</label>
            <button 
              type="button"
              onClick={() => {
                setError('');
                setMessage('');
                setForgotPassword(true);
              }}
              className="text-xs text-emerald-600 hover:underline"
            >
              Dimenticata?
            </button>
          </div>
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
  const points = user.points || 0;
  const loyaltyCode = user.loyalty_code || '';

  return (
    <div className="max-w-md mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">Punti Fedeltà</p>
          <h2 className="text-6xl font-bold tracking-tighter mb-4">{points}</h2>
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
          {loyaltyCode ? (
            <QRCodeSVG
              value={loyaltyCode}
              size={200}
              level="H"
              includeMargin={true}
              className="mx-auto"
            />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center text-zinc-400 italic">
              Codice non disponibile
            </div>
          )}
        </div>
        <p className="mt-4 font-mono text-xs text-zinc-400">{loyaltyCode}</p>
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
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/merchant/customers');
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scanning) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          videoConstraints: {
            facingMode: "environment"
          }
        },
        /* verbose= */ false
      );

      scanner.render(async (decodedText) => {
        setScanning(false);
        if (scanner) scanner.clear();
        
        try {
          const pointsToSubmit = mode === 'add' ? pointsToAdd : -pointsToAdd;
          const res = await api.post('/merchant/add-points', {
            loyaltyCode: decodedText,
            points: pointsToSubmit
          });
          setMessage({ text: res.data.message, type: 'success' });
          fetchCustomers(); // Refresh list
        } catch (err: any) {
          setMessage({ text: err.response?.data?.error || 'Errore durante l\'operazione', type: 'error' });
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
  }, [scanning, pointsToAdd, mode]);

  const filteredCustomers = customers.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.loyalty_code && c.loyalty_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
          <Scan className="w-6 h-6 text-emerald-600" />
          Pannello Commerciante
        </h2>

        <div className="space-y-6 mb-8">
          <div className="flex p-1 bg-zinc-100 rounded-2xl">
            <button
              onClick={() => setMode('add')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'add' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <Plus className="w-4 h-4" />
              Aggiungi
            </button>
            <button
              onClick={() => setMode('subtract')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'subtract' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <Minus className="w-4 h-4" />
              Sottrai
            </button>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700">
              {mode === 'add' ? 'Punti da aggiungere' : 'Punti da togliere'}
            </label>
            <div className="flex gap-2">
              {[10, 20, 50, 100].map(val => (
                <button
                  key={val}
                  onClick={() => setPointsToAdd(val)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${pointsToAdd === val ? (mode === 'add' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-red-600 border-red-600 text-white') : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
                >
                  {val}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={pointsToAdd}
              onChange={(e) => setPointsToAdd(Math.abs(parseInt(e.target.value) || 0))}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="Altro importo..."
            />
          </div>
        </div>

        {!scanning ? (
          <button
            onClick={() => {
              setMessage(null);
              setScanning(true);
            }}
            className={`w-full text-white py-6 rounded-3xl font-bold text-lg transition-all shadow-lg flex flex-col items-center gap-2 ${mode === 'add' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'}`}
          >
            <QrCode className="w-8 h-8" />
            {mode === 'add' ? 'Aggiungi Punti' : 'Sottrai Punti'}
          </button>
        ) : (
          <div className="space-y-4">
            <div id="reader" className={`overflow-hidden rounded-2xl border-2 ${mode === 'add' ? 'border-emerald-500' : 'border-red-500'}`}></div>
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

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-zinc-900">Lista Clienti</h3>
          <span className="text-xs font-bold bg-zinc-100 text-zinc-500 px-2 py-1 rounded-full">{customers.length}</span>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Cerca per email o codice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 text-sm rounded-xl border border-zinc-100 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="p-4 rounded-2xl border border-zinc-50 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-semibold text-zinc-900 truncate max-w-[180px]">{customer.email}</p>
                <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <Award className="w-3 h-3" />
                  {customer.points} pts
                </div>
              </div>
              <p className="text-[10px] font-mono text-zinc-400">{customer.loyalty_code?.substring(0, 18)}...</p>
            </div>
          ))}
          {filteredCustomers.length === 0 && (
            <p className="text-center text-zinc-400 text-sm py-8">Nessun cliente trovato</p>
          )}
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
      if (res.data && res.data.email) {
        setUser(res.data);
      } else {
        throw new Error('Invalid profile data');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      localStorage.removeItem('token');
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
    console.log('Login successful, fetching profile...');
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-medium animate-pulse">Caricamento iFoneLab...</p>
        </div>
      </div>
    );
  }

  // Error boundary fallback (simplified)
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 text-center max-w-sm">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Ops! Qualcosa è andato storto</h2>
          <p className="text-zinc-500 text-sm mb-6">Si è verificato un errore durante il caricamento del profilo.</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold"
          >
            Ricarica Pagina
          </button>
        </div>
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
