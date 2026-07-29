# Minister's Library Keeper

PRODUCT: Minister's Vault — a cloud-based digital library management and reading

accountability platform for ministers, pastors, theological students, and ministry

institutions. Tagline: "Preserving Knowledge. Building Discipline. Protecting Legacy."

CORE VALUE: Ministers catalog their personal libraries, track books lent to others so

they're never lost, and build consistent reading habits through goals, progress tracking,

and streaks.

TARGET USERS (design and copy for these three):

1. Pastor Emmanuel — senior pastor, 40–65, moderate tech proficiency, primarily mobile,

   wants fast cataloging and reliable lending reminders.

2. Sarah — theological student, 20–30, high tech proficiency, budget-conscious, wants

   free-tier value and quick barcode scanning.

3. Grace Bible College Admin — institutional user, needs a shared library and reporting

   view (Phase 2 — do not build yet).

TECH STACK (Lovable defaults, mapped to the PRD's recommended stack):

- Frontend: React + Tailwind CSS + shadcn/ui (fulfills the PRD's Next.js/React frontend intent)

- Backend/DB: Supabase (Postgres) — fulfills the PRD's PostgreSQL requirement

- Auth: Supabase Auth — email/password + Google OAuth (Microsoft auth is Phase 2)

- File storage: Supabase Storage for book cover images and uploaded receipts

CORE DATA MODEL (build these tables first, before any UI):

- users: id, name, email, role (minister/student/institution_admin), plan (free/premium/institutional)

- books: id, owner_id, title, author, isbn, publisher, publication_year, category, edition,

  cover_image_url, purchase_date, purchase_value, reading_status

  (unread/reading/completed), lending_status (available/borrowed/overdue/returned/lost)

- categories: id, name, parent_group

  (seed with: Theology > Systematic/Practical/Biblical; Christian Ministry > Pastoral/Church

  Administration/Leadership Development/Discipleship; Spiritual Growth > Prayer/Revival/Faith/

  Worship; Missions & Evangelism > Evangelism/Church Planting/Cross-Cultural Missions;

  Personal Development > Leadership/Finance/Communication/Productivity; Biography & History >

  Church History/Missionary Biographies/Revival Accounts)

- borrow_records: id, book_id, borrower_name, borrower_phone, borrower_email,

  borrower_organization, date_borrowed, expected_return_date, actual_return_date, status

- reading_goals: id, user_id, period (daily/weekly/monthly/quarterly/annual), target_value,

  target_unit (pages/books), start_date

- reading_progress: id, user_id, book_id, start_page, current_page, total_pages,

  reading_time_minutes, notes, key_lessons, logged_at

- reading_streaks: id, user_id, current_streak_days, longest_streak_days, last_logged_date

- notifications: id, user_id, type (lending_reminder/overdue/habit_nudge), channel

  (email/sms/whatsapp/push), sent_at, message

DESIGN DIRECTION:

- Tone: warm, trustworthy, scholarly — not corporate SaaS, not childish. Think "a well-kept

  study" rather than "a startup dashboard."

- Palette: deep navy/charcoal as the primary color, a warm gold/bronze accent (echoes a

  library/heritage feel), off-white background. Avoid bright primary blues or purples.

- Typography: a serif or slab-serif for headings (gravitas), clean sans-serif for body/UI text.

- The Reading Dashboard is the default landing view for returning logged-in users (per PRD

  FR-013) — not a generic admin dashboard.

RULES FOR EVERY BUILD PROMPT IN THIS PROJECT:

- Do not invent features outside what's explicitly requested in a given prompt.

- Do not touch files/components unrelated to the current prompt's scope.

- Reuse existing components (buttons, cards, forms) instead of creating near-duplicates.

- Every list/table view needs an empty state (e.g., "No books yet — add your first book").

- Mobile-first responsive layout — Pastor Emmanuel's primary device is his phone.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5ec667a3-f85a-4d48-b352-1f80ca8f6d5d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
