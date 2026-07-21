import sys
sys.path.append(r'd:\apps2026\futebol2026\futebol2026_scraper')
import main

milan_id = 'e5555555-5555-5555-5555-555555555555'

try:
    print("Preenchimento Supabase...", flush=True)
    res = main.supabase.table("matches").select("id, home_score, away_score, status, minute, scraper_url").eq("id", milan_id).execute()
    print(f"Result: {res.data}", flush=True)
except Exception as e:
    print(f"Erro: {e}", flush=True)
