-- Normalize notifications schema across environments.
-- Some deployments still have legacy columns (content/priority) without title/message.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'title'
    ) THEN
      ALTER TABLE public.notifications
        ADD COLUMN title text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'message'
    ) THEN
      ALTER TABLE public.notifications
        ADD COLUMN message text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'read'
    ) THEN
      ALTER TABLE public.notifications
        ADD COLUMN read boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'action_url'
    ) THEN
      ALTER TABLE public.notifications
        ADD COLUMN action_url text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'metadata'
    ) THEN
      ALTER TABLE public.notifications
        ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'type'
    ) THEN
      ALTER TABLE public.notifications
        ADD COLUMN type text DEFAULT 'system';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'content'
    ) THEN
      EXECUTE $sql$
        UPDATE public.notifications
        SET
          title = COALESCE(title, 'Notification'),
          message = COALESCE(message, content, 'Notification update')
        WHERE title IS NULL OR message IS NULL
      $sql$;
    ELSE
      UPDATE public.notifications
      SET
        title = COALESCE(title, 'Notification'),
        message = COALESCE(message, 'Notification update')
      WHERE title IS NULL OR message IS NULL;
    END IF;

    ALTER TABLE public.notifications
      ALTER COLUMN title SET DEFAULT 'Notification',
      ALTER COLUMN message SET DEFAULT 'Notification update';
  END IF;
END
$$;
