import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Will be null if env vars not configured — app falls back to mock auth
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const isSupabaseConfigured = !!supabase;

// ─── Auth helpers ────────────────────────────────────────────────────────────

export async function signUp(email, password, metadata = {}) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
}

export async function signIn(email, password) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  return supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

// ─── Profile helpers ──────────────────────────────────────────────────────────

export async function getProfile(userId) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function upsertProfile(userId, updates) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();
  return data;
}

// ─── Streams helpers ──────────────────────────────────────────────────────────

export function subscribeToStreams(callback) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel('public:streams')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'streams' }, callback)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function getLiveStreams() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('streams')
    .select('*, profiles(display_name, avatar_color)')
    .eq('status', 'live')
    .order('viewers', { ascending: false });
  return data ?? [];
}

export async function createStream(streamData) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('streams')
    .insert(streamData)
    .select()
    .single();
  return data;
}

export async function endStream(streamId) {
  if (!supabase) return;
  await supabase
    .from('streams')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', streamId);
}

// ─── Messages / DMs helpers ────────────────────────────────────────────────────

export function subscribeToDMs(userId, callback) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`dms:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${userId}`,
    }, callback)
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function sendDM(senderId, recipientId, content) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, content })
    .select()
    .single();
  return data;
}
