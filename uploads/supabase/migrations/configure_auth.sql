-- Disable email confirmation requirement
update auth.config
set confirm_email = false
where id = 1;

-- Allow users to sign up
update auth.config
set enable_signup = true
where id = 1;

-- Set the minimum password length
update auth.config
set minimum_password_length = 6
where id = 1;

-- Disable email confirmations for password resets
update auth.config
set enable_confirmations = false
where id = 1; 