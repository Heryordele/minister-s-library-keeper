# RLS Policy Fix for institution_admin Role

## Problem
The `user_roles` table in Supabase had an RLS policy that only allowed 'minister' and 'student' roles to be inserted. This prevented users from creating 'institution_admin' role accounts.

## Solution
A migration has been created to fix this issue:
- **File**: `supabase/migrations/20260919000000_allow_institution_admin_role.sql`
- **What it does**: Updates the RLS policy to allow 'institution_admin' role in addition to 'minister' and 'student'

## How to Apply

### Option 1: Automatic (Recommended)
The migration will automatically run when you redeploy the application. No action needed - just push the latest code to your deployment.

### Option 2: Manual (Immediate)
To apply the fix immediately without redeploying:

1. Go to Supabase Dashboard: https://app.supabase.com/project/ggcaniqywwozydsugaij/sql/new
2. Run the following SQL:

```sql
DROP POLICY "Users choose own non-admin role" ON public.user_roles;

CREATE POLICY "Users choose own role" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role IN ('minister','student','institution_admin'));
```

3. Click "Run"

## Verification
After applying the fix, users should be able to:
1. Go to the role selection page
2. Select "Institution/Seminary" role
3. Click "Continue to Setup" successfully
4. See the Institution dashboard after onboarding

## Technical Details
- **Old Policy**: `role IN ('minister','student')`
- **New Policy**: `role IN ('minister','student','institution_admin')`
- **Impact**: Allows institution administrators to set up multi-user library systems
