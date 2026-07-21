# 📖 Documentação - Scraper API SofaScore (Rotas Internas)

Esta documentação descreve as principais rotas públicas da API interna do SofaScore que podem ser consumidas para alimentar o robô de raspagem de placares e estatísticas em tempo real.

---

### 🛡️ **Cabeçalhos Obrigatórios (Headers)**
Sempre envie um `User-Agent` de navegador para evitar bloqueios de segurança (`403 Forbidden`) pelo Cloudflare:

```python
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
```

---

### ⚽ **1. Detalhes Básicos (Placar, Tempo e Status)**
**Endpoint**: `GET https://api.sofascore.com/api/v1/event/{EVENT_ID}`

*   **Finalidade**: Puxar placar, minuto atual e se o jogo está AO VIVO ou ENCERRADO.
*   **Response JSON (Estrutura Principal)**:

```json
{
  "event": {
    "homeTeam": { "name": "Milan" },
    "awayTeam": { "name": "Torino" },
    "homeScore": { "current": 1, "period1": 1 },
    "awayScore": { "current": 1, "period1": 1 },
    "status": {
      "code": 7,
      "description": "2nd half", 
      "type": "inprogress"
    }
  }
}
```

---

### 📊 **2. Estatísticas Detalhadas**
**Endpoint**: `GET https://api.sofascore.com/api/v1/event/{EVENT_ID}/statistics`

*   **Finalidade**: Puxar detalhes como Posse de Bola, Escanteios, Chutes e Faltas de cada lado.
*   **Response JSON (Estrutura Principal)**:

```json
{
  "statistics": [
    {
      "period": "ALL",
      "groups": [
        {
          "groupName": "Team stats",
          "statisticsItems": [
            {
              "name": "Ball possession",
              "home": "51%",
              "away": "49%"
            },
            {
              "name": "Corner kicks",
              "home": "5",
              "away": "2"
            }
          ]
        }
      ]
    }
  ]
}
```

---

### 📋 **3. Escalações (Lineups)**
**Endpoint**: `GET https://api.sofascore.com/api/v1/event/{EVENT_ID}/lineups`

*   **Finalidade**: Puxar formação tática e a lista de jogadores titulares e reservas.
*   **Response JSON (Estrutura Principal)**:

```json
{
  "home": {
    "formation": "4-3-3",
    "players": [
      {
        "player": { "name": "Alisson (G)" },
        "shirtNumber": 1
      }
    ]
  },
  "away": {
    "formation": "4-2-3-1",
    "players": [
      {
        "player": { "name": "Milinkovic" },
        "shirtNumber": 32
      }
    ]
  }
}
```

---

### 🚨 **Como encontrar o `{EVENT_ID}` do Jogo?**
1. Acesse o SofaScore pelo computador.
2. Clique no jogo que você quer obter os dados.
3. Olhe para a Barra de Endereço do navegador (URL).
   * Exemplo: `https://www.sofascore.com/it/torino-milan/UsbsVsb` **##id:13981724**
   * O número isolado **`13981724`** é o ID do evento que você usaria na API!
