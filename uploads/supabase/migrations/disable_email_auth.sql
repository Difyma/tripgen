-- Disable email confirmation for all users
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;

-- Set default email confirmation for new users
alter table auth.users
alter column email_confirmed_at
set default now();

-- Enable auto-confirm in auth settings
update auth.config
set value = jsonb_set(value::jsonb, '{mailer_autoconfirm}', 'true'::jsonb)
where value->>'mailer_autoconfirm' is not null;

-- Disable email confirmations in auth settings
update auth.config
set value = jsonb_set(value::jsonb, '{enable_confirmations}', 'false'::jsonb)
where value->>'enable_confirmations' is not null;

-- Disable email notifications
update auth.config
set enable_signup = true,
    mailer_autoconfirm = true,
    enable_confirmations = false
where id = 1;

-- Set minimum password length
update auth.config
set minimum_password_length = 6
where id = 1; 