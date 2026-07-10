import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Supabase는 @bammy.local 같은 도메인을 거절함 → .app 등 일반 TLD 사용
const AUTH_EMAIL_DOMAIN = 'bammy.app'

export function toAuthEmail(username) {
  return `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`
}
