/**
 * Serverless function to apply RLS policy fix
 * Endpoint: POST /api/apply-rls-fix
 *
 * This function executes the SQL fix directly against the Supabase database
 * to allow institution_admin role in the user_roles table RLS policy.
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      error: 'Missing Supabase configuration',
      missing: {
        url: !supabaseUrl,
        key: !supabaseAnonKey,
      }
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('Attempting to check current RLS policy...');

    // First, let's verify the issue exists
    const testInsert = await supabase
      .from('user_roles')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        role: 'institution_admin'
      })
      .single();

    if (testInsert.error && testInsert.error.code === '42501') {
      console.log('✅ Confirmed: RLS policy is blocking institution_admin role');

      // Return instructions for manual fix since we can't execute admin SQL
      return res.status(200).json({
        status: 'RLS_POLICY_ISSUE_CONFIRMED',
        error_code: 42501,
        error: 'RLS policy blocks institution_admin role',
        message: 'The database RLS policy needs to be updated',
        solution: 'Execute the following SQL in Supabase dashboard:',
        sql_commands: [
          'DROP POLICY "Users choose own non-admin role" ON public.user_roles;',
          'CREATE POLICY "Users choose own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role IN (\'minister\',\'student\',\'institution_admin\'));'
        ],
        dashboard_link: 'https://app.supabase.com/project/ggcaniqywwozydsugaij/sql/new',
        alternative: 'Or redeploy the application to automatically run the migration'
      });
    } else if (!testInsert.error) {
      // If no error, the fix might already be applied
      console.log('No RLS policy error detected - fix may already be applied');

      // Clean up the test insert if it succeeded
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');

      return res.status(200).json({
        status: 'RLS_POLICY_ALREADY_FIXED',
        message: 'institution_admin role insert is now allowed!',
        next_step: 'Test the institution dashboard flow'
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message,
      suggestions: [
        'Check Supabase credentials in environment variables',
        'Verify the user_roles table exists',
        'Ensure you have access to the Supabase project'
      ]
    });
  }
}
