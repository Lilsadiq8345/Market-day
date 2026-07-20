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

    // 3. Find markets happening tomorrow, joined with villages
    const { data: markets, error: marketError } = await supabaseClient
      .from("markets")
      .select(`
        id, 
        name, 
        location,
        start_time,
        villages (name)
      `)
      .eq("day_of_week", tomorrowDayOfWeek);

    if (marketError) throw marketError;

    if (!markets || markets.length === 0) {
      return new Response(
        JSON.stringify({ message: "No markets happening tomorrow." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const marketIds = markets.map((m) => m.id);

    // 4. Find all subscriptions for these markets, joined with users
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("subscriptions")
      .select(`
        market_id,
        users (
          id,
          full_name,
          email,
          preferred_channel
        )
      `)
      .in("market_id", marketIds);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscribers to notify." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Format the date for the email
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = tomorrow.toLocaleDateString('en-US', options);

    // 5. Send emails via Brevo and log
    let emailsSent = 0;

    for (const market of markets) {
      const marketSubs = subscriptions.filter((s) => s.market_id === market.id);
      
      for (const sub of marketSubs) {
        // Since it's a join, sub.users is an object or array. Supabase returns single object for one-to-many relationship from the child side
        const user = Array.isArray(sub.users) ? sub.users[0] : sub.users;
        
        if (!user || !user.email || user.preferred_channel !== 'email') continue;

        if (!BREVO_API_KEY) {
          console.warn("Missing BREVO_API_KEY, skipping email to", user.email);
          continue;
        }

        const villageName = Array.isArray(market.villages) ? market.villages[0]?.name : market.villages?.name;

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
                email: user.email,
                name: user.full_name || "Market User"
              }
            ],
            subject: `Upcoming: ${market.name} is Tomorrow!`,
            htmlContent: `
              <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
                <div style="background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <div style="background-color: #047857; padding: 40px 30px; text-align: center;">
                    <div style="background-color: rgba(255, 255, 255, 0.2); display: inline-block; padding: 10px 20px; border-radius: 50px; margin-bottom: 20px;">
                      <span style="color: #ffffff; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Official Notification</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Market Day Reminder</h1>
                  </div>
                  
                  <!-- Body -->
                  <div style="padding: 40px 30px;">
                    <p style="font-size: 18px; color: #1e293b; margin-bottom: 24px; font-weight: 600;">Dear ${user.full_name || 'Subscriber'},</p>
                    
                    <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 35px;">
                      This is a scheduled automated alert to remind you that your subscribed market is taking place tomorrow. Please find your market details below so you can prepare accordingly.
                    </p>
                    
                    <!-- Details Card -->
                    <div style="background-color: #f1f5f9; border-left: 5px solid #059669; padding: 25px; border-radius: 0 12px 12px 0; margin-bottom: 35px;">
                      <h2 style="margin: 0 0 15px 0; color: #0f172a; font-size: 22px; font-weight: 800;">${market.name}</h2>
                      <div style="display: flex; flex-direction: column; gap: 10px;">
                        <p style="margin: 0; color: #475569; font-size: 16px;">
                          <strong style="color: #1e293b; display: inline-block; width: 80px;">📍 Village:</strong> ${villageName || 'N/A'}
                        </p>
                        <p style="margin: 0; color: #475569; font-size: 16px;">
                          <strong style="color: #1e293b; display: inline-block; width: 80px;">📍 Location:</strong> ${market.location}
                        </p>
                        <p style="margin: 0; color: #475569; font-size: 16px;">
                          <strong style="color: #1e293b; display: inline-block; width: 80px;">📅 Date:</strong> ${formattedDate}
                        </p>
                        <p style="margin: 0; color: #475569; font-size: 16px;">
                          <strong style="color: #1e293b; display: inline-block; width: 80px;">⏰ Time:</strong> ${market.start_time}
                        </p>
                      </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 40px;">
                      <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin: 0;">
                        We wish you a successful and safe market day.<br/>
                        Ensure you arrive early for the best deals!
                      </p>
                    </div>
                  </div>
                  
                  <!-- Footer -->
                  <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                      This notification was generated securely by the<br/>
                      <strong style="color: #64748b;">Market Day Reminder System</strong>.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      Academic Project Implementation by Abdullahi Ibrahim Wushishi
                    </p>
                  </div>
                </div>
              </div>
            `,
          }),
        });

        const status = res.ok ? "success" : "failed";
        let errorMessage = null;
        if (!res.ok) {
          errorMessage = await res.text();
          console.error(`Failed to send email to ${user.email}: ${errorMessage}`);
        } else {
          emailsSent++;
        }

        // Insert into reminder_logs
        await supabaseClient.from("reminder_logs").insert([
          {
            user_id: user.id,
            market_id: market.id,
            channel: "email",
            status: status,
            error_message: errorMessage
          }
        ]);
      }
    }

    return new Response(
      JSON.stringify({ message: `Successfully sent ${emailsSent} reminders.` }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});

