-- Migration: fix_notifications_schema
-- Description: Safely adds created_by column to notifications table if it doesn't exist
-- Created at: 2025-04-22

-- Check if the column exists before trying to add it
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'notifications'
        AND column_name = 'created_by'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE public.notifications 
        ADD COLUMN created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

        -- Log the change
        RAISE NOTICE 'Added created_by column to notifications table';
    ELSE
        RAISE NOTICE 'created_by column already exists in notifications table';
    END IF;
END $$; 