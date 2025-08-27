// services/profile.ts
import { supabase } from '../lib/supabaseClient';

export async function ensureProfile() {
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr || !user) return;

  await supabase.from('user_profiles').upsert({
    id: user.id,
    email: user.email ?? null,
    updated_at: new Date().toISOString(),
  });
}