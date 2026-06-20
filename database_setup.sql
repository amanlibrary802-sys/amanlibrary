-- 1. Create Tables

-- BOOKS TABLE
create table public.books (
    book_id uuid default gen_random_uuid() primary key,
    title text not null,
    author text not null,
    category text not null,
    shelf_loc text,
    status text default 'Available' check (status in ('Available', 'Ordered', 'Issued')),
    total_copies integer default 1,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- STUDENTS TABLE (Profiles)
create table public.students (
    id uuid references auth.users on delete cascade primary key,
    name text not null,
    whatsapp_number text,
    role text default 'student' check (role in ('student', 'admin')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRANSACTIONS TABLE
create table public.transactions (
    transaction_id uuid default gen_random_uuid() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    book_id uuid references public.books(book_id) on delete cascade not null,
    order_date date not null,
    issue_date date,
    return_deadline date,
    returned_at date,
    reminder_sent boolean default false,
    status text default 'Reserved' check (status in ('Reserved', 'Issued', 'Returned', 'Expired')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS (Row Level Security) - Optional but recommended for Supabase
alter table public.books enable row level security;
alter table public.students enable row level security;
alter table public.transactions enable row level security;

-- 3. Create Basic Policies (Allow all for development, refine later)
create policy "Allow all on books" on public.books for all using (true);
create policy "Allow all on students" on public.students for all using (true);
create policy "Allow all on transactions" on public.transactions for all using (true);

-- 4. Seed Books
insert into public.books (title, author, category, shelf_loc, status, total_copies)
values
('Sahih al-Bukhari (Vol 1)', 'Imam Bukhari', 'Religion', 'A1-01', 'Available', 3),
('The Sealed Nectar', 'Safiur Rahman Mubarakpuri', 'Religion', 'A1-02', 'Available', 2),
('Concepts of Physics', 'H.C. Verma', 'Study', 'B1-05', 'Available', 5),
('Organic Chemistry', 'Morrison & Boyd', 'Study', 'B1-06', 'Available', 2),
('A Tale of Two Cities', 'Charles Dickens', 'Literature', 'C1-10', 'Available', 1),
('The Alchemist', 'Paulo Coelho', 'Literature', 'C1-11', 'Available', 3),
('Atomic Habits', 'James Clear', 'Motivation and Psychology', 'D1-04', 'Available', 4),
('Thinking, Fast and Slow', 'Daniel Kahneman', 'Motivation and Psychology', 'D1-05', 'Available', 2),
('Sapiens', 'Yuval Noah Harari', 'History', 'E1-20', 'Available', 1),
('The Discovery of India', 'Jawaharlal Nehru', 'History', 'E1-21', 'Available', 1),
('Wings of Fire', 'A.P.J. Abdul Kalam', 'Auto and Biography', 'F1-08', 'Available', 2),
('The Diary of a Young Girl', 'Anne Frank', 'Auto and Biography', 'F1-09', 'Available', 1),
('A Brief History of Time', 'Stephen Hawking', 'Science', 'G1-15', 'Available', 3),
('Cosmos', 'Carl Sagan', 'Science', 'G1-16', 'Available', 2),
('High School English Grammar', 'Wren & Martin', 'Language', 'H1-02', 'Available', 5),
('Modern Arabic Course', 'V. Abdur Rahim', 'Language', 'H1-03', 'Available', 10),
('Oxford Advanced Learner Dictionary', 'Oxford', 'Dictionary', 'I1-01', 'Available', 2),
('Hans Wehr Arabic-English Dictionary', 'Hans Wehr', 'Dictionary', 'I1-02', 'Available', 1),
('Minhaj al-Talibin', 'Imam al-Nawawi', 'Kithabs', 'K1-01', 'Available', 1),
('Al-Risala', 'Imam al-Shafi''i', 'Kithabs', 'K1-02', 'Available', 1);

-- 5. Note on Admin Creation:
-- To create the admin user, you must first register them in Supabase Auth (via the dashboard or API)
-- and then insert a record into the 'students' table with role='admin'.
