import requests
import json

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

def test_endpoint(path_suffix):
    url = f"https://api.sofascore.com/api/v1/event/13981724{path_suffix}"
    try:
        res = requests.get(url, headers=headers)
        print(f"--- {path_suffix} ({res.status_code}) ---")
        if res.status_code == 200:
            print(json.dumps(res.json(), indent=2)[:800]) # 800 chars overview
    except Exception as e:
        print(f"Erro: {e}")

test_endpoint("")               # Details
test_endpoint("/statistics")    # Stats
test_endpoint("/lineups")       # Lineups
