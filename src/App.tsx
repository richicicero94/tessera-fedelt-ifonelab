import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, LogOut, QrCode, Scan, User, Award, ShieldCheck, Plus, Minus, Phone, MessageSquare, Megaphone, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// --- Types ---
interface UserProfile {
  id: string | number;
  email: string;
  role: 'customer' | 'merchant';
  loyalty_code: string | null;
  points: number;
  phone?: string;
}

// --- Components ---

const Navbar = ({ user, onLogout }: { user: UserProfile | null, onLogout: () => void }) => {
  return (
    <nav className="bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 font-bold text-xl tracking-tight text-zinc-900">
          <img 
            src="https://scontent-mxp2-1.xx.fbcdn.net/v/t39.30808-6/474502142_2055199634940862_3015110099841791121_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=Qf50nOuFni0Q7kNvwFvouTi&_nc_oc=AdloNG6fRgPTUL45SzWJIgOFgZHY6ffU3NlUZranveeoibBDdHJs2hOxicQcpjCROZQ&_nc_zt=23&_nc_ht=scontent-mxp2-1.xx&_nc_gid=ZIJLQHUjBHXbsbpDPgJlvw&_nc_ss=8&oh=00_AfwzrLQ8TSRP_50EZ9G7lzrl86ba3McY9Gcnfo4Lt8iCFw&oe=69ACE8E4" 
            alt="iFoneLab Logo" 
            className="w-10 h-10 rounded-xl object-cover shadow-sm"
            referrerPolicy="no-referrer"
          />
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

const Login = ({ onLogin }: { onLogin: () => void }) => {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.session) {
        onLogin();
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'accesso');
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      if (error) throw error;
      setMessage('Controlla la tua email per il link di reset!');
    } catch (err: any) {
      setError(err.message || 'Errore durante la richiesta');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage('Password aggiornata! Ora puoi accedere.');
      setForgotPassword(false);
      setResetStep('request');
    } catch (err: any) {
      setError(err.message || 'Errore durante il reset');
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
      <div className="flex flex-col items-center mb-6">
        <img 
          src="https://scontent-mxp2-1.xx.fbcdn.net/v/t39.30808-6/474502142_2055199634940862_3015110099841791121_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=Qf50nOuFni0Q7kNvwFvouTi&_nc_oc=AdloNG6fRgPTUL45SzWJIgOFgZHY6ffU3NlUZranveeoibBDdHJs2hOxicQcpjCROZQ&_nc_zt=23&_nc_ht=scontent-mxp2-1.xx&_nc_gid=ZIJLQHUjBHXbsbpDPgJlvw&_nc_ss=8&oh=00_AfwzrLQ8TSRP_50EZ9G7lzrl86ba3McY9Gcnfo4Lt8iCFw&oe=69ACE8E4" 
          alt="iFoneLab Logo" 
          className="w-20 h-20 rounded-2xl object-cover shadow-lg mb-4"
          referrerPolicy="no-referrer"
        />
        <h2 className="text-2xl font-bold text-zinc-900">Bentornato</h2>
      </div>
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

const Signup = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'merchant'>('customer');
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const loyaltyCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            { 
              id: authData.user.id, 
              email: email, 
              role: role, 
              points: 0, 
              loyalty_code: loyaltyCode 
            }
          ]);

        if (profileError) throw profileError;

        setSuccessData({
          email: email,
          loyalty_code: loyaltyCode
        });

        // Auto login after a few seconds
        setTimeout(() => {
          onLogin();
          navigate('/');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-12 p-8 bg-white rounded-3xl shadow-sm border border-zinc-100"
    >
      <div className="flex flex-col items-center mb-6">
        <img 
          src="https://scontent-mxp2-1.xx.fbcdn.net/v/t39.30808-6/474502142_2055199634940862_3015110099841791121_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=Qf50nOuFni0Q7kNvwFvouTi&_nc_oc=AdloNG6fRgPTUL45SzWJIgOFgZHY6ffU3NlUZranveeoibBDdHJs2hOxicQcpjCROZQ&_nc_zt=23&_nc_ht=scontent-mxp2-1.xx&_nc_gid=ZIJLQHUjBHXbsbpDPgJlvw&_nc_ss=8&oh=00_AfwzrLQ8TSRP_50EZ9G7lzrl86ba3McY9Gcnfo4Lt8iCFw&oe=69ACE8E4" 
          alt="iFoneLab Logo" 
          className="w-20 h-20 rounded-2xl object-cover shadow-lg mb-4"
          referrerPolicy="no-referrer"
        />
        <h2 className="text-2xl font-bold text-zinc-900">Crea Account</h2>
      </div>
      {successData ? (
        <div className="text-center py-4">
          <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-zinc-900">Registrazione completata!</p>
          
          {successData.loyalty_code && (
            <div className="mt-6 p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-sm text-zinc-500 mb-2">Il tuo Codice Tessera Fedeltà:</p>
              <p className="text-xl font-mono font-bold text-emerald-600 break-all">{successData.loyalty_code}</p>
              <div className="mt-4 flex justify-center">
                <QRCodeSVG value={successData.loyalty_code} size={120} />
              </div>
            </div>
          )}
          
          <p className="text-zinc-400 text-xs mt-6">Verrai reindirizzato alla tua area personale tra pochi secondi...</p>
          <button 
            onClick={() => {
              onLogin();
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
  const [phone, setPhone] = useState(user.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('users')
        .update({ phone })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ text: 'Ora sei abilitato a ricevere le nostre promozioni', type: 'success' });
      refreshProfile();
    } catch (err) {
      setMessage({ text: 'Errore durante il salvataggio.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900">Promozioni WhatsApp</h3>
            <p className="text-zinc-500 text-xs">Ricevi sconti esclusivi sul tuo telefono</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePhone} className="space-y-3">
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Inserisci il tuo numero..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdating}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50"
          >
            {isUpdating ? 'Salvataggio...' : 'Attiva Promozioni'}
          </button>
        </form>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-3 p-3 rounded-xl text-xs font-medium text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
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
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [promotionText, setPromotionText] = useState(localStorage.getItem('promo_template') || '');

  const saveTemplate = (text: string) => {
    setPromotionText(text);
    localStorage.setItem('promo_template', text);
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'customer')
        .order('points', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSendBroadcast = () => {
    const customersWithPhone = customers.filter(c => c.phone && c.phone.trim() !== '');
    if (customersWithPhone.length === 0) {
      alert('Nessun cliente ha registrato un numero di telefono per le promozioni.');
      return;
    }

    if (!promotionText.trim()) {
      alert('Inserisci un messaggio per la promozione.');
      return;
    }

    const confirmSend = confirm(`Stai per inviare questa promozione a ${customersWithPhone.length} clienti. Vuoi procedere?\n\nNota: Assicurati di aver abilitato i pop-up nel browser.`);
    
    if (confirmSend) {
      customersWithPhone.forEach((customer, index) => {
        setTimeout(() => {
          let cleanPhone = customer.phone.replace(/\D/g, '');
          if (cleanPhone.length === 10 && (cleanPhone.startsWith('3'))) {
            cleanPhone = '39' + cleanPhone;
          } else if (cleanPhone.startsWith('00')) {
            cleanPhone = cleanPhone.substring(2);
          }
          const encodedMsg = encodeURIComponent(promotionText);
          const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
          window.open(waUrl, '_blank');
        }, index * 1200);
      });
      setIsPromotionModalOpen(false);
      setMessage({ text: `Apertura chat in corso... Ricorda di abilitare i pop-up!`, type: 'success' });
    }
  };

  const handleSendToBroadcastList = () => {
    if (!promotionText.trim()) {
      alert('Inserisci un messaggio per la promozione.');
      return;
    }

    // Copy to clipboard as a backup/helper
    navigator.clipboard.writeText(promotionText).then(() => {
      const encodedMsg = encodeURIComponent(promotionText);
      const waUrl = `https://wa.me/?text=${encodedMsg}`;
      window.open(waUrl, '_blank');
      setIsPromotionModalOpen(false);
      setMessage({ text: 'Messaggio copiato! Seleziona "Ifonelab" e invia.', type: 'success' });
    }).catch(err => {
      // Fallback if clipboard fails
      const encodedMsg = encodeURIComponent(promotionText);
      const waUrl = `https://wa.me/?text=${encodedMsg}`;
      window.open(waUrl, '_blank');
      setIsPromotionModalOpen(false);
    });
  };

  const handleExportVCF = () => {
    const customersWithPhone = customers.filter(c => c.phone && c.phone.trim() !== '');
    if (customersWithPhone.length === 0) {
      alert('Nessun cliente ha registrato un numero di telefono.');
      return;
    }

    let vcfContent = '';
    customersWithPhone.forEach(c => {
      let cleanPhone = c.phone.replace(/\D/g, '');
      if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
        cleanPhone = '+39' + cleanPhone;
      } else if (!cleanPhone.startsWith('+')) {
        cleanPhone = '+' + cleanPhone;
      }

      vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:iFoneLab - ${c.email.split('@')[0]}\nTEL;TYPE=CELL:${cleanPhone}\nEND:VCARD\n`;
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'clienti_ifonelab.vcf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('File contatti scaricato!\n\n1. Apri il file sul tuo telefono\n2. Importa i contatti\n3. Su WhatsApp crea una "Lista Broadcast" selezionando i contatti che iniziano con "iFoneLab"');
  };

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
          
          // 1. Find customer by loyalty code
          const { data: customer, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('loyalty_code', decodedText)
            .single();

          if (findError || !customer) throw new Error('Cliente non trovato');

          // 2. Update points
          const newPoints = Math.max(0, (customer.points || 0) + pointsToSubmit);
          const { error: updateError } = await supabase
            .from('users')
            .update({ points: newPoints })
            .eq('id', customer.id);

          if (updateError) throw updateError;

          setMessage({ text: `Punti aggiornati con successo! Nuovo saldo: ${newPoints}`, type: 'success' });
          fetchCustomers(); // Refresh list
        } catch (err: any) {
          setMessage({ text: err.message || 'Errore durante l\'operazione', type: 'error' });
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

          <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <label className="text-sm font-bold text-zinc-900">Messaggio Predefinito</label>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(promotionText);
                  alert('Testo copiato negli appunti!');
                }}
                className="text-[10px] bg-white border border-zinc-200 px-3 py-1.5 rounded-xl hover:bg-zinc-100 transition-all font-bold text-zinc-600 shadow-sm"
              >
                Copia Testo
              </button>
            </div>
            <textarea
              value={promotionText}
              onChange={(e) => saveTemplate(e.target.value)}
              placeholder="Scrivi qui il testo della tua promozione..."
              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm h-24 resize-none bg-white"
            />
            <p className="mt-2 text-[10px] text-zinc-400 italic">
              Questo testo verrà usato come base per le tue promozioni WhatsApp.
            </p>
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
          <div className="space-y-4">
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

            <button
              onClick={() => setIsPromotionModalOpen(true)}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              <Megaphone className="w-5 h-5" />
              Crea una Promozione
            </button>
          </div>
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

      <AnimatePresence>
        {isPromotionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setIsPromotionModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-zinc-400" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                  <Megaphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Nuova Promozione</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Messaggio WhatsApp</label>
                  <textarea
                    value={promotionText}
                    onChange={(e) => setPromotionText(e.target.value)}
                    placeholder="Esempio: Solo per oggi 20% di sconto su tutti i prodotti! Mostra la tua tessera fedeltà in negozio."
                    className="w-full px-4 py-4 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm h-40 resize-none"
                  />
                  <p className="mt-2 text-[10px] text-zinc-400">
                    Il messaggio verrà inviato dal tuo numero WhatsApp tramite WhatsApp Web.
                  </p>
                </div>

                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                  <div className="flex justify-between items-center text-xs mb-3">
                    <span className="text-zinc-500">Destinatari registrati:</span>
                    <span className="font-bold text-zinc-900">
                      {customers.filter(c => c.phone && c.phone.trim() !== '').length}
                    </span>
                  </div>
                  <button
                    onClick={handleExportVCF}
                    className="w-full bg-white border border-zinc-200 text-zinc-700 py-2 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-3 h-3" />
                    Scarica Contatti Ifonelab
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleSendToBroadcastList}
                    className="w-full bg-emerald-600 text-white py-7 rounded-[2.5rem] font-bold text-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex flex-col items-center justify-center gap-2 border-4 border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="w-8 h-8" />
                      <span>Invia a "Ifonelab"</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-medium bg-black/10 px-4 py-1 rounded-full">
                      <span>1. Clicca</span>
                      <span className="opacity-40">→</span>
                      <span>2. Seleziona Community</span>
                      <span className="opacity-40">→</span>
                      <span>3. Invia</span>
                    </div>
                  </button>

                  <div className="p-5 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      <strong>Consiglio Privacy:</strong> Usa una <strong>Community WhatsApp</strong>. Nel gruppo "Annunci", i clienti <strong>non vedranno i numeri degli altri</strong>. Clicca il tasto sopra e seleziona la tua Community per un invio sicuro e veloce.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSendBroadcast}
                  className="w-full bg-zinc-100 text-zinc-600 py-3 rounded-xl font-bold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Apri Chat Individuali (Alternativa)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <div className="flex items-center gap-2">
                  {customer.phone && (
                    <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg" title={customer.phone}>
                      <MessageSquare className="w-3 h-3" />
                    </div>
                  )}
                  <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <Award className="w-3 h-3" />
                    {customer.points} pts
                  </div>
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
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error('Not authenticated');
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .single();

      if (profileError) throw profileError;

      if (profile) {
        setUser(profile);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    fetchProfile();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            src="https://scontent-mxp2-1.xx.fbcdn.net/v/t39.30808-6/474502142_2055199634940862_3015110099841791121_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=Qf50nOuFni0Q7kNvwFvouTi&_nc_oc=AdloNG6fRgPTUL45SzWJIgOFgZHY6ffU3NlUZranveeoibBDdHJs2hOxicQcpjCROZQ&_nc_zt=23&_nc_ht=scontent-mxp2-1.xx&_nc_gid=ZIJLQHUjBHXbsbpDPgJlvw&_nc_ss=8&oh=00_AfwzrLQ8TSRP_50EZ9G7lzrl86ba3McY9Gcnfo4Lt8iCFw&oe=69ACE8E4" 
            alt="iFoneLab Logo" 
            className="w-24 h-24 rounded-3xl object-cover shadow-xl"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 font-bold tracking-tight animate-pulse">iFoneLab</p>
          </div>
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
