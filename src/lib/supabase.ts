import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  isSupabaseConfigured,
  supabasePublishableKey,
  supabaseUrl,
} from './config'
import type { Database } from './database.types'

let client: SupabaseClient<Database> | null = null

/**
 * 建立 Supabase client。
 *
 * - 前端僅使用 **publishable key**（可公開、受 RLS 保護）。
 * - 任何 secret / service_role key 不得出現在前端程式碼與瀏覽器。
 * - 資料存取權限一律由 Row Level Security (RLS) 在資料庫端決定。
 */
export function getSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null
  if (!client) {
    client = createClient<Database>(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}