export function validateEnvironmentVariables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('your-project') || supabaseUrl.includes('placeholder')) {
    throw new Error('CONFIG_ERROR: NEXT_PUBLIC_SUPABASE_URL is missing or unconfigured.');
  }

  if (!supabaseKey || supabaseKey.includes('replace_with') || supabaseKey.includes('placeholder')) {
    throw new Error('CONFIG_ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE_KEY is missing or unconfigured.');
  }

  return {
    supabaseUrl,
    supabaseKey,
    isGeminiConfigured:
      Boolean(process.env.GEMINI_API_KEY) &&
      !process.env.GEMINI_API_KEY?.includes('replace_with'),
  };
}
