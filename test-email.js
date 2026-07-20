const BREVO_API_KEY = "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";
const SENDER_EMAIL = "abubakarsa242@gmail.com";
const TARGET_EMAIL = "abubakarsa242@gmail.com";

async function testEmail() {
  console.log(`Sending test email to ${TARGET_EMAIL}...`);
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
        "accept": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "Market Day Admin",
          email: SENDER_EMAIL
        },
        to: [
          {
            email: TARGET_EMAIL
          }
        ],
        subject: "Success! Your Email System is Working",
        htmlContent: `
          <h2>It works! 🎉</h2>
          <p>This is a direct test of your Brevo Email configuration.</p>
          <p>If you are reading this, your API Key and Sender Email are perfectly configured and able to send emails.</p>
        `,
      }),
    });

    if (res.ok) {
      console.log("✅ Email sent successfully!");
      const data = await res.json();
      console.log("Response:", data);
    } else {
      console.error("❌ Failed to send email.");
      console.error("Error details:", await res.text());
    }
  } catch (error) {
    console.error("❌ Error during fetch:", error);
  }
}

testEmail();
