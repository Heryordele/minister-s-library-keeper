# Institution Dashboard Testing Guide

## Issue Confirmed ✅

The Supabase RLS policy is blocking institution_admin role inserts:
```
Error: new row violates row-level security policy for table "user_roles"
Code: 42501 (permission denied)
```

## Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
Go to: https://app.supabase.com/project/ggcaniqywwozydsugaij/sql/new

### Step 2: Copy & Paste This SQL
```sql
-- Drop the old restrictive policy
DROP POLICY "Users choose own non-admin role" ON public.user_roles;

-- Create new policy that allows all three roles
CREATE POLICY "Users choose own role" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND role IN ('minister','student','institution_admin'));
```

### Step 3: Click "Run"
You should see: "No rows returned"

## Testing Workflow (After Applying Fix)

### 1. Go to Role Selection
Navigate to: https://minister-s-library-keeper.vercel.app/onboarding/role-select

### 2. Select Institution/Seminary
- Click on the "Institution/Seminary" card (amber border should appear with checkmark)

### 3. Click "Continue to Setup"
Expected: Page navigates to institution onboarding form

### 4. Fill Institution Details
- **Institution Name**: Westminster Theological Seminary
- **Library Name**: Calvin Seminary Library
- **Administrator Email**: admin@wts.edu (optional)

You should see:
- The form displays "Centralize Your Institutional Archive"
- Three access role cards on the right side:
  - Senior Archivist (Admin Access)
  - Faculty Researcher (Read Only)
  - Graduate Student (Limited Access)
- Yellow callout about Strict Archival Mode

### 5. Click "Confirm & Next: Asset Ingestion"
Expected: Page navigates to /reading and displays Institution Dashboard

## Expected Dashboard Display

### Page Title
"Library Dashboard"
Subtitle: "Institutional library and holdings overview."

### Metrics Cards (2x2 grid)
1. **Total Holdings** - Number of books (0 initially)
2. **Currently Borrowed** - Number of books borrowed (0 initially)
3. **Borrowers** - Number of active borrowers (0 initially)
4. **Settings** - Link to Admin Panel

### Administrative Actions Section
Three buttons:
- 📱 Add Books (Scan ISBN)
- 👥 Manage Users
- 📊 View Reports

### Recent Activity Section
"Lending activity and borrower updates will appear here."

### Phase 2 Info Callout
"Institution Setup: Multi-user library management and role-based access coming in Phase 2..."

## Deployment Alternative

If you don't want to apply the fix manually:
1. Just redeploy the application (git push to your deployment branch)
2. The migration will automatically run
3. Everything will work as expected

## Verification

After the fix is applied, you should be able to:
- ✅ Select Institution/Seminary role without errors
- ✅ Navigate through institution onboarding
- ✅ See Institution-specific dashboard
- ✅ Access admin features

## Troubleshooting

If institution role still doesn't work after applying the SQL:
1. Verify you ran both DROP and CREATE commands
2. Check that there are no typos in role names
3. Try refreshing the application (hard refresh: Ctrl+Shift+R)
4. Check browser console for any errors

## Architecture

The institution role system works as follows:
1. User selects "Institution/Seminary" on role-select page
2. Role is inserted into `user_roles` table with `role='institution_admin'`
3. On the reading page, `useUserRole` hook fetches the role
4. If role is 'institution_admin', the `InstitutionDashboard` component renders
5. Dashboard shows institutional-specific metrics and admin features
