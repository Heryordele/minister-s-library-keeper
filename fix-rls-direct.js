// Direct SQL execution for fixing the RLS policy
// Run with: node fix-rls-direct.js

const supabaseUrl = 'https://ggcaniqywwozydsugaij.supabase.co';
const projectId = 'ggcaniqywwozydsugaij';

// The SQL commands to fix the RLS policy
const dropPolicySQL = `DROP POLICY IF EXISTS "Users choose own non-admin role" ON public.user_roles;`;
const createPolicySQL = `CREATE POLICY "Users choose own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role IN ('minister','student','institution_admin'));`;

console.log('To fix the RLS policy for institution_admin role:');
console.log('\n1. Go to: https://app.supabase.com/project/' + projectId + '/sql/new');
console.log('\n2. Copy and paste this SQL:');
console.log('\n' + dropPolicySQL);
console.log(createPolicySQL);
console.log('\n3. Click "Run"');
console.log('\nOr redeploy the application to automatically run the migration.');
