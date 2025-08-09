-- Only create the missing announcement_replies table
CREATE TABLE IF NOT EXISTS public.announcement_replies (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES public.announcements(id) ON DELETE CASCADE,
    reply_content TEXT NOT NULL,
    created_by UUID REFERENCES public.team_members(id),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_announcement_replies_announcement ON announcement_replies(announcement_id);

-- Insert some sample replies for testing
INSERT INTO announcement_replies (announcement_id, reply_content, created_by, is_public) 
SELECT 
    a.id,
    'Thank you for this important update!',
    tm.id,
    true
FROM announcements a
CROSS JOIN team_members tm
WHERE a.id IN (SELECT id FROM announcements LIMIT 1)
AND tm.role = 'sales_associate'
LIMIT 1
ON CONFLICT DO NOTHING;
