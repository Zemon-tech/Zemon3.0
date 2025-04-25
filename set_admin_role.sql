-- Set a user as admin
-- Replace 'your-email@example.com' with your actual email

-- First, check if the user exists and get their current role
SELECT id, email, role FROM public.users 
WHERE email = 'your-email@example.com';

-- Update the user's role to admin
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-email@example.com'
RETURNING id, email, role;

-- If you need to set a specific user by ID instead of email:
-- UPDATE public.users
-- SET role = 'admin'
-- WHERE id = 'your-user-id'
-- RETURNING id, email, role; 