-- Sample Books across 10 categories

insert into public.books (title, author, category, shelf_loc, status, total_copies)
values
-- Religion
('Sahih al-Bukhari (Vol 1)', 'Imam Bukhari', 'Religion', 'A1-01', 'Available', 3),
('The Sealed Nectar', 'Safiur Rahman Mubarakpuri', 'Religion', 'A1-02', 'Available', 2),
-- Study
('Concepts of Physics', 'H.C. Verma', 'Study', 'B1-05', 'Available', 5),
('Organic Chemistry', 'Morrison & Boyd', 'Study', 'B1-06', 'Available', 2),
-- Literature
('A Tale of Two Cities', 'Charles Dickens', 'Literature', 'C1-10', 'Available', 1),
('The Alchemist', 'Paulo Coelho', 'Literature', 'C1-11', 'Available', 3),
-- Motivation and Psychology
('Atomic Habits', 'James Clear', 'Motivation and Psychology', 'D1-04', 'Available', 4),
('Thinking, Fast and Slow', 'Daniel Kahneman', 'Motivation and Psychology', 'D1-05', 'Available', 2),
-- History
('Sapiens', 'Yuval Noah Harari', 'History', 'E1-20', 'Available', 1),
('The Discovery of India', 'Jawaharlal Nehru', 'History', 'E1-21', 'Available', 1),
-- Auto and Biography
('Wings of Fire', 'A.P.J. Abdul Kalam', 'Auto and Biography', 'F1-08', 'Available', 2),
('The Diary of a Young Girl', 'Anne Frank', 'Auto and Biography', 'F1-09', 'Available', 1),
-- Science
('A Brief History of Time', 'Stephen Hawking', 'Science', 'G1-15', 'Available', 3),
('Cosmos', 'Carl Sagan', 'Science', 'G1-16', 'Available', 2),
-- Language
('High School English Grammar', 'Wren & Martin', 'Language', 'H1-02', 'Available', 5),
('Modern Arabic Course', 'V. Abdur Rahim', 'Language', 'H1-03', 'Available', 10),
-- Dictionary
('Oxford Advanced Learner Dictionary', 'Oxford', 'Dictionary', 'I1-01', 'Available', 2),
('Hans Wehr Arabic-English Dictionary', 'Hans Wehr', 'Dictionary', 'I1-02', 'Available', 1),
-- Kithabs
('Minhaj al-Talibin', 'Imam al-Nawawi', 'Kithabs', 'K1-01', 'Available', 1),
('Al-Risala', 'Imam al-Shafi''i', 'Kithabs', 'K1-02', 'Available', 1);
