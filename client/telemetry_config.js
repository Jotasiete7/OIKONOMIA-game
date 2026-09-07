/**
 * client/telemetry_config.js — Configurações do OikoBug Flight Recorder & Supabase
 * OIKONOMIA v0.8.5
 */

export const TELEMETRY_CONFIG = {
  // Projeto Oficial OIKONOMIA no Supabase:
  supabaseUrl: 'https://kabbkelffggjmjchxttl.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthYmJrZWxmZmdnam1qY2h4dHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTAwNzQsImV4cCI6MjEwNDM2NjA3NH0.EGtjaciaK8IAIrM4J__BTszb99OFg4n7ImxKTFqV7EY',
  tableName: 'bug_reports',

  // Configurações de Captura Visual Otimizada
  screenshot: {
    enabled: true,
    maxWidth: 960,
    maxHeight: 540,
    quality: 0.70, // 70% de qualidade gera JPEG nítido de ~35-50KB
    mimeType: 'image/jpeg'
  },

  // Limites do Flight Recorder
  flightRecorder: {
    maxConsoleErrors: 25,
    maxRecentActions: 20,
    maxSystemLogs: 30
  }
};

/**
 * Verifica se o Supabase está devidamente configurado com credenciais reais
 */
export function isSupabaseConfigured() {
  if (!TELEMETRY_CONFIG.supabaseUrl || !TELEMETRY_CONFIG.supabaseAnonKey) return false;
  if (TELEMETRY_CONFIG.supabaseUrl.includes('SEU-PROJETO-AQUI')) return false;
  if (TELEMETRY_CONFIG.supabaseAnonKey.includes('SUA-CHAVE-ANON-PUBLICA-AQUI')) return false;
  try {
    const url = new URL(TELEMETRY_CONFIG.supabaseUrl);
    return Boolean(url.protocol && url.host);
  } catch (_) {
    return false;
  }
}
