-- Migration: add_missing_features
-- Description: Adds tables and functionality needed for the dashboard, global search, and other missing features
-- Created at: 2025-04-21

-- =============================================
-- 1. Expand resource_type enum to support more content types
-- =============================================
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'article';
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'tutorial';
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'spreadsheet';
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'presentation';
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'code_snippet';

-- =============================================
-- 2. Create events table for calendar functionality
-- =============================================
CREATE TYPE event_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  priority event_priority DEFAULT 'medium',
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.events IS 'Stores calendar events and deadlines for the team';

-- Create event_attendees junction table
CREATE TABLE public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
COMMENT ON TABLE public.event_attendees IS 'Junction table connecting events to attendees';

-- =============================================
-- 3. Create KPI tables for dashboard metrics
-- =============================================
CREATE TABLE public.kpi_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  type TEXT NOT NULL CHECK (type IN ('number', 'chart', 'list', 'custom')),
  data_source TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  position INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.kpi_widgets IS 'Stores user dashboard widget configurations';

-- =============================================
-- 4. Create victory_wall table for achievements
-- =============================================
CREATE TABLE public.victory_wall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  achievement_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_team_achievement BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.victory_wall IS 'Stores individual and team achievements for the victory wall';

-- =============================================
-- 5. Create global_search_index for search functionality
-- =============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.global_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.global_search_index IS 'Aggregated content for global search functionality';

-- Create GIN indexes for fast text search
CREATE INDEX global_search_title_idx ON public.global_search_index USING GIN (title gin_trgm_ops);
CREATE INDEX global_search_content_idx ON public.global_search_index USING GIN (content gin_trgm_ops);
CREATE INDEX global_search_type_idx ON public.global_search_index (type);

-- =============================================
-- 6. Create functions for global search
-- =============================================
CREATE OR REPLACE FUNCTION public.search_content(search_term TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  type TEXT,
  url TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gsi.id,
    gsi.title,
    gsi.content,
    gsi.type,
    gsi.url,
    (
      similarity(gsi.title, search_term) * 0.6 + 
      COALESCE(similarity(gsi.content, search_term) * 0.4, 0)
    ) AS similarity
  FROM 
    public.global_search_index gsi
  WHERE 
    gsi.title % search_term OR
    gsi.content % search_term
  ORDER BY 
    similarity DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. Create functions to update search index
-- =============================================
CREATE OR REPLACE FUNCTION public.update_search_index_for_resources()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Delete existing entry if updating
    IF TG_OP = 'UPDATE' THEN
      DELETE FROM public.global_search_index 
      WHERE source_table = 'resources' AND source_id = NEW.id;
    END IF;
    
    -- Insert new entry
    INSERT INTO public.global_search_index (
      source_table, source_id, title, content, type, url
    ) VALUES (
      'resources',
      NEW.id,
      NEW.title,
      NEW.description,
      NEW.type::TEXT,
      NEW.url
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove from search index
    DELETE FROM public.global_search_index 
    WHERE source_table = 'resources' AND source_id = OLD.id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for keeping search index up to date
CREATE TRIGGER resources_search_index_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.resources
  FOR EACH ROW EXECUTE PROCEDURE public.update_search_index_for_resources();

-- =============================================
-- 8. Add timestamps triggers
-- =============================================
CREATE TRIGGER handle_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_event_attendees_updated_at
  BEFORE UPDATE ON public.event_attendees
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_kpi_widgets_updated_at
  BEFORE UPDATE ON public.kpi_widgets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_victory_wall_updated_at
  BEFORE UPDATE ON public.victory_wall
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_global_search_index_updated_at
  BEFORE UPDATE ON public.global_search_index
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- =============================================
-- 9. Add RLS policies
-- =============================================
-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.victory_wall ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_search_index ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view all events" 
ON public.events 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create events" 
ON public.events 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update events they created" 
ON public.events 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team leaders and admins can update any event" 
ON public.events 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role IN ('team_leader', 'admin')
  )
);

CREATE POLICY "Users can delete events they created" 
ON public.events 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

CREATE POLICY "Team leaders and admins can delete any event" 
ON public.events 
FOR DELETE 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role IN ('team_leader', 'admin')
  )
);

-- Event attendees policies
CREATE POLICY "Users can view all event attendees" 
ON public.event_attendees 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can manage their own event attendance" 
ON public.event_attendees 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Event creators can manage attendees" 
ON public.event_attendees 
FOR ALL 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT created_by FROM public.events 
    WHERE id = event_id
  )
);

-- KPI widgets policies
CREATE POLICY "Users can view their own KPI widgets" 
ON public.kpi_widgets 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own KPI widgets" 
ON public.kpi_widgets 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Victory wall policies
CREATE POLICY "Users can view all victory wall entries" 
ON public.victory_wall 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create their own achievements" 
ON public.victory_wall 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" 
ON public.victory_wall 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team leaders and admins can manage any achievement" 
ON public.victory_wall 
FOR ALL 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE role IN ('team_leader', 'admin')
  )
);

-- Global search index policies
CREATE POLICY "Users can search content" 
ON public.global_search_index 
FOR SELECT 
TO authenticated 
USING (true);

-- =============================================
-- 10. Create indexes for performance
-- =============================================
CREATE INDEX events_created_by_idx ON public.events (created_by);
CREATE INDEX events_date_range_idx ON public.events (start_date, end_date);
CREATE INDEX events_priority_idx ON public.events (priority);
CREATE INDEX event_attendees_event_id_idx ON public.event_attendees (event_id);
CREATE INDEX event_attendees_user_id_idx ON public.event_attendees (user_id);
CREATE INDEX event_attendees_status_idx ON public.event_attendees (status);
CREATE INDEX kpi_widgets_user_id_idx ON public.kpi_widgets (user_id);
CREATE INDEX kpi_widgets_type_idx ON public.kpi_widgets (type);
CREATE INDEX victory_wall_user_id_idx ON public.victory_wall (user_id);
CREATE INDEX victory_wall_team_idx ON public.victory_wall (is_team_achievement);
CREATE INDEX global_search_index_source_idx ON public.global_search_index (source_table, source_id);

-- Initial population of search index with existing resources
INSERT INTO public.global_search_index (
  source_table, source_id, title, content, type, url
)
SELECT 
  'resources',
  id,
  title,
  description,
  type::TEXT,
  url
FROM 
  public.resources; 