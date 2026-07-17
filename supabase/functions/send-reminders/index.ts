import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Brevo API Key
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
// The email address you verified in Brevo
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") ?? "hello@yourdomain.com";

serve(async (req) => {
  try {
    // 1. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Determine tomorrow's day of the week (0=Sunday, 6=Saturday)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDayOfWeek = tomorrow.getDay();

    // 3. Find markets happening tomorrow
    const { data: markets, error: marketError } = await supabaseClient
      .from("markets")
      .select("id, name, location")
      .eq("day_of_week", tomorrowDayOfWeek);

    if (marketError) throw marketError;

    if (!markets || markets.length === 0) {
      return new Response(
        JSON.stringify({ message: "No markets happening tomorrow." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const marketIds = markets.map((m) => m.id);

    // 4. Find all subscribers for these markets
    const { data: subscribers, error: subError } = await supabaseClient
      .from("subscribers")
      .select("email, market_id")
      .in("market_id", marketIds);

    if (subError) throw subError;

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscribers to notify." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Send emails via Brevo
    let emailsSent = 0;

    for (const market of markets) {
      const marketSubs = subscribers.filter((s) => s.market_id === market.id);
      
      for (const sub of marketSubs) {
        if (!BREVO_API_KEY) {
          console.warn("Missing BREVO_API_KEY, skipping email to", sub.email);
          continue;
        }

        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": BREVO_API_KEY,
            "accept": "application/json"
          },
          body: JSON.stringify({
            sender: {
              name: "Market Day Reminders",
              email: SENDER_EMAIL
            },
            to: [
              {
                email: sub.email
              }
            ],
            subject: `Reminder: ${market.name} is Tomorrow!`,
            htmlContent: `
              <h2>Don't forget!</h2>
              <p>The <strong>${market.name}</strong> at ${market.location} is happening tomorrow.</p>
              <p>Get ready for market day!</p>
              <br/>
              <small>You received this because you subscribed to weekly reminders in Zungeru.</small>
            `,
          }),
        });

        if (res.ok) {
          emailsSent++;
        } else {
          console.error(`Failed to send email to ${sub.email}: ${await res.text()}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ message: `Successfully sent ${emailsSent} reminders via Brevo.` }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
