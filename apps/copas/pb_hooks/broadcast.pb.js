// ==============================================================================
// ZAPSCORE POCKETBASE COPAS - BROADCAST & AGENT PUSH HOOK
// Endpoint: POST /api/broadcast-push
// ==============================================================================

routerAdd("POST", "/api/broadcast-push", function(c) {
    try {
        var _googleTokenCache = {};
        var data = {};

        // 1. $apis.requestInfo(c) (API nativa PocketBase)
        try {
            var ri = $apis.requestInfo(c);
            if (ri && ri.data && typeof ri.data === "object") {
                data = ri.data;
            }
        } catch (_) {}

        // 2. readerToString no stream do body
        if (!data.body) {
            try {
                if (typeof readerToString === "function") {
                    var raw = "";
                    try { raw = readerToString(c.request().body); } catch (_) {}
                    if (!raw) { try { raw = readerToString(c.request.body); } catch (_) {} }
                    if (!raw) { try { raw = readerToString(c.Request().Body); } catch (_) {} }
                    if (!raw) { try { raw = readerToString(c.Request.Body); } catch (_) {} }
                    if (raw) data = JSON.parse(raw);
                }
            } catch (_) {}
        }

        // 3. c.bind / c.Bind
        if (!data.body) {
            try { c.bind(data); } catch (_) {}
            try { c.Bind(data); } catch (_) {}
        }

        // 4. Query / Form fallbacks defensivos
        var appSlug = (data.appSlug || "").toString().toLowerCase().trim();
        var title = (data.title || "").toString().trim();
        var body = (data.body || "").toString().trim();
        var imageUrl = (data.imageUrl || "").toString().trim();
        var dataPayload = data.dataPayload || {};

        if (!body) {
            try { body = (c.queryParam("body") || "").toString().trim(); } catch (_) {}
            try { if (!body) body = (c.QueryParam("body") || "").toString().trim(); } catch (_) {}
            try { if (!body) body = (c.formValue("body") || "").toString().trim(); } catch (_) {}
            try { if (!body) body = (c.FormValue("body") || "").toString().trim(); } catch (_) {}
        }

        if (!title) {
            try { title = (c.queryParam("title") || "").toString().trim(); } catch (_) {}
            try { if (!title) title = (c.QueryParam("title") || "").toString().trim(); } catch (_) {}
            try { if (!title) title = (c.formValue("title") || "").toString().trim(); } catch (_) {}
            try { if (!title) title = (c.FormValue("title") || "").toString().trim(); } catch (_) {}
        }

        if (!appSlug) {
            try { appSlug = (c.queryParam("appSlug") || "").toString().toLowerCase().trim(); } catch (_) {}
            try { if (!appSlug) appSlug = (c.QueryParam("appSlug") || "").toString().toLowerCase().trim(); } catch (_) {}
            try { if (!appSlug) appSlug = (c.formValue("appSlug") || "").toString().toLowerCase().trim(); } catch (_) {}
            try { if (!appSlug) appSlug = (c.FormValue("appSlug") || "").toString().toLowerCase().trim(); } catch (_) {}
        }

        if (!appSlug) appSlug = "copadonordeste";
        if (!title) title = "⚽ Alerta ZapScore";

        if (!body || body.trim() === "") {
            return c.json(400, {
                success: false,
                error: "O corpo da mensagem ('body') é obrigatório."
            });
        }

        // 1. Criptografia RSA PKCS#1 v1.5 e SHA-256 (compatível com PocketBase / Goja)
        function _base64UrlEncode(bytes) {
            var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            var base64 = "";
            for (var i = 0; i < bytes.length; i += 3) {
                var b1 = bytes[i];
                var b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
                var b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
                base64 += chars.charAt(b1 >> 2);
                base64 += chars.charAt(((b1 & 3) << 4) | (b2 >> 4));
                base64 += i + 1 < bytes.length ? chars.charAt(((b2 & 15) << 2) | (b3 >> 6)) : "=";
                base64 += i + 2 < bytes.length ? chars.charAt(b3 & 63) : "=";
            }
            return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        }

        function _stringToUtf8Bytes(str) {
            var bytes = [];
            for (var i = 0; i < str.length; i++) {
                var code = str.charCodeAt(i);
                if (code < 0x80) {
                    bytes.push(code);
                } else if (code < 0x800) {
                    bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
                } else if (code < 0xd800 || code >= 0xe000) {
                    bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
                } else {
                    i++;
                    code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
                    bytes.push(
                        0xf0 | (code >> 18),
                        0x80 | ((code >> 12) & 0x3f),
                        0x80 | ((code >> 6) & 0x3f),
                        0x80 | (code & 0x3f)
                    );
                }
            }
            return bytes;
        }

        function _base64Decode(str) {
            var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var clean = str.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            var bytes = [];
            var i = 0;
            while (i < clean.length) {
                var enc1 = chars.indexOf(clean.charAt(i++));
                var enc2 = chars.indexOf(clean.charAt(i++));
                var enc3 = chars.indexOf(clean.charAt(i++));
                var enc4 = chars.indexOf(clean.charAt(i++));

                var chr1 = (enc1 << 2) | (enc2 >> 4);
                var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                var chr3 = ((enc3 & 3) << 6) | enc4;

                bytes.push(chr1);
                if (enc3 !== 64 && enc3 !== -1) bytes.push(chr2);
                if (enc4 !== 64 && enc4 !== -1) bytes.push(chr3);
            }
            return bytes;
        }

        function _sha256Bytes(bytes) {
            function rightRotate(value, amount) {
                return (value >>> amount) | (value << (32 - amount));
            }
            var maxWord = Math.pow(2, 32);
            var asciiBitLength = bytes.length * 8;
            var hash = [
                0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
            ];
            var k = [
                0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
                0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
                0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
                0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
                0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
                0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
                0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
                0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
            ];

            var composite = [];
            for (var i = 0; i < bytes.length; i++) {
                composite.push(bytes[i]);
            }
            composite.push(0x80);
            while (composite.length % 64 !== 56) {
                composite.push(0);
            }
            var hi = Math.floor(asciiBitLength / maxWord);
            var lo = asciiBitLength % maxWord;
            composite.push((hi >>> 24) & 0xff, (hi >>> 16) & 0xff, (hi >>> 8) & 0xff, hi & 0xff);
            composite.push((lo >>> 24) & 0xff, (lo >>> 16) & 0xff, (lo >>> 8) & 0xff, lo & 0xff);

            for (var i = 0; i < composite.length; i += 64) {
                var w = [];
                for (var j = 0; j < 16; j++) {
                    w[j] = (composite[i + j * 4] << 24) |
                           (composite[i + j * 4 + 1] << 16) |
                           (composite[i + j * 4 + 2] << 8) |
                           (composite[i + j * 4 + 3]);
                }
                for (var j = 16; j < 64; j++) {
                    var s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
                    var s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
                    w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
                }
                var a = hash[0], b = hash[1], c = hash[2], d = hash[3], e = hash[4], f = hash[5], g = hash[6], h = hash[7];
                for (var j = 0; j < 64; j++) {
                    var S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
                    var ch = (e & f) ^ ((~e) & g);
                    var temp1 = (h + S1 + ch + k[j] + w[j]) | 0;
                    var S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
                    var maj = (a & b) ^ (a & c) ^ (b & c);
                    var temp2 = (S0 + maj) | 0;

                    h = g; g = f; f = e; e = (d + temp1) | 0;
                    d = c; c = b; b = a; a = (temp1 + temp2) | 0;
                }
                hash[0] = (hash[0] + a) | 0;
                hash[1] = (hash[1] + b) | 0;
                hash[2] = (hash[2] + c) | 0;
                hash[3] = (hash[3] + d) | 0;
                hash[4] = (hash[4] + e) | 0;
                hash[5] = (hash[5] + f) | 0;
                hash[6] = (hash[6] + g) | 0;
                hash[7] = (hash[7] + h) | 0;
            }

            var outBytes = [];
            for (var i = 0; i < 8; i++) {
                outBytes.push((hash[i] >>> 24) & 0xff);
                outBytes.push((hash[i] >>> 16) & 0xff);
                outBytes.push((hash[i] >>> 8) & 0xff);
                outBytes.push(hash[i] & 0xff);
            }
            return outBytes;
        }

        function _parsePkcs8Der(der) {
            var offset = 0;
            function readTag() { return der[offset++]; }
            function readLen() {
                var l = der[offset++];
                if (l & 0x80) {
                    var count = l & 0x7f;
                    l = 0;
                    for (var i = 0; i < count; i++) l = (l << 8) | der[offset++];
                }
                return l;
            }

            readTag(); readLen(); // Root Sequence
            readTag(); var verLen = readLen(); offset += verLen; // Version
            readTag(); var algLen = readLen(); offset += algLen; // Algorithm
            readTag(); readLen(); // Octet String wrapper
            readTag(); readLen(); // RSAPrivateKey Sequence
            readTag(); var rsaVerLen = readLen(); offset += rsaVerLen; // RSAPrivateKey Version

            function readInteger() {
                readTag();
                var len = readLen();
                var hex = "";
                for (var i = 0; i < len; i++) {
                    var h = der[offset + i].toString(16);
                    if (h.length === 1) h = "0" + h;
                    hex += h;
                }
                offset += len;
                return BigInt("0x" + (hex || "0"));
            }

            return {
                n: readInteger(),
                e: readInteger(),
                d: readInteger(),
                p: readInteger(),
                q: readInteger(),
                dmp1: readInteger(),
                dmq1: readInteger(),
                iqmp: readInteger()
            };
        }

        function _modPow(base, exp, mod) {
            var res = 1n;
            base = base % mod;
            while (exp > 0n) {
                if (exp % 2n === 1n) {
                    res = (res * base) % mod;
                }
                base = (base * base) % mod;
                exp = exp / 2n;
            }
            return res;
        }

        function _rsaSign(m, rsaKey) {
            var p = rsaKey.p, q = rsaKey.q, dmp1 = rsaKey.dmp1, dmq1 = rsaKey.dmq1, iqmp = rsaKey.iqmp;
            var m1 = _modPow(m % p, dmp1, p);
            var m2 = _modPow(m % q, dmq1, q);
            var h = (iqmp * (m1 - m2)) % p;
            if (h < 0n) h += p;
            return m2 + h * q;
        }

        function _signJwt(payload, serviceAccount) {
            var pem = serviceAccount.private_key
                .replace(/-----BEGIN[^-]+-----/, "")
                .replace(/-----END[^-]+-----/, "")
                .replace(/\s+/g, "");
            var der = _base64Decode(pem);
            var rsaKey = _parsePkcs8Der(der);
            var keyByteLength = 256;

            var header = { alg: "RS256", typ: "JWT" };
            var encodedHeader = _base64UrlEncode(_stringToUtf8Bytes(JSON.stringify(header)));
            var encodedPayload = _base64UrlEncode(_stringToUtf8Bytes(JSON.stringify(payload)));
            var signingInput = encodedHeader + "." + encodedPayload;

            var hash = _sha256Bytes(_stringToUtf8Bytes(signingInput));
            var sha256Prefix = [0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20];
            var t = sha256Prefix.concat(hash);
            var psLen = keyByteLength - t.length - 3;
            var ps = [];
            for (var i = 0; i < psLen; i++) ps.push(0xff);
            var padded = [0x00, 0x01].concat(ps, [0x00], t);

            var hex = "";
            for (var i = 0; i < padded.length; i++) {
                var h = padded[i].toString(16);
                if (h.length === 1) h = "0" + h;
                hex += h;
            }
            var m = BigInt("0x" + hex);
            var sigBigInt = _rsaSign(m, rsaKey);

            var sigHex = sigBigInt.toString(16);
            if (sigHex.length % 2 !== 0) sigHex = "0" + sigHex;
            while (sigHex.length < keyByteLength * 2) {
                sigHex = "00" + sigHex;
            }
            var sigBytes = [];
            for (var i = 0; i < sigHex.length; i += 2) {
                sigBytes.push(parseInt(sigHex.substr(i, 2), 16));
            }
            return signingInput + "." + _base64UrlEncode(sigBytes);
        }

        var _EMBEDDED_FIREBASE_CONFIGS = {
            "copadonordeste": {
                "project_id": "copanordeste-4cf23",
                "client_email": "firebase-adminsdk-fbsvc@copanordeste-4cf23.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGIQKYZLh1zFoR\nT5sfFFWY9MLsN808PxnVoMvvisJl85cfzYXqgtCQyF60T/EfLBJM964euNblwqoB\nr/p1A+nV+M9J6q+5+pKWgz1joeEjPyrBlrbQYCiu1gVVIBS4h63Co/zOfAexFFiU\n7t/46LBMfTm0wpunjHyAXmQOocVVq+zGHid9hqjXbz7OsdehHPBaNCuQmyod9x2D\nSmb5ofi43DgMAYkeUzbxZxlARvoe/JcoT+yDptg9UV+fUWaT/SUjqkcs0r8GLPQV\nuOK70kh2TLtIma/g74apbBwt7KypxIzZZFRnn2gbbS7qpJW8NZIxwb+/eDJzyX19\nijJDosEJAgMBAAECggEAHveNW4rQju7d+/sshGbN+y50Ye3V2O8G524uudW/DSbN\nzdV2cyE3no2Gydl91zCw+pEyyI/83KP4pPNfqtbt/zjYk1XIWgHpU/eWyoIEeZkX\nonLfR4HkEfGXG0c8ndvtA3FUo+RcYmfK8ZpFbPbXiVkAQjmxkPZDBmBadLQBryI9\n0/bk//wnEL329YYzhHTPBquxAEniLueW5mW0Fu6M6YyXieaqQ5KZ4EXr0/nihdGo\nu+GXn4Ne1xxg+Gf0Ns3Whfd5m8QKp2njzsSwvY4VMSTO3fyRgfyo11DTMcM1JFar\n9Xo3x1Qi8WfdhyU77ctRBI0fA41SSjMqASkhIIKNpQKBgQDrIKrg5EEepZwng1Ac\na/9blhgdW5JaDF0RW0Au71zfGh7DsH2h+vgQw1UcFDSlfm2iMG+49zyuIt0DVxeD\nDBty+B5vLUVeJSWbXqUiCa0sjt9llx6KXUD9C1O61yeVPf0ubgWNrNcXgHrBDK01\ndAP/Ffwynq4zuEn3NjxTGERE9QKBgQDXt4n7YcETCPsEXP2sq7BCj7iFMeUBju+4\nC8JBK9yss8CFJWVlXGD61Zjf9xoSZ9WaFwBigYZKWydNOTn99BVfE4w0SbZkddL5\n9CoAbpiHWHKNMxXULrxeZPcoxgF7IC60HqcUBDR+E8g863lm13rDKlBH1ukNOJWn\n+ONix8ifRQKBgFOtFYLhWFdqwo7BSZJD0OWsHbrc6tGHEtvpaIcLgjaXmhk0RxGN\nOhjlGvXaLv4yZxvQNwJRYlPqblMQ/HoTpfUdXd9c8hHWEHMhlIzveqSf19rUk/bT\nxxwGmu6kQR74p5CNcQaBWy6u94CaXU3nksCF93GgTQh07kW/FGrR+QG9AoGAT+Kq\neKu04qW6v9zoHJ/gQGYVAU5+7lrOr6u7HoNtz48pxqUYrbbOO1YKrTZHM3W8hrnp\n7JDm+HZVUaXVshRILdOBYoPBxeZUYThorYxHdCfvFBdNCCzemV5uoWzic4Rxh0aq\nvSDph58v0k+pv8ogrlHnNRODbt/7nB7xpk0yILkCgYEA3li/hZfhiBGuLitfy3x6\nZcoedxwrcicO5SR1/Qzjj5Z8n2Z9TXUmhyrhSTPVSb4Mi7Mmqd5OauPN4masKPak\nPV3wyIPH7Hfk0iggOHztPTC4foGtjPOZ4Hn0FXcXGmnv/Q0Y6TBBwwyLX03z8piP\nc6ulIxDZTfL+nicRVXV7kug=\n-----END PRIVATE KEY-----\n"
            }
        };

        function getGoogleAccessToken(serviceAccount) {
            if (!serviceAccount || !serviceAccount.client_email || !serviceAccount.private_key) {
                return null;
            }
            var projectId = serviceAccount.project_id;
            var now = Math.floor(Date.now() / 1000);

            if (_googleTokenCache && _googleTokenCache[projectId] && _googleTokenCache[projectId].exp > now + 300) {
                return _googleTokenCache[projectId].token;
            }

            var claims = {
                iss: serviceAccount.client_email,
                scope: "https://www.googleapis.com/auth/firebase.messaging",
                aud: "https://oauth2.googleapis.com/token",
                exp: now + 3600,
                iat: now
            };

            var assertion = _signJwt(claims, serviceAccount);
            var bodyString = "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + encodeURIComponent(assertion);

            var res = $http.send({
                url: "https://oauth2.googleapis.com/token",
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: bodyString,
                timeout: 10
            });

            if (res.statusCode === 200 && res.json && res.json.access_token) {
                if (!_googleTokenCache) _googleTokenCache = {};
                _googleTokenCache[projectId] = {
                    token: res.json.access_token,
                    exp: now + (res.json.expires_in || 3600)
                };
                return res.json.access_token;
            }
            console.log("[OAUTH2 ERROR] Status: " + res.statusCode + " | Body: " + (res.raw || JSON.stringify(res.json)));
            return null;
        }

        function getFirebaseConfig(slug) {
            var s = (slug || "copadonordeste").toLowerCase().trim();
            var possibleFiles = [
                "/pb_hooks/service_account_" + s + ".json",
                "/pb_hooks/service_account_copadonordeste.json",
                "/pb_hooks/service_account.json",
                "service_account_copadonordeste.json",
                "service_account.json"
            ];
            for (var f = 0; f < possibleFiles.length; f++) {
                try {
                    if (typeof $os !== "undefined" && typeof $os.readFile === "function") {
                        var rawStr = $os.readFile(possibleFiles[f]);
                        if (rawStr) {
                            var parsed = JSON.parse(rawStr);
                            if (parsed && parsed.private_key && !parsed.private_key.includes("...")) return parsed;
                        }
                    }
                } catch (_) {}
            }
            if (_EMBEDDED_FIREBASE_CONFIGS[s]) return _EMBEDDED_FIREBASE_CONFIGS[s];
            return _EMBEDDED_FIREBASE_CONFIGS["copadonordeste"] || null;
        }

        // 2. Busca Assinantes Ativos
        var subscribers = [];
        try {
            if (typeof $app.findRecordsByFilter === "function") {
                subscribers = $app.findRecordsByFilter("subscriptions", "app_slug = '" + appSlug + "'", "", 2000, 0);
            } else if ($app.dao && typeof $app.dao().findRecordsByFilter === "function") {
                subscribers = $app.dao().findRecordsByFilter("subscriptions", "app_slug = '" + appSlug + "'", "", 2000, 0);
            }
        } catch (errSubs) {
            console.log("[BROADCAST PUSH ERROR] Falha ao buscar assinantes: " + errSubs);
        }

        if (!subscribers || subscribers.length === 0) {
            return c.json(200, {
                success: true,
                message: "Nenhum assinante ativo cadastrado para o app " + appSlug,
                totalSubscribers: 0,
                sentCount: 0
            });
        }

        var config = getFirebaseConfig(appSlug);
        if (!config) {
            return c.json(500, {
                success: false,
                error: "Configuração do Firebase Service Account não encontrada para " + appSlug
            });
        }

        var accessToken = getGoogleAccessToken(config);
        if (!accessToken) {
            return c.json(500, {
                success: false,
                error: "Falha na autenticação OAuth2 com o Google Firebase."
            });
        }

        var sentCount = 0;
        var failedCount = 0;
        var channelId = appSlug + "_live_channel";

        for (var i = 0; i < subscribers.length; i++) {
            var sub = subscribers[i];
            var token = sub.getString("fcm_token");
            if (!token) continue;

            var payload = {
                message: {
                    token: token,
                    notification: {
                        title: title,
                        body: body,
                        image: imageUrl && imageUrl.trim() !== "" ? imageUrl : undefined
                    },
                    data: dataPayload || {},
                    android: {
                        priority: "HIGH",
                        notification: {
                            channel_id: channelId,
                            sound: "default",
                            image: imageUrl && imageUrl.trim() !== "" ? imageUrl : undefined,
                            default_vibrate_timings: true,
                            default_light_settings: true
                        }
                    },
                    apns: {
                        headers: { "apns-priority": "10" },
                        payload: {
                            aps: {
                                sound: "default",
                                badge: 1,
                                "mutable-content": 1
                            }
                        },
                        fcm_options: imageUrl && imageUrl.trim() !== "" ? { image: imageUrl } : undefined
                    }
                }
            };

            var res = $http.send({
                url: "https://fcm.googleapis.com/v1/projects/" + config.project_id + "/messages:send",
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + accessToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                timeout: 10
            });

            if (res.statusCode === 200) {
                sentCount++;
            } else {
                failedCount++;
                if (res.statusCode === 404 || res.statusCode === 403 || (res.json && res.json.error && res.json.error.message === "NotRegistered")) {
                    try {
                        if (typeof $app.deleteRecord === "function") $app.deleteRecord(sub);
                        else if ($app.dao && typeof $app.dao().deleteRecord === "function") $app.dao().deleteRecord(sub);
                    } catch (_) {}
                }
            }
        }

        console.log("[POCKETBASE COPAS BROADCAST 🚀] Título: '" + title + "' | Enviados: " + sentCount + "/" + subscribers.length + " (App: " + appSlug + ")");

        return c.json(200, {
            success: true,
            appSlug: appSlug,
            totalSubscribers: subscribers.length,
            sentCount: sentCount,
            failedCount: failedCount
        });

    } catch (e) {
        console.log("[POCKETBASE COPAS BROADCAST FATAL] " + e);
        return c.json(500, { success: false, error: String(e) });
    }
});
