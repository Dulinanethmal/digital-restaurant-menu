import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    // 1. Catch ALL the data sent from React (including both casing styles just in case)
    const payload = await req.json();
    const email = payload.email;
    const password = payload.password;
    const fullName = payload.fullName || payload.full_name;
    const role = payload.role;
    const shopId = payload.shopId || payload.shop_id; // Grabs the shop ID safely

    // 2. Put on the "Admin Hat"
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Create Auth User
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true 
    });

    if (authError) throw authError;

    const userId = data.user.id;

    // 4. Upsert Profile with ALL data (Added email here!)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([ 
        { 
          id: userId, 
          full_name: fullName, 
          email: email,       // <-- THIS WAS MISSING
          role: role, 
          shop_id: shopId     // <-- MUST MATCH THE SHOP
        }
      ]);

    if (profileError) throw profileError;

    return new Response(JSON.stringify({ success: true }), { 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
    });
  }
});