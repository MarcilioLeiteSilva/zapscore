/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase JS Hook - ZapScore Scorer Agent (Artilharia Reativa)
 * Localização: europa/pb_hooks/scorer_sync.pb.js
 * 
 * Monitora eventos e finalizações de partidas (FT) e aciona o motor de agregação
 * idempotente de artilharia da ZapScore API.
 */

routerAdd("POST", "/api/scorers/recalculate", function(c) {
    try {
        var data = $apis.requestInfo(c).data;
        var leagueId = data.league_id || 39; // Default: Premier League (39)
        var season = data.season || 2026;

        var apiUrl = "https://zapscore-zapscore-api.gtalg3.easypanel.host/competitions/" + leagueId + "/scorers/auto-sync?season=" + season;
        
        var response = $http.send({
            url: apiUrl,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout: 10
        });

        return c.json(response.statusCode, response.json || { message: "Scorer recalculation triggered" });
    } catch (err) {
        return c.json(500, { error: err.toString() });
    }
});
