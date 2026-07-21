import os
import time
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

def limpar_html(texto):
    if not texto:
        return ""
    try:
        soup = BeautifulSoup(texto, "html.parser")
        return soup.get_text().strip()
    except Exception:
        return str(texto).strip()

def sincronizar_noticias():
    print("📰 [Notícias] Iniciando sincronização do Google RSS Feed...", flush=True)
    try:
        teams = []
        try:
            res_teams = supabase.table("teams").select("name, crest_url").execute()
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

            # 📸 Atribuição do Escudo do Time Relacionado
            image_url = None
            text_to_check = f"{clean_title} {clean_description}".lower()

            if teams:
                for team in teams:
                    team_name = team.get("name", "")
                    crest = team.get("crest_url")
                    if team_name and crest:
                        norm_name = team_name.lower().replace("-mg", "").replace("-sc", "").replace("-pr", "").strip()
                        if len(norm_name) >= 3 and norm_name in text_to_check:
                            image_url = crest
                            break

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
    print("🎥 [Vídeos] Iniciando sincronização do YouTube RSS Feed...", flush=True)
    try:
        feed = feedparser.parse(YOUTUBE_FEED_URL)
        if not feed.entries:
            print("⚠️ [Vídeos] Nenhum vídeo retornado do feed.", flush=True)
            return

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

            title = getattr(entry, "title", "Vídeo do Brasileirão")
            description = getattr(entry, "summary", "Melhores Momentos - Futebol Max TV")

            published_at = datetime.utcnow().isoformat() + "Z"
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                try:
                    dt = datetime(*entry.published_parsed[:6])
                    published_at = dt.isoformat() + "Z"
                except Exception:
                    pass

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
                existing = supabase.table("videos").select("id").eq("external_id", video_id).execute()
                if existing.data:
                    row_id = existing.data[0]["id"]
                    supabase.table("videos").update(payload).eq("id", row_id).execute()
                else:
                    supabase.table("videos").insert(payload).execute()
                synced_count += 1
            except Exception as e:
                print(f"⚠️ [Vídeos] Erro ao salvar vídeo [{title}]: {e}", flush=True)

        print(f"✅ [Vídeos] Concluído! {synced_count} vídeos sincronizados.", flush=True)

    except Exception as e:
        print(f"❌ [Vídeos] Erro ao sincronizar: {e}", flush=True)

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



