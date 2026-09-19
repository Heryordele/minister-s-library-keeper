/**
 * Vercel serverless function to fix the RLS policy for institution_admin role
 * This function can be called to immediately apply the policy fix without redeploying
 *
 * Usage: POST /api/fix-institution-admin-role
 * Note: Should only be called by administrators
 */

const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for admin authorization header (optional but recommended)
  const adminToken = req.headers['x-admin-token'];
  if (process.env.ADMIN_FIX_TOKEN && adminToken !== process.env.ADMIN_FIX_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: 'Missing Supabase credentials',
      message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to execute the SQL using the raw_sql method (if available)
    // Otherwise, we'll use the workaround method

    console.log('Attempting to update RLS policy for user_roles table...');

    // Method 1: Try using admin API call
    // Note: This requires the service role key to have database admin privileges

    const fixSql = `
      DROP POLICY IF EXISTS "Users choose own non-admin role" ON public.user_roles;

      CREATE POLICY "Users choose own role" ON public.user_roles
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id AND role IN ('minister','student','institution_admin'));
    `;

    // Since direct SQL execution isn't available in supabase-js client,
    // we need to use the Supabase admin API or database connection

    // For now, return instructions on how to apply the fix manually
    return res.status(200).json({
      success: false,
      message: 'Manual SQL execution required',
      reason: 'Direct SQL execution requires database admin access',
      solution: 'Please run the SQL below in the Supabase dashboard SQL editor:',
      sql: fixSql.trim(),
      dashboard_url: 'https://app.supabase.com/project/ggcaniqywwozydsugaij/sql/new',
      note: 'Or redeploy the application to automatically apply the migration'
    });

  } catch (error) {
    console.error('Error attempting RLS policy fix:', error);
    return res.status(500).json({
      error: 'Failed to apply fix',
      message: error.message,
      instructions: 'Please manually apply the fix through Supabase dashboard'
    });
  }
};
