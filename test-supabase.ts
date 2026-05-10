import { createClient } from '@supabase/supabase-js';
try {
  const supabase = createClient('', '');
  console.log("Success, client created:", !!supabase);
} catch (e) {
  console.error("Error:", e.message);
}
