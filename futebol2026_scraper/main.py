import os
import time
import requests
import feedparser
from datetime import datetime
from bs4 import BeautifulSoup
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Variáveis SUPABASE_URL ou SUPABASE_KEY não configuradas.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

NEWS_FEED_URL = "https://news.google.com/rss/search?q=Brasileirao+2026&hl=pt-BR&gl=BR&ceid=BR:pt-419"
DEFAULT_NEWS_IMAGE = "https://upload.wikimedia.org/wikipedia/pt/f/f4/Campeonato_Brasileiro_S%C3%A9rie_A_logo.png"

YOUTUBE_CHANNEL_ID = "UCXdss612A2FpMDAalMniSMg"
YOUTUBE_FEED_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={YOUTUBE_CHANNEL_ID}"

def coletar_fonte_a(match_id, scraper_url):
    """
    Consome os endpoints do SofaScore para Placar, Estatísticas, Incidentes e Escalações.
    """
    if not scraper_url: 
        return None, None, [], []

    print(f"Iniciando raspagem SofaScore Expandida para Match: {match_id}...", flush=True)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    base_url = scraper_url.split('/incidents')[0].split('/statistics')[0].split('/lineups')[0]
    
    try:
        # 🟢 1. FETCH PLACAR E STATUS (ENDPOINT BASE)
        res = requests.get(base_url, headers=headers, timeout=10)
        if res.status_code != 200: return None, None, [], []
        data = res.json()
        event = data.get("event", {})

        home_score = event.get("homeScore", {}).get("current", 0)
        away_score = event.get("awayScore", {}).get("current", 0)
        status_info = event.get("status", {})
        status_desc = status_info.get("description", "LIVE")

        match_info = {
            "home_score": home_score,
            "away_score": away_score,
            "minute": status_desc,
            "status": "LIVE" if "half" in status_desc.lower() else "FT"
        }

        time.sleep(1)

        # 🟢 2. FETCH ESTATÍSTICAS REAIS (/statistics)
        stats = []
        try:
            stats_res = requests.get(f"{base_url}/statistics", headers=headers, timeout=10)
            if stats_res.status_code == 200:
                stats_data = stats_res.json().get("statistics", [])
                if stats_data:
                    for group in stats_data[0].get("groups", []):
                        for item in group.get("statisticsItems", []):
                            try:
                                stats.append({
                                    "match_id": match_id,
                                    "stat_name": item.get("name"),
                                    "val_home": int(str(item.get("home", "0")).replace("%", "")),
                                    "val_away": int(str(item.get("away", "0")).replace("%", ""))
                                })
                            except: pass
        except Exception as e:
            print(f"Erro ao ler estatísticas: {e}", flush=True)

        time.sleep(1)

        # 🟢 3. FETCH EVENTOS / TIMELINE (/incidents)
        match_events = []
        try:
            incidents_res = requests.get(f"{base_url}/incidents", headers=headers, timeout=10)
            if incidents_res.status_code == 200:
                for inc in incidents_res.json().get("incidents", []):
                    inc_type = inc.get("incidentType")
                    player = inc.get("player", {}).get("name", "Jogador")
                    time_min = inc.get("time", 0)
                    is_home = inc.get("isHome", True)
                    
                    desc = f"{player}"
                    if inc_type == "goal": desc += " (Gol ⚽)"
                    elif inc_type == "card": desc += f" (Cartão {inc.get('incidentClass', 'amarelo')})"
                    elif inc_type == "substitution": desc = f"Sub: {inc.get('playerOut', {}).get('name')} ➔ {inc.get('playerIn', {}).get('name')}"

                    match_events.append({
                        "match_id": match_id,
                        "minute": time_min,
                        "type": inc_type,
                        "description": desc,
                        "team": "home" if is_home else "away"
                    })
        except Exception as e:
            print(f"Erro ao ler incidentes: {e}", flush=True)

        # 🟢 4. FETCH ESCALAÇÕES REAIS (/lineups)
        match_lineups = []
        try:
            lineups_res = requests.get(f"{base_url}/lineups", headers=headers, timeout=10)
            if lineups_res.status_code == 200:
                lineups_data = lineups_res.json()
                for team_pos in ["home", "away"]:
                    team_data = lineups_data.get(team_pos, {})
                    for p in team_data.get("players", []):
                        player_info = p.get("player", {})
                        match_lineups.append({
                            "match_id": match_id,
                            "player_name": player_info.get("name"),
                            "shirt_number": p.get("shirtNumber", 0),
                            "posture": "starter",
                            "team": team_pos
                        })
        except Exception as e:
            print(f"Erro ao ler escalações: {e}", flush=True)

        print(f"Sucesso SofaScore Expandida: {home_score}x{away_score}. Stats: {len(stats)}. Events: {len(match_events)}. Lineups: {len(match_lineups)}", flush=True)
        return stats, match_info, match_events, match_lineups

    except Exception as e:
        print(f"Erro Crítico na Fonte SofaScore Expandida: {e}", flush=True)
        return None, None, [], []

