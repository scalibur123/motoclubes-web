import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://yxmirhpwmdmaxynlshdx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bWlyaHB3bWRtYXh5bmxzaGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxODc2MDcsImV4cCI6MjA5Mzc2MzYwN30.tCJKmAeG9A3ua1WJ5s166OvnIMalfS9SLOA23McirGc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
