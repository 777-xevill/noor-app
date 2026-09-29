import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// Accounts switch on only when the build is given a Supabase project (see .env.example and
// supabase/README.md). Without one, everything keeps working on the phone alone.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key
  ? createClient(url, key, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;

export const accountsEnabled = supabase !== null;

// Refresh the session only while the app is in front, as Supabase recommends for React Native.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => (state === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh()));
}
