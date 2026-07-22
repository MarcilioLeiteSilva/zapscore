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

YOUTUBE_CHANNELS = [
    {"id": "UCgCKagVhzGnZcuP9bSMgMCg", "name": "GE"},
    {"id": "UC3KHYFWeB0WimMBfm3NEahQ", "name": "UOL Esporte"},
    {"id": "UCs-6sCz2LJm1PrWQN4ErsPw", "name": "TNT Sports"},
    {"id": "UC6RD83p2Hlum9aURp3pASeQ", "name": "Prime Video Sport Brasil"}
]

def limpar_html(texto):
    if not texto:
        return ""
    try:
        soup = BeautifulSoup(texto, "html.parser")
        return soup.get_text().strip()
    except Exception:
        return str(texto).strip()

def extrair_imagem_og(url_materia):
    if not url_materia:
        return None
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        res = requests.get(url_materia, headers=headers, timeout=5, allow_redirects=True)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")
            og_image = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "og:image"})
            if og_image and og_image.get("content"):
                img_src = og_image["content"].strip()
                if img_src.startswith("http"):
                    return img_src

            tw_image = soup.find("meta", property="twitter:image") or soup.find("meta", attrs={"name": "twitter:image"})
            if tw_image and tw_image.get("content"):
                img_src = tw_image["content"].strip()
                if img_src.startswith("http"):
                    return img_src
    except Exception:
        pass
    return None

TEAM_NICKNAMES = {
    "flamengo": ["flamengo", "mengão", "mengo", "fla"],
    "palmeiras": ["palmeiras", "verdão", "verdao"],
    "corinthians": ["corinthians", "timão", "timao"],
    "são paulo": ["são paulo", "sao paulo", "tricolor paulista", "spfc"],
    "santos": ["santos", "peixe"],
    "botafogo": ["botafogo", "fogão", "fogao", "bota"],
    "fluminense": ["fluminense", "flu", "tricolor das laranjeiras"],
    "vasco": ["vasco", "gigante da colina", "vascão", "vascao"],
    "grêmio": ["grêmio", "gremio", "tricolor gaúcho", "tricolor gaucho"],
    "internacional": ["internacional", "inter", "colorado"],
    "atlético": ["atlético-mg", "atletico-mg", "atlético mg", "atletico mg", "galo"],
    "cruzeiro": ["cruzeiro", "cabuloso", "raposa"],
    "bahia": ["bahia", "tricolor de aço", "esquadrão"],
    "fortaleza": ["fortaleza", "leão do pici", "leao do pici"],
    "athletico": ["athletico", "furacão", "furacao", "athletico-pr", "atletico-pr"],
    "red bull bragantino": ["bragantino", "red bull", "massa bruta"],
    "juventude": ["juventude", "jove"],
    "cuiabá": ["cuiabá", "cuiaba", "dourado"],
    "vitória": ["vitória", "vitoria", "leão da barra"],
    "criciúma": ["criciúma", "criciuma", "tigre"]
}

def sincronizar_noticias():
    print("📰 [Notícias] Iniciando sincronização do Google RSS Feed...", flush=True)
    try:
        teams = []
        try:
            res_teams = supabase.table("teams").select("name, flag_url, crest_url").execute()
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
            title_raw = getattr(entry, "title", "")
            link = getattr(entry, "link", "")
            summary_raw = getattr(entry, "summary", getattr(entry, "description", title_raw))
            pub_date_str = getattr(entry, "published", "")

            if not title_raw or not link:
                continue

            clean_title = title_raw
            source_name = "Google News"
            if " - " in title_raw:
                parts = title_raw.rsplit(" - ", 1)
                clean_title = parts[0].strip()
                source_name = parts[1].strip()

            clean_description = limpar_html(summary_raw)
            if not clean_description or clean_description == clean_title:
                clean_description = f"Notícia completa sobre {clean_title}."

            # 📸 1ª Opção: Capturar a Foto Real da Matéria na URL original
            image_url = extrair_imagem_og(link)

            # 📸 2ª Opção (Fallback): Escudo do Time Relacionado (flag_url / crest_url)
            if not image_url and teams:
                text_to_check = f"{clean_title} {clean_description}".lower()
                for team in teams:
                    team_name = team.get("name", "")
                    crest = team.get("flag_url") or team.get("crest_url")
                    if not team_name or not crest:
                        continue

                    norm_name = team_name.lower().replace("cr ", "").replace("se ", "").replace("ec ", "").replace("sc ", "").replace("-mg", "").replace("-sc", "").replace("-pr", "").strip()

                    matched = False
                    if len(norm_name) >= 3 and norm_name in text_to_check:
                        matched = True
                    else:
                        for key, nicknames in TEAM_NICKNAMES.items():
                            if key in norm_name or norm_name in key:
                                if any(nick in text_to_check for nick in nicknames):
                                    matched = True
                                    break

                    if matched:
                        image_url = crest
                        break

            # 📸 3ª Opção (Fallback final): Imagem Padrão da Série A
            if not image_url:
                image_url = DEFAULT_NEWS_IMAGE

            try:
                existing = supabase.table("news").select("id, image_url, summary").eq("article_url", link).execute()
                if existing.data:
                    row = existing.data[0]
                    updates = {}
                    if not row.get("image_url") or row.get("image_url") == "null" or row.get("image_url") == DEFAULT_NEWS_IMAGE:
                        if image_url != DEFAULT_NEWS_IMAGE:
                            updates["image_url"] = image_url
                    if not row.get("summary") or row.get("summary") == clean_title:
                        updates["summary"] = clean_description[:300]
                        updates["content"] = clean_description
                    if updates:
                        supabase.table("news").update(updates).eq("id", row["id"]).execute()
                        updated_count += 1
                    continue
            except Exception:
                pass

            try:
                published_at = datetime.utcnow().isoformat() + "Z"
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    try:
                        dt = datetime(*entry.published_parsed[:6])
                        published_at = dt.isoformat() + "Z"
                    except Exception:
                        pass

                payload = {
                    "title": clean_title,
                    "summary": clean_description[:300],
                    "content": clean_description,
                    "article_url": link,
                    "image_url": image_url,
                    "source_name": source_name,
                    "category": "Brasileirão",
                    "published_at": published_at,
                    "is_featured": False
                }

                supabase.table("news").insert(payload).execute()
                inserted_count += 1
            except Exception as e:
                print(f"⚠️ [Notícias] Erro ao inserir item '{clean_title}': {e}", flush=True)

        print(f"✅ [Notícias] Concluído! {inserted_count} novas, {updated_count} atualizadas.", flush=True)

    except Exception as e:
        print(f"❌ [Notícias] Erro ao sincronizar: {e}", flush=True)

