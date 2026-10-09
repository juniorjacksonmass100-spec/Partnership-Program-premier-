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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080312]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#140827] text-slate-100 rounded-3xl shadow-2xl border border-purple-800/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white text-center relative border-b border-purple-800/50 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition"
            title="Funga"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-2">
            <EmblemLogo size="sm" showSubtitle={false} />
          </div>
          <h2 className="font-serif font-bold text-xl text-white">
            {mode === 'login' ? 'Kuingia Kwenye Akaunti ya Mshirika' : 'Kujiunga na Ushirika wa Huduma'}
          </h2>
          <p className="text-xs text-purple-200/90 mt-0.5">
            Jerusalem Ministry of Gospel • Mpango wa Sadaka na Ahadi
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex bg-[#120722] p-1 rounded-xl mt-4 border border-purple-800/50 max-w-xs mx-auto">
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
              Kuwa Mshirika Mpya
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {(localError || authError) && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Taarifa ya Hitilafu:</span>
                <span className="leading-relaxed">{localError || authError}</span>
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
            <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-600/40 text-amber-200 text-xs">
              <p className="font-bold">Kumbuka:</p>
              <p className="text-[11px] mt-0.5 text-amber-200/90 leading-relaxed">
                Vigezo vya Supabase havijawekwa kwenye faili la mazingira. Ili kuunganisha na hifadhidata halisi,
                tafadhali sanidi URL na Anon Key kupitia kitufe cha "Sanidi Supabase" kilicho juu.
              </p>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1.5">
                  Jina Kamili la Mshirika *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="mfano: Jackson Daniel Massam"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1.5">
                    Namba ya Simu
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0712 345 678"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-200 mb-1.5">
                    Kituo cha Ibada / Tawi
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={fellowshipCenter}
                      onChange={(e) => setFellowshipCenter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
                    >
                      <option value="Makao Makuu (Dar es Salaam)" className="bg-[#140827] text-white">Makao Makuu (Dar es Salaam)</option>
                      <option value="Tawi la Arusha" className="bg-[#140827] text-white">Tawi la Arusha</option>
                      <option value="Tawi la Dodoma" className="bg-[#140827] text-white">Tawi la Dodoma</option>
                      <option value="Tawi la Mwanza" className="bg-[#140827] text-white">Tawi la Mwanza</option>
                      <option value="Tawi la Mbeya" className="bg-[#140827] text-white">Tawi la Mbeya</option>
                      <option value="Tawi la Moshi" className="bg-[#140827] text-white">Tawi la Moshi</option>
                      <option value="Tawi la Morogoro" className="bg-[#140827] text-white">Tawi la Morogoro</option>
                      <option value="Tawi la Tanga" className="bg-[#140827] text-white">Tawi la Tanga</option>
                      <option value="Tawi la Zanzibar" className="bg-[#140827] text-white">Tawi la Zanzibar</option>
                      <option value="Washirika wa Mtandaoni / Diaspora" className="bg-[#140827] text-white">Washirika wa Mtandaoni / Diaspora</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-200 mb-1.5">
                  Kiwango cha Ushirika (Kategoria)
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    value={partnerCategory}
                    onChange={(e) => setPartnerCategory(e.target.value as PartnerCategory)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
                  >
                    <option value="Mshirika wa Kawaida" className="bg-[#140827] text-white">Mshirika wa Kawaida</option>
                    <option value="Mshirika wa Fedha wa Dhahabu" className="bg-[#140827] text-white">Mshirika wa Fedha wa Dhahabu (Gold Partner)</option>
                    <option value="Mshirika wa Fedha wa Fedha" className="bg-[#140827] text-white">Mshirika wa Fedha wa Fedha (Silver Partner)</option>
                    <option value="Mshirika wa Ujenzi wa Hekalu" className="bg-[#140827] text-white">Mshirika wa Ujenzi wa Hekalu (Temple Builder)</option>
                    <option value="Mshirika wa Vijana na Watoto" className="bg-[#140827] text-white">Mshirika wa Vijana na Watoto</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">
              Barua Pepe (Email) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mshirika@barua.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-purple-200 mb-1.5">
              Nenosiri (Password) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-purple-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Angalau herufi 6"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#1c0f33] text-white border border-purple-700/60 rounded-xl focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden placeholder-purple-300/40 font-medium"
              />
            </div>
          </div>

          {/* Buttons: Cancel & Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-purple-800/40 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 font-semibold text-xs border border-purple-700/50 transition"
            >
              Funga
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-purple-950 font-bold text-xs hover:from-amber-400 hover:to-amber-300 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-950" />
                  <span>Inathibitishwa...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Ingia Kwenye Akaunti' : 'Kamilisha Usajili wa Ushirika'}</span>
                  <ArrowRight className="w-4 h-4 text-purple-950" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
