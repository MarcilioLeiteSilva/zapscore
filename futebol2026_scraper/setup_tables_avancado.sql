-- 🏟️ 1. Expandir Tabela `matches` para informações extras
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS referee VARCHAR(100);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS tournament_name VARCHAR(100);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS round INT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS home_formation VARCHAR(20);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS away_formation VARCHAR(20);

-- ⏱️ 2. Tabela de Timeline (Eventos)
CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL,
    minute INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'goal', 'card', 'substitution', 'varDecision'
    description TEXT NOT NULL,
    team VARCHAR(20) NOT NULL, -- 'home' ou 'away'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📋 3. Tabela de Escalações (Lineups)
CREATE TABLE IF NOT EXISTS public.match_lineups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    shirt_number INT,
    posture VARCHAR(20), -- 'starter' ou 'bench'
    position VARCHAR(10), -- 'G', 'D', 'M', 'F'
    team VARCHAR(20) NOT NULL, -- 'home' ou 'away'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