def sincronizar_videos():
    print("🎥 [Vídeos] Iniciando sincronização dos canais do YouTube...", flush=True)
    total_synced = 0

    for channel in YOUTUBE_CHANNELS:
        channel_id = channel["id"]
        channel_name = channel["name"]
        feed_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"

        try:
            feed = feedparser.parse(feed_url)
            if not feed.entries:
                print(f"⚠️ [Vídeos] Nenhum vídeo retornado para o canal {channel_name} ({channel_id}).", flush=True)
                continue

            synced_count = 0

            for entry in feed.entries:
                video_id = getattr(entry, "yt_videoid", None)
                if not video_id:
                    entry_id = getattr(entry, "id", "")
                    if "yt:video:" in entry_id:
                        video_id = entry_id.replace("yt:video:", "")
                    elif "watch?v=" in getattr(entry, "link", ""):
                        video_id = entry.link.split("watch?v=")[-1].split("&")[0]

                if not video_id:
                    continue

                title = getattr(entry, "title", "Vídeo de Futebol")
                description = getattr(entry, "summary", f"Conteúdo em vídeo - {channel_name}")

                # 🔍 Filtros de Relevância: Brasileirão + 2026 + (Gols ou Melhores Momentos)
                text_check = f"{title} {description}".lower()

                has_brasileirao = any(term in text_check for term in ["brasileirão", "brasileirao", "campeonato brasileiro"])
                has_2026 = "2026" in text_check

                if not (has_brasileirao and has_2026):
                    continue

                is_gol = any(term in text_check for term in ["gol", "gols", "golaço", "golaços"])
                is_melhores_momentos = any(term in text_check for term in ["melhores momentos", "lances", "resumo"])

                if is_gol:
                    category = "GOLS"
                elif is_melhores_momentos:
                    category = "MELHORES MOMENTOS"
                else:
                    continue

                published_at = datetime.utcnow().isoformat() + "Z"
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    try:
                        dt = datetime(*entry.published_parsed[:6])
                        published_at = dt.isoformat() + "Z"
                    except Exception:
                        pass

                thumbnail_url = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
                video_url = f"https://www.youtube.com/watch?v={video_id}"

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
                    existing = supabase.table("videos").select("id").eq("external_id", video_id).execute()
                    if existing.data:
                        row_id = existing.data[0]["id"]
                        supabase.table("videos").update(payload).eq("id", row_id).execute()
                    else:
                        supabase.table("videos").insert(payload).execute()
                    synced_count += 1
                except Exception as e:
                    print(f"⚠️ [Vídeos] Erro ao salvar vídeo [{title}]: {e}", flush=True)

            total_synced += synced_count
            print(f"  └─ {channel_name}: {synced_count} vídeos sincronizados.", flush=True)

        except Exception as e:
            print(f"❌ [Vídeos] Erro ao sincronizar canal {channel_name}: {e}", flush=True)

    print(f"✅ [Vídeos] Concluído! Total de {total_synced} vídeos sincronizados entre todos os canais.", flush=True)

def main():
    cycle_count = 0
    print("🚀 Serviço de Notícias e Vídeos iniciado com sucesso! (Intervalo: 1 hora)", flush=True)
    
    while True:
        cycle_count += 1
        print(f"\n--- Ciclo #{cycle_count} de Sincronização (1h) ---", flush=True)
        
        sincronizar_noticias()
        sincronizar_videos()

        print("--- Aguardando 1 hora (3600 segundos) para a próxima sincronização ---", flush=True)
        time.sleep(3600)

if __name__ == "__main__":
    main()



