import sys
sys.path.append(r'd:\apps2026\futebol2026\futebol2026_scraper')
import main
import uuid

# 🔧 1. DEFINIÇÕES GERAIS (UUIDs Fixos para não duplicar)
MATCH_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" 
HOME_TEAM_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
AWAY_TEAM_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc"

def popular_banco():
    print("--- 🚀 INICIANDO POPULAÇÃO ROBUSTA (Brasileirão) ---")

    try:
        # 🟢 2. INSERIR OU ATUALIZAR TIMES
        print("\n1. Sincronizando Times...")
        teams = [
            {"id": HOME_TEAM_ID, "name": "Red Bull Bragantino", "flag_url": "https://api.sofascore.app/api/v1/team/1999/image"},
            {"id": AWAY_TEAM_ID, "name": "Botafogo", "flag_url": "https://api.sofascore.app/api/v1/team/1958/image"}
        ]
        main.supabase.table("teams").upsert(teams).execute()
        print("Times atualizados com sucesso!")

        # 🟢 3. INSERIR / ATUALIZAR PARTIDA
        print("\n2. Sincronizando Detalhes da Partida...")
        match_data = {
            "id": MATCH_ID,
            "phase": "Brasileirão - Rodada 8",
            "home_team_id": HOME_TEAM_ID,
            "away_team_id": AWAY_TEAM_ID,
            "home_score": 1,
            "away_score": 1,
            "status": "LIVE",
            "minute": "45'",
            "starts_at": "2026-03-21T18:00:00Z",
            "stadium": "Estádio Nabi Abi Chedid",
            "referee": "Lucas Casagrande",
            "tournament_name": "Brasileirão Betano",
            "home_formation": "4-2-3-1",
            "away_formation": "4-1-3-2"
        }
        main.supabase.table("matches").upsert(match_data).execute()
        print("Detalhes da partida salvos!")

        # 🟢 4. INSERIR ESTATÍSTICAS
        print("\n3. Alimentando Estatísticas...")
        stats = [
            {"match_id": MATCH_ID, "stat_name": "Posse de Bola", "val_home": 69, "val_away": 31},
            {"match_id": MATCH_ID, "stat_name": "Finalizações", "val_home": 4, "val_away": 2},
            {"match_id": MATCH_ID, "stat_name": "Escanteios", "val_home": 3, "val_away": 1},
            {"match_id": MATCH_ID, "stat_name": "Faltas", "val_home": 8, "val_away": 12}
        ]
        main.supabase.table("match_stats").upsert(stats, on_conflict="match_id,stat_name").execute()
        print("Estatísticas salvas!")

        # 🟢 5. INSERIR EVENTOS (TIMELINE / INCIDENTS)
        print("\n4. Alimentando Timeline de Eventos...")
        # Deletar para evitar duplicidades em inserts corridos
        try: main.supabase.table("match_events").delete().eq("match_id", MATCH_ID).execute() 
        except: pass

        events = [
            {"match_id": MATCH_ID, "minute": 5, "type": "varDecision", "description": "VAR: Pênalti não marcado para Botafogo", "team": "away"},
            {"match_id": MATCH_ID, "minute": 8, "type": "goal", "description": "Alex Telles (Gol ⚽)", "team": "away"},
            {"match_id": MATCH_ID, "minute": 15, "type": "goal", "description": "Lucas Barbosa (Gol ⚽)", "team": "home"},
            {"match_id": MATCH_ID, "minute": 30, "type": "card", "description": "Cartão Amarelo para camisa 10", "team": "home"}
        ]
        main.supabase.table("match_events").insert(events).execute()
        print("Linha do tempo salva!")

        # 🟢 6. INSERIR ESCALAÇÕES (LINEUPS)
        print("\n5. Alimentando Escalações (Titulares)...")
        try: main.supabase.table("match_lineups").delete().eq("match_id", MATCH_ID).execute()
        except: pass

        lineups = [
            # Home (RB Bragantino)
            {"match_id": MATCH_ID, "player_name": "Cleiton", "shirt_number": 1, "posture": "starter", "position": "G", "team": "home"},
            {"match_id": MATCH_ID, "player_name": "Hurtado", "shirt_number": 34, "posture": "starter", "position": "D", "team": "home"},
            {"match_id": MATCH_ID, "player_name": "Juninho Capixaba", "shirt_number": 6, "posture": "starter", "position": "D", "team": "home"},
            # Away (Botafogo)
            {"match_id": MATCH_ID, "player_name": "Raúl", "shirt_number": 1, "posture": "starter", "position": "G", "team": "away"},
            {"match_id": MATCH_ID, "player_name": "Alex Telles", "shirt_number": 13, "posture": "starter", "position": "D", "team": "away"},
            {"match_id": MATCH_ID, "player_name": "Nahuel Ferraresi", "shirt_number": 3, "posture": "starter", "position": "D", "team": "away"}
        ]
        main.supabase.table("match_lineups").insert(lineups).execute()
        print("Escalações salvas!")

        print("\n✅ BANCO ALIMENTADO COM SUCESSO PARA TESTES ROBUSTOS!")
        print(f"ID DA PARTIDA PARA SEU APP: {MATCH_ID}")

    except Exception as e:
        print(f"\n❌ ERRO NA POPULAÇÃO: {e}")

if __name__ == "__main__":
    popular_banco()
