import sys
sys.path.append(r'd:\apps2026\futebol2026\futebol2026_scraper')
import main

milan_id = 'e5555555-5555-5555-5555-555555555555'

try:
    print("--- DIAGNÓSTICO SUPABASE ---", flush=True)
    res = main.supabase.table("matches").select("id, home_score, away_score, status, minute, scraper_url").eq("id", milan_id).execute()
    
    if res.data:
        row = res.data[0]
        print(f"Match ID: {row.get('id')}")
        print(f"Placar atual no Banco: {row.get('home_score')} x {row.get('away_score')}")
        print(f"Status: {row.get('status')}")
        print(f"Minute: {row.get('minute')}")
        print(f"URL Cadastrada: {row.get('scraper_url')}")
        
        url = row.get('scraper_url')
        if not url:
            print("\n❌ ERRO: Nenhuma 'scraper_url' cadastrada para este jogo no Supabase!")
        else:
            print("\n--- TESTANDO COLETA ---", flush=True)
            stats, match_info, match_events, match_lineups = main.coletar_fonte_a(milan_id, url)
            print(f"Resultado Coleta: {match_info}")
    else:
        print("❌ Erro: Partida Milan não encontrada no banco!")

except Exception as e:
    print(f"Erro: {e}", flush=True)
