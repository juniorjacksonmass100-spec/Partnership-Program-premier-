import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Clean and normalize Supabase Project URL
export function cleanSupabaseUrl(rawUrl: string | undefined | null): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip quotes
  url = url.replace(/^['"]+|['"]+$/g, '');

  // If user pasted dashboard project URL like https://supabase.com/dashboard/project/abcdefghijkl
  const dashMatch = url.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashMatch && dashMatch[1]) {
    return `https://${dashMatch[1]}.supabase.co`;
  }

  // Remove subpaths like /auth/v1, /rest/v1, /graphql/v1
  url = url.replace(/\/auth\/v1.*$/i, '');
  url = url.replace(/\/rest\/v1.*$/i, '');
  url = url.replace(/\/graphql\/v1.*$/i, '');
  // Remove any trailing slashes
  url = url.replace(/\/+$/, '');

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url;
}

export function cleanSupabaseKey(rawKey: string | undefined | null): string {
  if (!rawKey) return '';
  return rawKey.trim().replace(/^['"]+|['"]+$/g, '');
}

// Read from environment variables
const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL;
const rawEnvKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const envUrl = cleanSupabaseUrl(rawEnvUrl);
const envKey = cleanSupabaseKey(rawEnvKey);

// Local fallback store for URL/Key if user enters them via setup UI
const STORAGE_KEY_URL = 'jm_supabase_url';
const STORAGE_KEY_KEY = 'jm_supabase_key';

export function getSupabaseConfig(): { url: string; anonKey: string; isFromEnv: boolean } {
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, isFromEnv: true };
  }
  const savedUrl = cleanSupabaseUrl(
    (typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY_URL) || sessionStorage.getItem(STORAGE_KEY_URL)
      : '') || ''
  );
  const savedKey = cleanSupabaseKey(
    (typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY_KEY) || sessionStorage.getItem(STORAGE_KEY_KEY)
      : '') || ''
  );
  return {
    url: savedUrl,
    anonKey: savedKey,
    isFromEnv: false,
  };
}

export function saveRuntimeConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    const cleanedUrl = cleanSupabaseUrl(url);
    const cleanedKey = cleanSupabaseKey(anonKey);
    localStorage.setItem(STORAGE_KEY_URL, cleanedUrl);
    localStorage.setItem(STORAGE_KEY_KEY, cleanedKey);
    sessionStorage.setItem(STORAGE_KEY_URL, cleanedUrl);
    sessionStorage.setItem(STORAGE_KEY_KEY, cleanedKey);
    // Reload to re-initialize client cleanly
    window.location.reload();
  }
}

export function clearRuntimeConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    sessionStorage.removeItem(STORAGE_KEY_URL);
    sessionStorage.removeItem(STORAGE_KEY_KEY);
    window.location.reload();
  }
}

const config = getSupabaseConfig();

export const isSupabaseConfigured = Boolean(
  config.url && 
  config.anonKey && 
  config.url.startsWith('https://') &&
  config.url.includes('.supabase.co')
);

// Fallback dummy client if credentials aren't supplied yet to prevent hard crashes before config modal
const dummyUrl = 'https://placeholder.supabase.co';
const dummyKey = 'placeholder-key';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? config.url : dummyUrl,
  isSupabaseConfigured ? config.anonKey : dummyKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/**
 * Translates database and auth errors into natural, respectful Swahili messages.
 * Never outputs raw [object Object] or unhelpful error codes.
 */
export function formatSupabaseError(error: any): string {
  if (!error) return 'Hitilafu isiyojulikana imetokea. Tafadhali jaribu tena.';
  
  const msg = typeof error === 'string' 
    ? error 
    : (error.message || error.error_description || error.details || error.hint || JSON.stringify(error));

  const lower = msg.toLowerCase();

  if (lower.includes('invalid path') || lower.includes('invalid path specified') || lower.includes('invalid request url')) {
    return 'Hitilafu ya URL ya Supabase: Njia ya URL (Project URL) uliyoweka si sahihi au ina njia ya ziada. Hakikisha umenakili URL halisi (mfano: https://xyz.supabase.co) kutoka Project Settings → API, na si kiungo cha dashboard.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'Barua pepe au nenosiri uliloweka si sahihi. Tafadhali hakiki na ujaribu tena.';
  }
  if (lower.includes('user already registered') || lower.includes('email address is already registered')) {
    return 'Barua pepe hii imekwisha kusajiliwa katika mfumo. Tafadhali ingia au weka upya nenosiri.';
  }
  if (lower.includes('password should be at least')) {
    return 'Nenosiri lazima liwe na angalau herufi 6 kwa usalama wa akaunti yako.';
  }
  if (lower.includes('jwt expired') || lower.includes('session expired')) {
    return 'Muda wako wa kuingia umekwisha. Tafadhali ingia tena kwenye akaunti yako.';
  }
  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'Huna idhini ya kutekeleza kitendo hiki au kufikia taarifa hizi kulingana na taratibu za mfumo.';
  }
  if (lower.includes('duplicate key') || lower.includes('unique constraint')) {
    return 'Kumbukumbu yenye namba au utambulisho huu tayari ipo kwenye mfumo.';
  }
  if (lower.includes('networkerror') || lower.includes('failed to fetch')) {
    return 'Hitilafu ya mtandao: Mfumo umeshindwa kufikia seva ya Supabase. Hakiki muunganisho wako wa intaneti au vigezo vya mradi.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Barua pepe yako haijathibitishwa. Tafadhali kagua sanduku lako la barua pepe au wasiliana na msimamizi.';
  }
  if (lower.includes('relation') && lower.includes('does not exist')) {
    return 'Jedwali la kanzidata (database table) halijasanidiwa bado. Tafadhali tekeleza faili la SQL kwenye Supabase SQL Editor.';
  }

  return `Taarifa ya hitilafu: ${msg}`;
}

/**
 * Test connectivity to Supabase
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; tablesFound?: boolean }> {
  const currentConfig = getSupabaseConfig();
  if (!currentConfig.url || !currentConfig.anonKey) {
    return {
      success: false,
      message: 'Vigezo vya Supabase (URL na Anon Key) havijawekwa bado.',
    };
  }

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return {
          success: true,
          tablesFound: false,
          message: 'Muunganisho na Supabase umefanikiwa! Hata hivyo, majedwali (tables) bado hayajatengenezwa. Tafadhali endesha SQL script katika SQL Editor ya Supabase.',
        };
      }
      // RLS or other ok error
      return {
        success: true,
        tablesFound: true,
        message: 'Muunganisho na Supabase umefanikiwa na unafanya kazi kikamilifu.',
      };
    }
    return {
      success: true,
      tablesFound: true,
      message: 'Muunganisho na Supabase umefanikiwa na unafanya kazi kikamilifu.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: formatSupabaseError(err),
    };
  }
}