def salvar_estatisticas(stats, match_info, match_events, match_lineups, match_id):
    if stats:
        try:
            supabase.table("match_stats").upsert(stats, on_conflict="match_id,stat_name").execute()
            print(f"Estatísticas atualizadas para o Match: {match_id}", flush=True)
        except Exception as e:
            print(f"Erro ao salvar stats: {e}", flush=True)
            
    if match_info:
        try:
            dados_filtrados = {k: v for k, v in match_info.items() if v is not None}
            if dados_filtrados:
                supabase.table("matches").update(dados_filtrados).match({"id": match_id}).execute()
        except Exception as e:
            print(f"Erro ao salvar placar: {e}", flush=True)

    if match_events:
        try:
            supabase.table("match_events").insert(match_events).execute()
        except: pass

    if match_lineups:
        try:
            supabase.table("match_lineups").insert(match_lineups).execute()
        except: pass

def sincronizar_noticias():
    print("📰 [Notícias] Iniciando sincronização do Google RSS Feed...", flush=True)
    try:
        teams = []
        try:
            res_teams = supabase.table('teams').select('name, crest_url').execute()
            teams = res_teams.data or []
        except Exception as e:
            print(f"⚠️ [Notícias] Não foi possível carregar times para imagem: {e}", flush=True)

        feed = feedparser.parse(NEWS_FEED_URL)
        if not feed.entries:
            print("⚠️ [Notícias] Nenhum item retornado do feed.", flush=True)
            return

        inserted_count = 0
        updated_count = 0

        for entry in feed.entries:
            title_raw = getattr(entry, 'title', '')
            link = getattr(entry, 'link', '')
            summary = getattr(entry, 'summary', title_raw)
            pub_date_str = getattr(entry, 'published', '')

            if not title_raw or not link:
                continue

            clean_title = title_raw
            source_name = "Google News"
            if ' - ' in title_raw:
                parts = title_raw.rsplit(' - ', 1)
                clean_title = parts[0].strip()
                source_name = parts[1].strip()

            image_url = None
            if hasattr(entry, 'content') and entry.content:
                soup = BeautifulSoup(entry.content[0].value, 'html.parser')
                img_tag = soup.find('img')
                if img_tag and img_tag.get('src'):
                    image_url = img_tag['src']

            if not image_url and teams:
                title_lower = clean_title.lower()
                for team in teams:
                    team_name = team.get('name', '')
                    if team_name:
                        norm_name = team_name.lower().replace('-mg', '').replace('-sc', '').replace('-pr', '').strip()
                        if norm_name in title_lower:
                            image_url = team.get('crest_url')
                            break

            if not image_url:
                image_url = DEFAULT_NEWS_IMAGE

            try:
                existing = supabase.table('news').select('id, image_url').eq('article_url', link).execute()
                if existing.data:
                    row = existing.data[0]
                    if not row.get('image_url') or row.get('image_url') == 'null':
                        supabase.table('news').update({'image_url': image_url}).eq('id', row['id']).execute()
                        updated_count += 1
                    continue
            except Exception as e:
                pass

            try:
                published_at = datetime.utcnow().isoformat() + "Z"
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    try:
                        dt = datetime(*entry.published_parsed[:6])
                        published_at = dt.isoformat() + "Z"
                    except: pass

                payload = {
                    "title": clean_title,
                    "summary": summary[:300] if summary else clean_title,
                    "content": summary,
                    "article_url": link,
                    "image_url": image_url,
                    "source_name": source_name,
                    "category": "Brasileirão",
                    "published_at": published_at,
                    "is_featured": False
                }
                supabase.table('news').insert(payload).execute()
                inserted_count += 1
            except Exception as e:
                print(f"⚠️ [Notícias] Erro ao inserir item '{clean_title}': {e}", flush=True)

        print(f"✅ [Notícias] Concluído! {inserted_count} novas, {updated_count} imagens atualizadas.", flush=True)

    except Exception as e:
        print(f"❌ [Notícias] Erro ao sincronizar: {e}", flush=True)

