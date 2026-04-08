import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    // Verify caller is council or admin
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['council', 'admin'].includes(profile.role)) {
      throw new Error('Forbidden — council or admin only');
    }

    // Read guild config from app_settings
    const { data: settingsRows } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['wcl_guild_name', 'wcl_guild_realm', 'wcl_guild_region']);

    const cfg: Record<string, string> = {};
    for (const row of settingsRows ?? []) {
      cfg[row.key] = row.value as string;
    }

    if (!cfg.wcl_guild_name || !cfg.wcl_guild_realm || !cfg.wcl_guild_region) {
      throw new Error('Guild not configured. Set guild name, realm and region in Admin → Settings.');
    }

    // Get WarcraftLogs credentials from secrets
    const clientId = Deno.env.get('WARCRAFTLOGS_CLIENT_ID');
    const clientSecret = Deno.env.get('WARCRAFTLOGS_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new Error('WarcraftLogs API credentials not set on server.');
    }

    // OAuth2 client credentials
    const tokenRes = await fetch('https://www.warcraftlogs.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!tokenRes.ok) throw new Error(`WarcraftLogs token error: ${await tokenRes.text()}`);
    const { access_token } = await tokenRes.json();

    // GraphQL query — fetch last 25 guild reports with player actors
    const query = `{
      reportData {
        reports(
          guildName: "${cfg.wcl_guild_name}"
          guildServerSlug: "${cfg.wcl_guild_realm}"
          guildServerRegion: "${cfg.wcl_guild_region}"
          limit: 25
        ) {
          data {
            code
            title
            startTime
            zone { name }
            masterData {
              actors(type: "Player") {
                name
                subType
              }
            }
          }
        }
      }
    }`;

    const gqlRes = await fetch('https://www.warcraftlogs.com/api/v2/client', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    if (!gqlRes.ok) throw new Error(`WarcraftLogs API error: ${await gqlRes.text()}`);

    const gqlData = await gqlRes.json();
    if (gqlData.errors) throw new Error(gqlData.errors[0]?.message ?? 'GraphQL error');

    const reports = gqlData?.data?.reportData?.reports?.data ?? [];

    const sessions = reports.map((r: Record<string, unknown>) => {
      const masterData = r.masterData as { actors: { name: string; subType: string }[] } | null;
      const zone = r.zone as { name: string } | null;
      return {
        code: r.code as string,
        title: r.title as string,
        date: new Date((r.startTime as number)).toISOString().slice(0, 10),
        instance: zone?.name ?? 'Unknown',
        players: (masterData?.actors ?? [])
          .filter((a) => a.subType && a.subType !== 'Unknown')
          .map((a) => a.name),
      };
    });

    return new Response(JSON.stringify({ sessions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
