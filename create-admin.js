const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://slvgrifmpyfwaewzeawn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdmdyaWZtcHlmd2Fld3plYXduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDMwOTc3MiwiZXhwIjoyMDk5ODg1NzcyfQ.Lle70KYTHosUIBTMUQ9Hy_LbFA7ZsQBwcmTf8egnU7I'
);

async function createAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@market.com',
    password: 'admin',
    email_confirm: true
  });
  
  if (error) {
    console.error("Error creating user:", error.message);
  } else {
    console.log("Successfully created admin user:", data.user.email);
  }
}

createAdmin();