def sincronizar_videos():
    print("🎥 [Vídeos] Iniciando sincronização do YouTube RSS Feed...", flush=True)
    try:
        feed = feedparser.parse(YOUTUBE_FEED_URL)
        if not feed.entries:
            print("⚠️ [Vídeos] Nenhum vídeo retornado do feed.", flush=True)
            return

        synced_count = 0

        for entry in feed.entries:
            video_id = getattr(entry, 'yt_videoid', None)
            if not video_id:
                entry_id = getattr(entry, 'id', '')
                if 'yt:video:' in entry_id:
                    video_id = entry_id.replace('yt:video:', '')
                elif 'watch?v=' in getattr(entry, 'link', ''):
                    video_id = entry.link.split('watch?v=')[-1].split('&')[0]

            if not video_id:
                continue

            title = getattr(entry, 'title', 'Vídeo do Brasileirão')
            description = getattr(entry, 'summary', 'Melhores Momentos - Futebol Max TV')

            published_at = datetime.utcnow().isoformat() + "Z"
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                try:
                    dt = datetime(*entry.published_parsed[:6])
                    published_at = dt.isoformat() + "Z"
                except: pass

            thumbnail_url = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
            video_url = f"https://www.youtube.com/watch?v={video_id}"

            category = "GOLS" if ("gol" in title.lower() or "gols" in title.lower()) else "MELHORES MOMENTOS"

            payload = {
                "external_id": video_id,
                "title": title,
                "description": description[:300] if description else title,
                "thumbnail_url": thumbnail_url,
                "video_url": video_url,
                "provider": "YOUTUBE",
                "category": category,
                "published_at": published_at,
                "is_featured": True
            }

            try:
                existing = supabase.table('videos').select('id').eq('external_id', video_id).execute()
                if existing.data:
                    row_id = existing.data[0]['id']
                    supabase.table('videos').update(payload).eq('id', row_id).execute()
                else:
                    supabase.table('videos').insert(payload).execute()
                synced_count += 1
            except Exception as e:
                print(f"⚠️ [Vídeos] Erro ao salvar vídeo [{title}]: {e}", flush=True)

        print(f"✅ [Vídeos] Concluído! {synced_count} vídeos sincronizados.", flush=True)

    except Exception as e:
        print(f"❌ [Vídeos] Erro ao sincronizar: {e}", flush=True)

def main():
    cycle_count = 0
    print("🚀 Serviço futebol2026_scraper iniciado com sucesso!", flush=True)
    
    while True:
        cycle_count += 1
        print(f"\n--- Ciclo #{cycle_count} de Raspagem ---", flush=True)
        
        # 🟢 1. RASPAGEM DE PARTIDAS (A cada ciclo - 60s)
        try:
            matches_ativos = []
            try:
                res = supabase.table("matches").select("id, scraper_url, external_id").execute()
                matches_ativos = res.data or []
            except Exception as e_col:
                try:
                    res = supabase.table("matches").select("id, external_id").execute()
                    matches_ativos = res.data or []
                except Exception as e_ext:
                    print(f"Erro ao buscar partidas no banco: {e_ext}", flush=True)

            matches_com_url = 0
            for item in matches_ativos:
                match_id = str(item["id"])
                scraper_url = item.get("scraper_url")
                ext_id = item.get("external_id")

                if not scraper_url and ext_id:
                    if str(ext_id).isdigit():
                        scraper_url = f"https://api.sofascore.com/api/v1/event/{ext_id}"
                    elif str(ext_id).startswith("http"):
                        scraper_url = str(ext_id)

                if not scraper_url:
                    continue

                matches_com_url += 1
                stats, match_info, match_events, match_lineups = coletar_fonte_a(match_id, scraper_url)
                if match_info:
                    salvar_estatisticas(stats, match_info, match_events, match_lineups, match_id)
                else:
                    print(f"Aviso: Coleta SofaScore falhou para Match: {match_id}.", flush=True)

            print(f"Partidas processadas nesta rodada: {matches_com_url}", flush=True)

        except Exception as e:
            print(f"Erro no ciclo de raspagem de partidas: {e}", flush=True)

        # 🟢 2. NOTÍCIAS E VÍDEOS (No ciclo 1 e a cada 15 ciclos ~ 15 min)
        if cycle_count == 1 or cycle_count % 15 == 0:
            print("\n🔄 Disparando sincronização periódica de Notícias e Vídeos...", flush=True)
            sincronizar_noticias()
            sincronizar_videos()

        print("--- Aguardando 60 segundos para o próximo ciclo ---", flush=True)
        time.sleep(60)

if __name__ == "__main__":
    main()


