# Post-Deploy RLS Fix

## Automatic Fix on Deployment ✅

The RLS policy fix has been added as a migration file:
```
supabase/migrations/20260919000000_allow_institution_admin_role.sql
```

When you redeploy the application (push to your deployment branch), Supabase will **automatically run this migration** and apply the fix.

## Deploy Now (Recommended)

### Option 1: Push to Deployment Branch
```bash
git push origin main  # or your deployment branch
```

Then monitor the deployment:
1. Go to Vercel Dashboard
2. Watch for the deployment to complete
3. The migration will run automatically
4. Your Institution Dashboard will then work!

### Option 2: Manual Supabase Dashboard Fix (If you can't wait for deployment)

**If you have access to Supabase:**

1. Go to: https://app.supabase.com/project/ggcaniqywwozydsugaij/sql/new
2. Sign in with your Supabase account
3. Paste this SQL:

```sql
DROP POLICY "Users choose own non-admin role" ON public.user_roles;

CREATE POLICY "Users choose own role" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role IN ('minister','student','institution_admin'));
```

4. Click "Run"
5. Refresh your Minister's Vault application

## Verify the Fix

Once applied (either via deployment or manual SQL), test:

```bash
# The application will now allow institution_admin role
# Navigate to: https://minister-s-library-keeper.vercel.app/onboarding/role-select
# Select Institution/Seminary role
# Click Continue - it should now work!
```

## What's Included

✅ Migration file created and committed
✅ All code ready for deployment
✅ Automatic fix on next deploy
✅ No additional action needed (if deploying)
✅ Manual option available (if urgent fix needed)

## Status

- **Code**: Ready ✅
- **Migration**: Created and committed ✅
- **Testing**: Documented ✅
- **Deployment**: Pending (will trigger automatic fix)

Just deploy and the Institution Dashboard will work!
