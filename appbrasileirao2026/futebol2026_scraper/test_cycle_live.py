import sys
sys.path.append(r'd:\apps2026\futebol2026\futebol2026_scraper')
import main

milan_id = 'e5555555-5555-5555-5555-555555555555'
sofa_url = 'https://api.sofascore.com/api/v1/event/13981724'

try:
    print("Atualizando scraper_url no Supabase...", flush=True)
    main.supabase.table("matches").update({"scraper_url": sofa_url}).eq("id", milan_id).execute()
    print("Sucesso: URL Salva no banco de dados!", flush=True)

    print("\nIniciando Ciclo de Raspagem Real (SofaScore)...", flush=True)
    stats, match_info, match_events, match_lineups = main.coletar_fonte_a(milan_id, sofa_url)
    
    if match_info:
        main.salvar_estatisticas(stats, match_info, match_events, match_lineups, milan_id)
        print("\n✅ CICLO REALIZADO COM SUCESSO!", flush=True)
        print(f"Placar Atualizado: {match_info.get('home_score')} x {match_info.get('away_score')}")
        print(f"Estatísticas Capturadas: {len(stats)}")
    else:
        print("❌ Falha na coleta do SofaScore.")

except Exception as e:
    print(f"Erro no teste: {e}", flush=True)
