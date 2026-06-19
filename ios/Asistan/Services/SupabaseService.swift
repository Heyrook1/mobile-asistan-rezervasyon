import Foundation
import Supabase

/// Single shared Supabase client (native email/password auth).
let supabase = SupabaseClient(
    supabaseURL: URL(string: Config.EXPO_PUBLIC_SUPABASE_URL)!,
    supabaseKey: Config.EXPO_PUBLIC_SUPABASE_ANON_KEY
)
