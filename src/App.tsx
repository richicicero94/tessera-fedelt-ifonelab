import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, LogOut, QrCode, Scan, User, Award, ShieldCheck, Plus, Minus, Phone, MessageSquare, Megaphone, Send, X, RefreshCw, Edit2, HelpCircle, ChevronDown, Star, Trophy, MoreVertical, Trash2, Bell, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './supabaseClient';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Html5QrcodeScanner } from 'html5-qrcode';

// --- Types ---
interface UserProfile {
  id: string;
  email: string;
  role: 'customer' | 'merchant';
  loyalty_code: string | null;
  points: number;
  phone?: string;
  first_name?: string;
  last_name?: string;
  deletion_requested?: boolean;
}

// --- Components ---

const EditCustomerModal = ({ customer, onClose, onUpdate }: { customer: any, onClose: () => void, onUpdate: () => void }) => {
  const [email, setEmail] = useState(customer.email || '');
  const [firstName, setFirstName] = useState(customer.first_name || '');
  const [lastName, setLastName] = useState(customer.last_name || '');
  const [loyaltyCode, setLoyaltyCode] = useState(customer.loyalty_code || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          email,
          first_name: firstName,
          last_name: lastName,
          loyalty_code: loyaltyCode,
          phone
        })
        .eq('id', customer.id);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'aggiornamento');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-zinc-400" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Edit2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Modifica Cliente</h3>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">Nome</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">Cognome</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
            <p className="text-[10px] text-amber-600 mt-1 ml-1 font-medium">Nota: Il cliente dovrà usare questa email per il login.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">Codice Tessera</label>
            <input
              type="text"
              value={loyaltyCode}
              onChange={(e) => setLoyaltyCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">Telefono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 mt-4"
          >
            {isUpdating ? 'Aggiornamento...' : 'Salva Modifiche'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const ResetPasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('I PIN non coincidono');
      return;
    }
    if (password.length < 6) {
      setError('Il PIN deve essere di almeno 6 caratteri');
      return;
    }

    setError('');
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('PIN aggiornato con successo! Ora puoi usare il nuovo PIN.');
      setTimeout(() => {
        onClose();
        window.location.hash = '';
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'aggiornamento');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Nuovo PIN</h3>
        </div>

        {message ? (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 text-center font-medium">
            {message}
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-zinc-500 mb-4">
              Inserisci il tuo nuovo PIN per completare il recupero dell'account.
            </p>
            
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">Nuovo PIN</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-1 ml-1">Conferma PIN</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs font-medium ml-1">{error}</p>}

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              {isUpdating ? 'Aggiornamento...' : 'Salva Nuovo PIN'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const PullToRefresh = ({ onRefresh, children }: { onRefresh: () => Promise<void>, children: React.ReactNode }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].pageY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || window.scrollY > 0) return;
    
    const currentY = e.touches[0].pageY;
    const distance = currentY - startY;
    
    if (distance > 0) {
      const pull = Math.min(distance * 0.4, threshold + 40);
      setPullDistance(pull);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-screen overflow-x-hidden"
    >
      <motion.div 
        style={{ height: pullDistance, opacity: pullDistance / threshold }}
        className="fixed top-0 left-0 right-0 z-[100] overflow-hidden flex items-center justify-center pointer-events-none"
        animate={{ height: pullDistance }}
        transition={isRefreshing ? { type: 'spring', stiffness: 300, damping: 30 } : { type: 'tween', duration: 0 }}
      >
        <div className={`p-2 bg-white rounded-full shadow-lg border border-zinc-100 transition-all duration-300 ${pullDistance > threshold ? 'scale-110 text-emerald-600' : 'scale-100 text-zinc-400'}`}>
          <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
        </div>
      </motion.div>
      <motion.div
        animate={{ y: pullDistance }}
        transition={isRefreshing ? { type: 'spring', stiffness: 300, damping: 30 } : { type: 'tween', duration: 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

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
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let emailToUse = identifier;
      
      // Check if it's a loyalty code (doesn't contain @)
      if (!identifier.includes('@')) {
        const formattedCode = identifier.startsWith('#') ? identifier : `#${identifier}`;
        
        // Find the user by loyalty code
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('loyalty_code', formattedCode)
          .single();

        if (userError || !userData) {
          throw new Error('Numero tessera o email non trovati.');
        }
        emailToUse = userData.email;
      }

      // Sign in with the identified email and the provided PIN
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: pin,
      });

      if (authError) throw authError;

      onLogin();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'accesso');
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-bold text-zinc-900">Bentornato</h2>
        <p className="text-zinc-500 text-sm mt-1">Accedi al tuo account</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Numero Tessera</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Inserisci il tuo codice tessera"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">PIN</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Il tuo codice segreto"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
          Accedi
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Non hai un account? <Link to="/signup" className="text-emerald-600 font-medium hover:underline">Registrati ora</Link>
      </p>
    </motion.div>
  );
};

const PrivacyModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-zinc-400" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">Privacy Policy</h3>
            </div>

            <div className="space-y-4 text-sm text-zinc-600 leading-relaxed">
              <p>
                Benvenuto su iFoneLab. La tua privacy è importante per noi. Ecco come gestiamo i tuoi dati:
              </p>
              
              <div>
                <h4 className="font-bold text-zinc-900 mb-1">Quali dati conserviamo?</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Email</li>
                  <li>PIN (crittografato e non visibile nemmeno a noi)</li>
                  <li>Nome e Cognome</li>
                  <li>Codice tessera fedeltà</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 mb-1">Perché raccogliamo questi dati?</h4>
                <p>
                  I dati vengono raccolti esclusivamente per la creazione del tuo account e per la gestione della tua tessera fedeltà digitale (accumulo punti e riscossione premi).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 mb-1">Controllo sui tuoi dati</h4>
                <p>
                  Puoi richiedere la cancellazione del tuo account in qualsiasi momento direttamente dalle impostazioni dell'app. Una volta inviata la richiesta, il commerciante riceverà una notifica e provvederà alla cancellazione definitiva dei tuoi dati (entro 7 giorni). In seguito alla cancellazione, tutti i tuoi dati verranno rimossi definitivamente dai nostri sistemi.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 mb-1">Sicurezza e Infrastruttura</h4>
                <p>
                  I dati degli utenti sono conservati su infrastrutture cloud sicure utilizzate per il funzionamento della piattaforma. In particolare, il database e il sistema di autenticazione sono gestiti da <strong>Supabase</strong>. Tali servizi trattano i dati per conto del titolare del trattamento nel rispetto delle normative sulla protezione dei dati.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 mb-1">Community WhatsApp</h4>
                <p>
                  Il tuo numero di telefono non viene raccolto né memorizzato all'interno dell'app. L'app fornisce semplicemente un link diretto per collegarti a una community WhatsApp esterna. L'adesione alla community è facoltativa e puoi uscirne in qualsiasi momento direttamente da WhatsApp.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-8 w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
            >
              Ho capito
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Signup = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'customer' | 'merchant'>('customer');
  const [merchantExists, setMerchantExists] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [signupStep, setSignupStep] = useState<1 | 2>(1); // 1: Initial/Generate, 2: Set PIN (for customer)
  const [generatedCode, setGeneratedCode] = useState('');
  const [pin, setPin] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMerchant = async () => {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'merchant');
      
      if (!error && count && count > 0) {
        setMerchantExists(true);
        setRole('customer');
      }
    };
    checkMerchant();
  }, []);

  const handleGenerateCode = () => {
    const digits = Math.floor(100000 + Math.random() * 900000);
    setGeneratedCode(`#${digits}`);
    setSignupStep(2);
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!consent) {
      setError('È necessario acconsentire al trattamento dei dati per procedere.');
      return;
    }

    if (pin.length < 4) {
      setError('Il PIN deve essere di almeno 4 cifre.');
      return;
    }

    setIsGenerating(true);
    try {
      // Generate a fake email based on the loyalty code
      const fakeEmail = `${generatedCode.replace('#', '')}@ifone.lab`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: pin,
        options: {
          data: {
            role: 'customer',
            loyalty_code: generatedCode,
            first_name: 'Cliente',
            last_name: generatedCode
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        setSuccessData({
          loyalty_code: generatedCode,
          session: authData.session
        });

        if (authData.session) {
          setTimeout(() => {
            onLogin();
            navigate('/');
          }, 3000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMerchantSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!consent) {
      setError('È necessario acconsentire al trattamento dei dati per procedere.');
      return;
    }

    // Double check on submission
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'merchant');
    
    if (count && count > 0) {
      setError('Esiste già un account commerciante. Registrati come cliente.');
      setMerchantExists(true);
      setRole('customer');
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'merchant',
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        setSuccessData({
          email: email,
          session: authData.session
        });

        if (authData.session) {
          setTimeout(() => {
            onLogin();
            navigate('/');
          }, 3000);
        }
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
              <p className="text-xs text-zinc-400 mt-2 italic">Conserva questo codice e il PIN creato per accedere.</p>
              <div className="mt-4 flex justify-center overflow-hidden" id="signup-barcode">
                <Barcode 
                  value={successData.loyalty_code} 
                  width={1.5} 
                  height={60} 
                  fontSize={14}
                  background="#f9fafb"
                />
              </div>
              <button
                onClick={() => {
                  const svg = document.querySelector('#signup-barcode svg');
                  if (svg) {
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx?.drawImage(img, 0, 0);
                      const pngUrl = canvas.toDataURL('image/png');
                      const downloadLink = document.createElement('a');
                      downloadLink.href = pngUrl;
                      downloadLink.download = `tessera-ifone-${successData.loyalty_code}.png`;
                      document.body.appendChild(downloadLink);
                      downloadLink.click();
                      document.body.removeChild(downloadLink);
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                  }
                }}
                className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-600 border border-zinc-200 rounded-xl hover:bg-white transition-all"
              >
                <Download className="w-4 h-4" />
                Salva Tessera
              </button>
            </div>
          )}
          
          {successData.session ? (
            <>
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
            </>
          ) : (
            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-sm text-amber-800 font-medium">
                {role === 'merchant' ? "Controlla la tua email per confermare l'account." : "Registrazione completata con successo."}
              </p>
              <Link to="/login" className="mt-4 inline-block text-zinc-900 font-bold hover:underline">
                Vai al Login
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {!merchantExists && signupStep === 1 && (
            <div className="flex p-1 bg-zinc-100 rounded-2xl">
              <button
                onClick={() => setRole('customer')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${role === 'customer' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Cliente
              </button>
              <button
                onClick={() => setRole('merchant')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${role === 'merchant' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Commerciante
              </button>
            </div>
          )}

          {(role === 'customer' || merchantExists) ? (
            <div className="space-y-6">
              {signupStep === 1 ? (
                <div className="text-center space-y-4">
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <QrCode className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-emerald-900">Benvenuto in iFoneLab</h3>
                    <p className="text-sm text-emerald-700 mt-2">
                      Clicca sul pulsante qui sotto per generare il tuo codice fedeltà unico e iniziare a raccogliere punti.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateCode}
                    className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-200"
                  >
                    Genera Codice
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCustomerSignup} className="space-y-4">
                  <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Il Tuo Codice</p>
                    <p className="text-3xl font-black text-zinc-900 tracking-tighter">{generatedCode}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-zinc-700">Crea il tuo PIN di accesso</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Inserisci un PIN numerico"
                      className="w-full px-4 py-4 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-center text-2xl tracking-[1em] font-bold"
                      required
                    />
                    <p className="text-[10px] text-zinc-400 text-center">Usa questo PIN insieme al codice {generatedCode} per accedere in futuro.</p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-start gap-3">
                      <input
                        id="consent-customer"
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        required
                      />
                      <label htmlFor="consent-customer" className="text-[10px] text-zinc-500 leading-relaxed cursor-pointer select-none">
                        Acconsento al trattamento dei miei dati personali ai sensi del Regolamento UE 2016/679 (GDPR) per l'attivazione e la gestione della carta fedeltà digitale iFoneLab.
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-[10px] text-emerald-600 font-bold hover:underline text-left pl-7 uppercase tracking-wider"
                    >
                      Privacy Policy
                    </button>
                  </div>

                  {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}
                  
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? 'Creazione in corso...' : 'Completa Registrazione'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="w-full text-zinc-400 text-xs font-bold hover:text-zinc-600 transition-colors"
                  >
                    Torna indietro
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleMerchantSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Cognome</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>
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
                <label className="block text-sm font-medium text-zinc-700 mb-1">PIN</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-start gap-3">
                  <input
                    id="consent-merchant"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    required
                  />
                  <label htmlFor="consent-merchant" className="text-xs text-zinc-500 leading-relaxed cursor-pointer select-none">
                    Acconsento al trattamento dei miei dati personali ai sensi del Regolamento UE 2016/679 (GDPR) per l'attivazione e la gestione dell'account commerciante iFoneLab.
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-xs text-emerald-600 font-medium hover:underline text-left pl-7"
                >
                  Privacy Policy
                </button>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Registrati come Commerciante
              </button>
            </form>
          )}
        </div>
      )}

      {!successData && (
        <p className="mt-6 text-center text-sm text-zinc-500">
          Hai già un account? <Link to="/login" className="text-emerald-600 font-medium hover:underline">Accedi</Link>
        </p>
      )}

      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </motion.div>
  );
};

const CustomerDashboard = ({ user, refreshProfile, onLogout }: { user: UserProfile, refreshProfile: () => void, onLogout: () => void }) => {
  const points = user.points || 0;
  const loyaltyCode = user.loyalty_code || '';
  const [phone, setPhone] = useState(user.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user.first_name || '');
  const [editLastName, setEditLastName] = useState(user.last_name || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          first_name: editFirstName, 
          last_name: editLastName 
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setShowEditModal(false);
      refreshProfile();
      setMessage({ text: 'Profilo aggiornato con successo!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Errore durante l\'aggiornamento.', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = confirm('Sei sicuro di voler richiedere l\'eliminazione definitiva del tuo account? Il commerciante riceverà la tua richiesta e procederà alla cancellazione dei tuoi dati.');
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ deletion_requested: true })
        .eq('id', user.id);

      if (error) throw error;

      refreshProfile();
      setMessage({ text: 'Richiesta di eliminazione inviata. Il tuo account è ora in fase di cancellazione.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      alert('Errore durante l\'invio della richiesta: ' + (err.message || 'Errore sconosciuto'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 relative">
      {user.deletion_requested && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] bg-white/90 backdrop-blur-md flex items-center justify-center p-6 text-center"
        >
          <div className="space-y-6 max-w-xs">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Trash2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">In Lavorazione</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                La tua richiesta di eliminazione account è stata presa in carico. Il commerciante provvederà alla rimozione definitiva dei tuoi dati entro 7 giorni.
              </p>
            </div>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                onLogout();
                navigate('/login');
              }}
              className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all"
            >
              Esci dall'account
            </button>
          </div>
        </motion.div>
      )}

      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-bold text-zinc-900">La Tua Area</h2>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors flex items-center gap-1 text-zinc-600"
          >
            <span className="text-xs font-bold uppercase tracking-wider">Modifica</span>
            <MoreVertical className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 z-40"
                >
                  <button
                    onClick={() => {
                      setShowEditModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifica Profilo
                  </button>
                  <button
                    onClick={() => {
                      setShowPrivacyModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Privacy Policy
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteAccount();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Elimina Account
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Punti Fedeltà</p>
              <h2 className="text-6xl font-bold tracking-tighter">{points}</h2>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">Cliente</p>
              <p className="text-sm font-bold text-emerald-400">{user.first_name} {user.last_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <Award className="w-4 h-4" />
            <span>Livello Bronzo</span>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </motion.div>

      {points >= 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-400 to-orange-500 p-8 rounded-[2rem] shadow-xl text-white text-center relative overflow-hidden"
        >
          {/* Animated Stars */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/40"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            >
              <Star className="w-4 h-4 fill-current" />
            </motion.div>
          ))}

          <div className="relative z-10">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            
            <h3 className="text-2xl font-black mb-2 tracking-tight">🎉 Congratulazioni!</h3>
            <p className="text-white/90 font-medium leading-tight">
              Hai raggiunto 100 punti e sbloccato un buono sconto di <span className="text-white font-bold underline decoration-white/40">10 €</span> da usare sul tuo prossimo acquisto!
            </p>
            
            <div className="mt-6 inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-2 rounded-full font-bold text-sm shadow-lg">
              🏆 Premio Sbloccato
            </div>
          </div>
          
          {/* Decorative background trophy */}
          <Trophy className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-100 text-center"
      >
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Il Tuo Codice</h3>
        <p className="text-zinc-500 text-sm mb-6">Mostra questo codice al commerciante per ricevere punti</p>
        <div className="bg-zinc-50 p-6 rounded-3xl inline-block border border-zinc-100 w-full overflow-hidden" id="dashboard-barcode">
          {loyaltyCode ? (
            <div className="flex justify-center">
              <Barcode 
                value={loyaltyCode} 
                width={1.8} 
                height={100} 
                displayValue={false}
                background="#f9fafb"
              />
            </div>
          ) : (
            <div className="w-[200px] h-[100px] flex items-center justify-center text-zinc-400 italic">
              Codice non disponibile
            </div>
          )}
        </div>
        <button
          onClick={() => {
            const svg = document.querySelector('#dashboard-barcode svg');
            if (svg) {
              const svgData = new XMLSerializer().serializeToString(svg);
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = pngUrl;
                downloadLink.download = `tessera-ifone-${loyaltyCode}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              };
              img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            }
          }}
          className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-600 border border-zinc-200 rounded-xl hover:bg-white transition-all"
        >
          <Download className="w-4 h-4" />
          Salva Tessera
        </button>
        <p className="mt-4 font-mono text-lg font-bold text-zinc-900">{loyaltyCode}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-[2rem] shadow-sm border border-zinc-100 overflow-hidden"
      >
        <button
          onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
          className="w-full p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 rounded-xl text-zinc-600">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-zinc-900">COME FUNZIONA</h3>
          </div>
          <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${isHowItWorksOpen ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {isHowItWorksOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="px-6 pb-6 pt-2 space-y-4 border-t border-zinc-50">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <span>🎯</span>
                  <h4>Come funziona la carta fedeltà</h4>
                </div>
                <div className="space-y-3 text-zinc-600 text-sm leading-relaxed">
                  <p>Con la nostra carta fedeltà accumulare punti è semplice.</p>
                  <p>Per ogni acquisto con spesa minima di <span className="font-bold text-zinc-900">10 €</span> riceverai <span className="font-bold text-zinc-900">10 punti fedeltà</span>.</p>
                  <p>Al raggiungimento di <span className="font-bold text-zinc-900">100 punti</span>, avrai diritto a un <span className="font-bold text-zinc-900">buono sconto di 10 €</span>, utilizzabile sul tuo prossimo acquisto.</p>
                  <p className="pt-2 italic">Grazie per la tua fedeltà e per aver scelto il nostro negozio.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.a
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        href="https://chat.whatsapp.com/Bts1aClkbMH94XSsQzVKRb"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-emerald-600 p-8 rounded-[2rem] shadow-lg text-white cursor-pointer hover:bg-emerald-700 transition-all group no-underline relative z-10 text-center"
      >
        <h3 className="font-bold text-base leading-tight">ACCEDI ALLA COMMUNITY IFONELAB PER RICEVERE OFFERTE</h3>
      </motion.a>

      <div className="grid grid-cols-1">
        <div className="bg-white p-6 rounded-3xl border border-zinc-100">
          <p className="text-zinc-400 text-xs font-bold uppercase mb-1">Ultima Visita</p>
          <p className="text-zinc-900 font-semibold">Oggi</p>
        </div>
      </div>

      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowEditModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-zinc-400" />
              </button>

              <h3 className="text-xl font-bold text-zinc-900 mb-6">Modifica Profilo</h3>

              <form onSubmit={handleUpdateName} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Cognome</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MerchantDashboard = ({ user: merchantUser }: { user: UserProfile }) => {
  const [scanning, setScanning] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState(10);
  const [mode, setMode] = useState<'add' | 'subtract'>('add');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [promotionText, setPromotionText] = useState(localStorage.getItem('promo_template') || '');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  const saveTemplate = (text: string) => {
    setPromotionText(text);
    localStorage.setItem('promo_template', text);
  };

  const fetchCustomers = async () => {
    setIsRefreshing(true);
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
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const pendingRequests = customers.filter(c => c.deletion_requested).length;
    if (pendingRequests > 0) {
      setMessage({ 
        text: `Attenzione: Ci sono ${pendingRequests} richieste di cancellazione account in sospeso.`, 
        type: 'error' 
      });
    }
  }, [customers.length]);

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
          const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update({ points: newPoints })
            .eq('id', customer.id)
            .select();

          if (updateError) throw updateError;
          
          if (!updateData || updateData.length === 0) {
            throw new Error('Permesso negato: Assicurati di aver configurato le Policy su Supabase.');
          }

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
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Scan className="w-6 h-6 text-emerald-600" />
            Pannello Commerciante
          </h2>
          <div className="relative">
            <div className={`p-2 rounded-full ${customers.some(c => c.deletion_requested) ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-400'}`}>
              <Bell className="w-6 h-6" />
              {customers.filter(c => c.deletion_requested).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {customers.filter(c => c.deletion_requested).length}
                </span>
              )}
            </div>
          </div>
        </div>

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
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-zinc-400" />
            <h3 className="text-lg font-bold text-zinc-900">Lista Clienti</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchCustomers}
              disabled={isRefreshing}
              className={`p-2 hover:bg-zinc-100 rounded-full transition-all ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-zinc-400'}`}
              title="Aggiorna lista"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold bg-zinc-100 text-zinc-500 px-2 py-1 rounded-full">{customers.length}</span>
          </div>
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
          {/* Deletion Requests Section */}
          {customers.filter(c => c.deletion_requested).length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Trash2 className="w-3 h-3" />
                Richieste di Cancellazione
              </h4>
              <div className="space-y-2">
                {customers.filter(c => c.deletion_requested).map((customer) => (
                  <div key={customer.id} className="p-4 rounded-2xl border border-red-100 bg-red-50 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{customer.first_name} {customer.last_name}</p>
                      <p className="text-xs text-zinc-500">{customer.email}</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm(`Sei sicuro di voler eliminare definitivamente l'account di ${customer.first_name}?`)) {
                          const { error } = await supabase.from('users').delete().eq('id', customer.id);
                          if (error) alert('Errore durante la cancellazione');
                          else fetchCustomers();
                        }
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
                    >
                      Conferma Elimina
                    </button>
                  </div>
                ))}
              </div>
              <div className="h-px bg-zinc-100 my-4" />
            </div>
          )}

          {filteredCustomers.map((customer) => (
            <div 
              key={customer.id} 
              className={`p-4 rounded-2xl border transition-colors ${
                customer.deletion_requested 
                  ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                  : 'border-zinc-50 bg-zinc-50/50 hover:bg-zinc-50'
              }`}
            >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${customer.deletion_requested ? 'text-red-700' : 'text-zinc-900'}`}>
                          {customer.first_name} {customer.last_name}
                        </p>
                        {customer.deletion_requested && (
                          <span className="text-[8px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">Elimina</span>
                        )}
                      </div>
                      <p className={`text-xs truncate max-w-[180px] ${customer.deletion_requested ? 'text-red-500' : 'text-zinc-500'}`}>
                        {customer.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingCustomer(customer)}
                        className="p-2 hover:bg-zinc-200 rounded-lg text-zinc-400 hover:text-zinc-600 transition-all"
                        title="Modifica cliente"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {customer.phone && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg" title={customer.phone}>
                          <Phone className="w-3 h-3" />
                          <span className="text-[10px] font-bold">{customer.phone}</span>
                        </div>
                      )}
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${customer.deletion_requested ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
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

      <AnimatePresence>
        {editingCustomer && (
          <EditCustomerModal 
            customer={editingCustomer} 
            onClose={() => setEditingCustomer(null)} 
            onUpdate={fetchCustomers} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          // Se l'utente esiste in Auth ma non ancora nella tabella 'users'
          // (magari il trigger è lento o non è stato eseguito l'SQL)
          console.warn('Profilo non trovato nel database, riprovo...');
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            role: 'customer',
            loyalty_code: 'In creazione...',
            points: 0
          });
          return;
        }
        
        if (profile) {
          setUser(profile);
        }
      } else {
        setUser(null);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setShowResetModal(true);
      }
      
      if (session) {
        fetchProfile();
      } else {
        setUser(null);
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
      <PullToRefresh onRefresh={fetchProfile}>
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
          <Navbar user={user} onLogout={handleLogout} />
          <main className="px-4 py-8">
            <Routes>
              <Route
                path="/"
                element={
                  user ? (
                    user.role === 'customer' ? (
                      <CustomerDashboard user={user} refreshProfile={fetchProfile} onLogout={handleLogout} />
                    ) : (
                      <MerchantDashboard user={user} />
                    )
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/merchant"
                element={
                  user && user.role === 'merchant' ? (
                    <MerchantDashboard user={user} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
              <Route path="/signup" element={!user ? <Signup onLogin={handleLogin} /> : <Navigate to="/" />} />
            </Routes>
          </main>
          
          {showResetModal && (
            <ResetPasswordModal onClose={() => setShowResetModal(false)} />
          )}
        </div>
      </PullToRefresh>
    </Router>
  );
}
