-- 1) Extend roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'service_advisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parts';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';