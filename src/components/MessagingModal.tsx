import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage, Profile } from '../types/database.types';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  MessageSquare, 
  Send, 
  X, 
  User, 
  ShieldCheck, 
  Search, 
  Clock, 
  CheckCheck,
  RefreshCw,
  Sparkles,
  Phone,
  Building2
} from 'lucide-react';
import { formatDateSwahili } from '../utils/formatters';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPartners?: Profile[];
  messages: DirectMessage[];
  onSendMessage: (receiverId: string, messageText: string) => Promise<void>;
  onMarkMessagesAsRead: (partnerId: string) => void;
}

export const MessagingModal: React.FC<MessagingModalProps> = ({
  isOpen,
  onClose,
  allPartners = [],
  messages,
  onSendMessage,
  onMarkMessagesAsRead,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If partner, the receiver is always Admin; if admin, receiver is the selected partner
  const adminProfile = allPartners.find((p) => p.role === 'admin');
  const targetPartnerId = isAdmin ? selectedPartnerId : (adminProfile?.id || 'admin');

  // If Admin, auto-select first partner with messages or first partner if none selected
  useEffect(() => {
    if (!isOpen || !isAdmin || allPartners.length === 0 || selectedPartnerId) return;

    // Find partner with most recent message, or first non-admin partner
    const partnerWithMsg = allPartners.find(
      (p) => p.role !== 'admin' && messages.some((m) => m.sender_id === p.id || m.receiver_id === p.id)
    );
    if (partnerWithMsg) {
      setSelectedPartnerId(partnerWithMsg.id);
    } else {
      const firstPartner = allPartners.find((p) => p.id !== user?.id);
      if (firstPartner) setSelectedPartnerId(firstPartner.id);
    }
  }, [isOpen, isAdmin, allPartners.length, selectedPartnerId, user?.id]);

  // Mark messages as read when modal is open and partner is active - only if unread messages exist
  useEffect(() => {
    if (!isOpen || !targetPartnerId || !user) return;

    const hasUnread = messages.some(
      (m) => m.sender_id === targetPartnerId && (!m.receiver_id || m.receiver_id === user.id) && !m.is_read
    );

    if (hasUnread) {
      onMarkMessagesAsRead(targetPartnerId);
    }
  }, [isOpen, targetPartnerId, user?.id, messages, onMarkMessagesAsRead]);

  // Scroll to bottom when conversation changes or modal opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length, selectedPartnerId]);

  if (!isOpen || !user) return null;

  // Active conversation partner
  const activePartner: Partial<Profile> | undefined = isAdmin
    ? allPartners.find((p) => p.id === selectedPartnerId)
    : adminProfile || { 
        id: 'admin', 
        full_name: 'Msimamizi wa Huduma (Admin)', 
        role: 'admin', 
        phone_number: null, 
        fellowship_center: 'Makao Makuu',
        partner_category: 'Uongozi wa Huduma'
      };

  // Filter messages for current thread
  const currentThread = messages.filter((m) => {
    if (isAdmin) {
      return (
        (m.sender_id === selectedPartnerId && m.receiver_id === user.id) ||
        (m.sender_id === user.id && m.receiver_id === selectedPartnerId) ||
        (m.sender_id === selectedPartnerId && !m.receiver_id) // broadcast to admin
      );
    } else {
      // User perspective: all messages between this user and admin
      return m.sender_id === user.id || m.receiver_id === user.id;
    }
  });

  // Handle message send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    const targetReceiverId = isAdmin ? selectedPartnerId : (adminProfile?.id || 'admin');
    if (!targetReceiverId) return;

    try {
      setSending(true);
      await onSendMessage(targetReceiverId, messageText.trim());
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // Partners list for Admin sidebar
  const filteredPartnersList = allPartners
    .filter((p) => p.id !== user.id)
    .filter((p) => {
      if (!partnerSearch.trim()) return true;
      const q = partnerSearch.toLowerCase();
      return (
        p.full_name?.toLowerCase().includes(q) ||
        p.phone_number?.toLowerCase().includes(q) ||
        p.fellowship_center?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#080312]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#140827] text-slate-100 rounded-3xl shadow-2xl border border-purple-800/60 overflow-hidden flex flex-col h-[88vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 px-6 py-4 text-white text-left relative border-b border-purple-800/50 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#1c0c38] border border-purple-700/60 text-amber-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                <span>Mawasiliano ya Moja kwa Moja</span>
                <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-purple-800 text-amber-300 font-semibold border border-purple-600/50">
                  {isAdmin ? 'Admin Console' : 'Mshirika & Mchungaji'}
                </span>
              </h2>
              <p className="text-xs text-purple-200/90">
                {isAdmin
                  ? 'Jibu maswali, pokea maombi ya washirika, na toa ufafanuzi wa ahadi na sadaka.'
                  : 'Tuma maombi, maswali au maoni yako moja kwa moja kwa Uongozi wa Huduma.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition"
            title="Funga dirisha"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Admin: Partners Sidebar */}
          {isAdmin && (
            <div className="w-72 sm:w-80 border-r border-purple-800/50 bg-[#100622] flex flex-col shrink-0">
              {/* Partner search */}
              <div className="p-3 border-b border-purple-800/40">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder="Tafuta mshirika..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#190a33] text-white border border-purple-700/60 rounded-xl placeholder-purple-400/50 focus:border-amber-400 outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Partners list */}
              <div className="flex-1 overflow-y-auto divide-y divide-purple-900/30">
                {filteredPartnersList.length === 0 ? (
                  <div className="p-6 text-center text-purple-300/60 text-xs">
                    Hakuna mshirika aliyepatikana.
                  </div>
                ) : (
                  filteredPartnersList.map((p) => {
                    const isSelected = p.id === selectedPartnerId;
                    const partnerMsgs = messages.filter(
                      (m) => (m.sender_id === p.id && m.receiver_id === user.id) || (m.sender_id === user.id && m.receiver_id === p.id)
                    );
                    const lastMsg = partnerMsgs[partnerMsgs.length - 1];
                    const hasUnread = partnerMsgs.some((m) => m.sender_id === p.id && !m.is_read);

                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPartnerId(p.id)}
                        className={`w-full text-left p-3 transition flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-purple-900/70 border-l-4 border-amber-400'
                            : 'hover:bg-purple-950/40'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-700 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {p.full_name?.charAt(0).toUpperCase() || 'M'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold text-xs text-white truncate">
                              {p.full_name}
                            </span>
                            {hasUnread && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                            )}
                          </div>

                          <div className="text-[10px] text-purple-300/80 truncate">
                            {lastMsg ? lastMsg.message : (p.fellowship_center || 'Makao Makuu')}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-[#140827]">
            {/* Active Thread Bar */}
            <div className="px-5 py-3 border-b border-purple-800/40 bg-[#160a2c] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-900 border border-amber-500/40 text-amber-300 font-bold text-sm flex items-center justify-center">
                  {activePartner?.full_name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{activePartner?.full_name || 'Uongozi wa Huduma'}</span>
                    {activePartner?.role === 'admin' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <span className="text-[10px] font-sans px-2 py-0.2 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                        {activePartner?.partner_category || 'Mshirika'}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-purple-300/80">
                    {activePartner?.phone_number && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-amber-400" /> {activePartner.phone_number}
                      </span>
                    )}
                    {activePartner?.fellowship_center && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-2.5 h-2.5 text-purple-400" /> {activePartner.fellowship_center}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Inafanya kazi Moja kwa Moja
                </span>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {currentThread.length === 0 ? (
                <div className="py-16 text-center text-purple-300/70">
                  <MessageSquare className="w-12 h-12 mx-auto text-purple-500/30 mb-3" />
                  <p className="font-serif font-bold text-sm text-amber-200">
                    Hakuna ujumbe uliotumwa bado
                  </p>
                  <p className="text-xs text-purple-300/70 max-w-sm mx-auto mt-1">
                    {isAdmin
                      ? 'Chagua mshirika kushoto na uandike ujumbe wa faraja, jibu maombi, au ufafanuzi wa kifedha.'
                      : 'Andika ujumbe wako hapa chini. Mchungaji na uongozi watapokea na kukujibu moja kwa moja.'}
                  </p>
                </div>
              ) : (
                currentThread.map((msg) => {
                  const isMine = msg.sender_id === user.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                          isMine
                            ? 'bg-gradient-to-r from-purple-800 to-indigo-800 text-white rounded-br-xs border border-purple-600/60'
                            : 'bg-[#1e0d38] text-slate-100 rounded-bl-xs border border-purple-700/50'
                        }`}
                      >
                        {!isMine && (
                          <div className="font-bold text-[10px] text-amber-300 mb-0.5 flex items-center gap-1">
                            {msg.sender_role === 'admin' ? (
                              <>
                                <ShieldCheck className="w-3 h-3 text-amber-400" />
                                Mchungaji / Admin
                              </>
                            ) : (
                              msg.sender_name
                            )}
                          </div>
                        )}

                        <p className="whitespace-pre-wrap leading-relaxed text-xs">
                          {msg.message}
                        </p>

                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-purple-300/80">
                          <span>{formatDateSwahili(msg.created_at)}</span>
                          {isMine && (
                            <CheckCheck className={`w-3 h-3 ${msg.is_read ? 'text-amber-400' : 'text-purple-400'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 sm:p-4 bg-[#100622] border-t border-purple-800/40">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    isAdmin
                      ? `Andika jibu kwa ${activePartner?.full_name || 'mshirika'}...`
                      : 'Andika ujumbe au ombi lako kwa Mchungaji / Admin...'
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#1c0f33] text-white border border-purple-700/80 text-xs placeholder-purple-400/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-hidden font-medium"
                />

                <button
                  type="submit"
                  disabled={!messageText.trim() || sending}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-purple-950 font-bold text-xs hover:from-amber-300 hover:to-amber-500 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tuma</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
