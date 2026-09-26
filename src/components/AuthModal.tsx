import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmblemLogo } from './EmblemLogo';
import { X, Mail, Lock, User, Phone, MapPin, Award, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { PartnerCategory } from '../types/database.types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onOpenConfig?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onOpenConfig,
}) => {
  const { signIn, signUp, authError, clearAuthError, isConfigured } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fellowshipCenter, setFellowshipCenter] = useState('Makao Makuu (Dar es Salaam)');
  const [partnerCategory, setPartnerCategory] = useState<PartnerCategory>('Mshirika wa Kawaida');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email || !password) {
      setLocalError('Tafadhali jaza barua pepe na nenosiri lako.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Nenosiri linapaswa kuwa na angalau herufi au tarakimu 6.');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setLocalError('Tafadhali jaza jina lako kamili.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await signIn(email, password);
        if (res.success) {
          onClose();
        } else if (res.error) {
          setLocalError(res.error);
        }
      } else {
        const res = await signUp({
          email,
          password,
          fullName,
          phoneNumber,
          fellowshipCenter,
          partnerCategory,
        });

        if (res.success) {
          onClose();
        } else if (res.error) {
          setLocalError(res.error);
        }
      }
    } catch (err: any) {
      setLocalError(err.message || 'Hitilafu imetokea. Tafadhali jaribu tena.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-purple-100 overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-200 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-2">
            <EmblemLogo size="md" />
          </div>
          <h2 className="font-serif font-bold text-xl text-amber-200">
            {mode === 'login' ? 'Karibu Tena — Ingia Kwenye Akaunti' : 'Sajiliwa Kama Mshirika wa Huduma'}
          </h2>
          <p className="text-xs text-purple-200 mt-1">
            Jerusalem Ministry of Gospel • Mpango wa Ushirika na Utoaji
          </p>

          {/* Toggle Tabs */}
          <div className="flex p-1 bg-purple-900/60 rounded-xl mt-4 border border-purple-700/50">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLocalError(null);
                clearAuthError();
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                mode === 'login'
                  ? 'bg-amber-400 text-purple-950 shadow-xs'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              Ingia (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setLocalError(null);
                clearAuthError();
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                mode === 'register'
                  ? 'bg-amber-400 text-purple-950 shadow-xs'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              Jisajili (Kuwa Mshirika)
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {(localError || authError) && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Taarifa ya Hitilafu:</span>
                <span>{localError || authError}</span>
                {onOpenConfig && ((localError || authError || '').toLowerCase().includes('supabase') || (localError || authError || '').toLowerCase().includes('url') || !isConfigured) && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenConfig();
                    }}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-900 text-white font-bold text-[11px] hover:bg-rose-800 transition"
                  >
                    Bofya Hapa Kusanidi Supabase URL & Key Sahihi
                  </button>
                )}
              </div>
            </div>
          )}

          {!isConfigured && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <p className="font-semibold">Kumbuka:</p>
              <p className="text-[11px] mt-0.5">
                Vigezo vya Supabase havijawekwa kwenye faili la mazingira (.env). Ili kuingia kwa usahihi, 
                tafadhali sanidi URL na Anon Key kupitia kitufe cha "Sanidi Supabase" kilicho juu.
              </p>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jina Kamili la Mshirika *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="mfano: Jackson Daniel Massam"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Namba ya Simu
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0712 345 678"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kituo cha Ibada / Tawi
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={fellowshipCenter}
                      onChange={(e) => setFellowshipCenter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden bg-white"
                    >
                      <option value="Makao Makuu (Dar es Salaam)">Makao Makuu (Dar es Salaam)</option>
                      <option value="Tawi la Arusha">Tawi la Arusha</option>
                      <option value="Tawi la Dodoma">Tawi la Dodoma</option>
                      <option value="Tawi la Mwanza">Tawi la Mwanza</option>
                      <option value="Tawi la Mbeya">Tawi la Mbeya</option>
                      <option value="Tawi la Moshi">Tawi la Moshi</option>
                      <option value="Tawi la Morogoro">Tawi la Morogoro</option>
                      <option value="Tawi la Tanga">Tawi la Tanga</option>
                      <option value="Tawi la Zanzibar">Tawi la Zanzibar</option>
                      <option value="Washirika wa Mtandaoni / Diaspora">Washirika wa Mtandaoni / Diaspora</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kiwango cha Ushirika (Kategoria)
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={partnerCategory}
                    onChange={(e) => setPartnerCategory(e.target.value as PartnerCategory)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden bg-white"
                  >
                    <option value="Mshirika wa Dhahabu">Mshirika wa Dhahabu (Gold Partner)</option>
                    <option value="Mshirika wa Fedha">Mshirika wa Fedha (Silver Partner)</option>
                    <option value="Mshirika wa Shaba">Mshirika wa Shaba (Bronze Partner)</option>
                    <option value="Mshirika Mkuu">Mshirika Mkuu (Key Ministry Supporter)</option>
                    <option value="Mshirika wa Kawaida">Mshirika wa Kawaida (General Partner)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Barua Pepe (Email) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jina@mfano.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nenosiri (Password) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Angalau herufi 6"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-950 text-amber-300 font-bold text-sm hover:from-purple-800 hover:to-indigo-900 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-60 border border-amber-500/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Inashughulikiwa kupitia Supabase...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <span>Ingia Kwenye Akaunti</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Kamilisha Usajili wa Ushirika</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <p>
              Je, bado hujajiunga kama mshirika?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setLocalError(null);
                }}
                className="font-bold text-purple-900 hover:underline"
              >
                Jisajili Hapa
              </button>
            </p>
          ) : (
            <p>
              Tayari una akaunti ya ushirika?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLocalError(null);
                }}
                className="font-bold text-purple-900 hover:underline"
              >
                Ingia Hapa
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
