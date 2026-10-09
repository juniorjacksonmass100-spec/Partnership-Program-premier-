import React, { useState } from 'react';
import { AppNotification, NotificationType } from '../types/database.types';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Receipt, 
  HeartHandshake, 
  MessageSquare, 
  Radio, 
  Sparkles, 
  Info,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { formatDateSwahili } from '../utils/formatters';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onOpenMessages?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onOpenMessages,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'contribution':
        return <Receipt className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'pledge':
        return <HeartHandshake className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-indigo-400 shrink-0" />;
      case 'announcement':
        return <Radio className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080312]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#140827] text-slate-100 rounded-3xl shadow-2xl border border-purple-800/60 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 p-6 text-white text-left relative border-b border-purple-800/50 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition"
            title="Funga"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              <Bell className="w-6 h-6 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping"></span>
              )}
            </div>
            <h2 className="font-serif font-bold text-xl text-white">
              Kituo cha Arifa na Taarifa
            </h2>
            {unreadCount > 0 && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-purple-950">
                {unreadCount} Mpya
              </span>
            )}
          </div>
          <p className="text-xs text-purple-200/90">
            Fuatilia taarifa za michango yako, ahadi zilizothibitishwa, matangazo ya huduma na ujumbe.
          </p>

          {/* Quick Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-purple-800/50 text-xs">
            {/* Filter buttons */}
            <div className="flex bg-[#1a0c33] p-1 rounded-xl border border-purple-700/50">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filter === 'all'
                    ? 'bg-purple-800 text-amber-300 shadow-xs'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                Zote ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  filter === 'unread'
                    ? 'bg-purple-800 text-amber-300 shadow-xs'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                Ambazo Hazijasomwa ({unreadCount})
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="px-2.5 py-1 rounded-lg bg-purple-900/80 hover:bg-purple-800 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1 border border-purple-700/50 transition"
                  title="Weka zote kuwa zimesomwa"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Soma Zote</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center gap-1 border border-rose-800/40 transition"
                  title="Futa arifa zote zilizopo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Safisha</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-purple-900/30">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-purple-300/70">
              <Bell className="w-10 h-10 mx-auto text-purple-500/40 mb-2" />
              <p className="text-sm font-semibold">Hakuna arifa kwa sasa</p>
              <p className="text-xs text-purple-400/60 mt-1">
                {filter === 'unread' ? 'Arifa zote zimeshasomwa.' : 'Taarifa zozote mpya zitaonekana hapa.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.is_read) onMarkAsRead(notif.id);
                  if (notif.type === 'message' && onOpenMessages) {
                    onClose();
                    onOpenMessages();
                  }
                }}
                className={`pt-2.5 first:pt-0 p-3 rounded-2xl transition cursor-pointer flex items-start gap-3 border ${
                  notif.is_read
                    ? 'bg-[#180d2e]/50 border-purple-900/30 text-purple-200/90'
                    : 'bg-[#200e3d] border-amber-500/40 shadow-sm text-white'
                }`}
              >
                <div className="mt-0.5 p-2 rounded-xl bg-[#130726] border border-purple-800/60">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-serif font-bold text-sm text-amber-200 truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-purple-400 shrink-0 font-medium">
                      {formatDateSwahili(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed break-words">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1">
                    {!notif.is_read ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Mpya
                      </span>
                    ) : (
                      <span className="text-[10px] text-purple-400">Imesomwa</span>
                    )}

                    <div className="flex items-center gap-2">
                      {notif.type === 'message' && onOpenMessages && (
                        <span className="text-[10px] text-indigo-300 font-bold flex items-center gap-0.5 hover:underline">
                          Fungua Ujumbe <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(notif.id);
                        }}
                        className="p-1 text-purple-400 hover:text-rose-400 rounded-md transition"
                        title="Futa arifa hii"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#100622] border-t border-purple-800/40 flex items-center justify-between text-xs text-purple-300 shrink-0">
          <span>Jerusalem Ministry of Gospel — Taarifa Moja kwa Moja</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold transition"
          >
            Funga
          </button>
        </div>
      </div>
    </div>
  );
};
