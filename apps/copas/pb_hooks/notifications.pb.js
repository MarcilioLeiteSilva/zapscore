/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase JS Hook - Zapscore Copas Live Match Push Notifications
 * Localização: copas/pb_hooks/notifications.pb.js
 * Suporta: copadonordeste, copadobrasil, copalibertadores
 */

// ==========================================
// 1. Endpoint de Teste e Diagnóstico do JS Hook
// ==========================================

routerAdd("GET", "/api/test-notifications", function(c) {
    try {
        var _googleTokenCache = {};
        var _EMBEDDED_FIREBASE_CONFIGS = {
            "copadonordeste": {
                "project_id": "copanordeste-4cf23",
                "client_email": "firebase-adminsdk-fbsvc@copanordeste-4cf23.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGIQKYZLh1zFoR\nT5sfFFWY9MLsN808PxnVoMvvisJl85cfzYXqgtCQyF60T/EfLBJM964euNblwqoB\nr/p1A+nV+M9J6q+5+pKWgz1joeEjPyrBlrbQYCiu1gVVIBS4h63Co/zOfAexFFiU\n7t/46LBMfTm0wpunjHyAXmQOocVVq+zGHid9hqjXbz7OsdehHPBaNCuQmyod9x2D\nSmb5ofi43DgMAYkeUzbxZxlARvoe/JcoT+yDptg9UV+fUWaT/SUjqkcs0r8GLPQV\nuOK70kh2TLtIma/g74apbBwt7KypxIzZZFRnn2gbbS7qpJW8NZIxwb+/eDJzyX19\nijJDosEJAgMBAAECggEAHveNW4rQju7d+/sshGbN+y50Ye3V2O8G524uudW/DSbN\nzdV2cyE3no2Gydl91zCw+pEyyI/83KP4pPNfqtbt/zjYk1XIWgHpU/eWyoIEeZkX\nonLfR4HkEfGXG0c8ndvtA3FUo+RcYmfK8ZpFbPbXiVkAQjmxkPZDBmBadLQBryI9\n0/bk//wnEL329YYzhHTPBquxAEniLueW5mW0Fu6M6YyXieaqQ5KZ4EXr0/nihdGo\nu+GXn4Ne1xxg+Gf0Ns3Whfd5m8QKp2njzsSwvY4VMSTO3fyRgfyo11DTMcM1JFar\n9Xo3x1Qi8WfdhyU77ctRBI0fA41SSjMqASkhIIKNpQKBgQDrIKrg5EEepZwng1Ac\na/9blhgdW5JaDF0RW0Au71zfGh7DsH2h+vgQw1UcFDSlfm2iMG+49zyuIt0DVxeD\nDBty+B5vLUVeJSWbXqUiCa0sjt9llx6KXUD9C1O61yeVPf0ubgWNrNcXgHrBDK01\ndAP/Ffwynq4zuEn3NjxTGERE9QKBgQDXt4n7YcETCPsEXP2sq7BCj7iFMeUBju+4\nC8JBK9yss8CFJWVlXGD61Zjf9xoSZ9WaFwBigYZKWydNOTn99BVfE4w0SbZkddL5\n9CoAbpiHWHKNMxXULrxeZPcoxgF7IC60HqcUBDR+E8g863lm13rDKlBH1ukNOJWn\n+ONix8ifRQKBgFOtFYLhWFdqwo7BSZJD0OWsHbrc6tGHEtvpaIcLgjaXmhk0RxGN\nOhjlGvXaLv4yZxvQNwJRYlPqblMQ/HoTpfUdXd9c8hHWEHMhlIzveqSf19rUk/bT\nxxwGmu6kQR74p5CNcQaBWy6u94CaXU3nksCF93GgTQh07kW/FGrR+QG9AoGAT+Kq\neKu04qW6v9zoHJ/gQGYVAU5+7lrOr6u7HoNtz48pxqUYrbbOO1YKrTZHM3W8hrnp\n7JDm+HZVUaXVshRILdOBYoPBxeZUYThorYxHdCfvFBdNCCzemV5uoWzic4Rxh0aq\nvSDph58v0k+pv8ogrlHnNRODbt/7nB7xpk0yILkCgYEA3li/hZfhiBGuLitfy3x6\nZcoedxwrcicO5SR1/Qzjj5Z8n2Z9TXUmhyrhSTPVSb4Mi7Mmqd5OauPN4masKPak\nPV3wyIPH7Hfk0iggOHztPTC4foGtjPOZ4Hn0FXcXGmnv/Q0Y6TBBwwyLX03z8piP\nc6ulIxDZTfL+nicRVXV7kug=\n-----END PRIVATE KEY-----\n"
            }
        };

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
            var hash = [
                0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
            ];
            var block = bytes.slice(0);
            var bitLength = bytes.length * 8;
            block.push(0x80);
            while ((block.length % 64) !== 56) {
                block.push(0);
            }
            for (var i = 7; i >= 0; i--) {
                block.push((bitLength >>> (i * 8)) & 0xff);
            }

            var w = new Array(64);
            for (var i = 0; i < block.length; i += 64) {
                for (var j = 0; j < 16; j++) {
                    w[j] = (block[i + j * 4] << 24) |
                           (block[i + j * 4 + 1] << 16) |
                           (block[i + j * 4 + 2] << 8) |
                           (block[i + j * 4 + 3]);
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

            readTag(); readLen();
            readTag(); var verLen = readLen(); offset += verLen;
            readTag(); var algLen = readLen(); offset += algLen;
            readTag(); readLen();
            readTag(); readLen();
            readTag(); var rsaVerLen = readLen(); offset += rsaVerLen;

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

            var n = readInteger();
            var e = readInteger();
            var d = readInteger();
            var p = readInteger();
            var q = readInteger();
            var dmp1 = readInteger();
            var dmq1 = readInteger();
            var iqmp = readInteger();

            return {
                n: n,
                e: e,
                d: d,
                p: p,
                q: q,
                dmp1: dmp1,
                dmq1: dmq1,
                iqmp: iqmp
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

        function getGoogleAccessToken(serviceAccount) {
            if (!serviceAccount || !serviceAccount.client_email || !serviceAccount.private_key) {
                return null;
            }
            var projectId = serviceAccount.project_id;
            var now = Math.floor(Date.now() / 1000);

            if (_googleTokenCache[projectId] && _googleTokenCache[projectId].exp > now + 300) {
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
                _googleTokenCache[projectId] = {
                    token: res.json.access_token,
                    exp: now + (res.json.expires_in || 3600)
                };
                return { token: res.json.access_token };
            }
            return { error: "Google OAuth Error (Status " + res.statusCode + "): " + (res.raw || JSON.stringify(res.json)) };
        }

        function getFirebaseConfig(appSlug) {
            var slug = (appSlug || "copadonordeste").toLowerCase().trim();

            var possibleFiles = [
                "/pb_hooks/service_account_" + slug + ".json",
                "/pb_hooks/service_account.json"
            ];

            for (var f = 0; f < possibleFiles.length; f++) {
                try {
                    if (typeof $os !== "undefined" && typeof $os.readFile === "function") {
                        var rawStr = $os.readFile(possibleFiles[f]);
                        if (rawStr) {
                            var parsed = JSON.parse(rawStr);
                            if (parsed && parsed.private_key && !parsed.private_key.includes("...")) {
                                return parsed;
                            }
                        }
                    }
                } catch (_) {}
            }

            if (_EMBEDDED_FIREBASE_CONFIGS[slug]) {
                return _EMBEDDED_FIREBASE_CONFIGS[slug];
            }
            return _EMBEDDED_FIREBASE_CONFIGS["copadonordeste"] || null;
        }

        var appQuery = "copadonordeste";
        var shouldSend = false;

        try {
            if (typeof c.queryParam === "function") {
                appQuery = (c.queryParam("app") || appQuery).toLowerCase().trim();
                shouldSend = c.queryParam("simulate") === "true";
            }
        } catch (_) {}

        try {
            if (typeof c.QueryParam === "function") {
                appQuery = (c.QueryParam("app") || appQuery).toLowerCase().trim();
                shouldSend = c.QueryParam("simulate") === "true";
            }
        } catch (_) {}

        try {
            if (c.request && c.request.url) {
                var rawQuery = "";
                if (typeof c.request.url.rawQuery === "string") rawQuery = c.request.url.rawQuery;
                else if (typeof c.request.url.RawQuery === "string") rawQuery = c.request.url.RawQuery;
                else if (typeof c.request.url.string === "function") {
                    var fullUrl = c.request.url.string();
                    if (fullUrl.indexOf("?") !== -1) rawQuery = fullUrl.split("?")[1];
                } else if (typeof c.request.url.String === "function") {
                    var fullUrl = c.request.url.String();
                    if (fullUrl.indexOf("?") !== -1) rawQuery = fullUrl.split("?")[1];
                }
                if (rawQuery) {
                    var pairs = rawQuery.split("&");
                    for (var p = 0; p < pairs.length; p++) {
                        var kv = pairs[p].split("=");
                        if (kv[0] === "app" && kv[1]) appQuery = decodeURIComponent(kv[1]).toLowerCase().trim();
                        if (kv[0] === "simulate" && kv[1] === "true") shouldSend = true;
                    }
                }
            }
        } catch (_) {}

        var config = getFirebaseConfig(appQuery);
        if (!config) {
            return c.json(404, {
                status: "error",
                message: "Nenhuma credencial Firebase encontrada para o app: " + appQuery
            });
        }

        var tokenRes = getGoogleAccessToken(config);
        var tokenSuccess = tokenRes && tokenRes.token;

        var subs = [];
        try {
            if (typeof $app.findRecordsByFilter === "function") {
                subs = $app.findRecordsByFilter("subscriptions", "app_slug = '" + appQuery + "'", "", 10, 0);
            }
        } catch (_) {}

        var pushResults = [];
        if (shouldSend && tokenSuccess && subs.length > 0) {
            var channelId = appQuery === "copadonordeste" ? "copadonordeste_live_channel" : (appQuery + "_live_channel");
            for (var s = 0; s < subs.length; s++) {
                var fcmToken = subs[s].getString("fcm_token");
                if (!fcmToken) continue;

                var payload = {
                    message: {
                        token: fcmToken,
                        notification: {
                            title: "🔔 Teste ZapScore Copas",
                            body: "Diagnóstico de Notificações Push Ativo!"
                        },
                        data: {
                            app_slug: appQuery,
                            click_action: "FLUTTER_NOTIFICATION_CLICK"
                        },
                        android: {
                            priority: "high",
                            notification: {
                                channel_id: channelId,
                                default_sound: true
                            }
                        }
                    }
                };

                var r = $http.send({
                    url: "https://fcm.googleapis.com/v1/projects/" + config.project_id + "/messages:send",
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer " + tokenRes.token,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload),
                    timeout: 10
                });

                pushResults.push({
                    deviceId: subs[s].getString("device_id"),
                    statusCode: r.statusCode,
                    response: r.json || r.raw
                });
            }
        }

        return c.json(200, {
            status: "ok",
            app: appQuery,
            googleAuthSuccess: !!tokenSuccess,
            subscribersCount: subs.length,
            sendSimulateTriggered: shouldSend,
            pushResults: pushResults
        });
    } catch (e) {
        return c.json(500, { error: e.toString() });
    }
});

// ==========================================
// 2. Cron Job Principal — Monitoramento de Jogos Copas
// ==========================================

cronAdd("check_copas_live_matches", "*/1 * * * *", function() {
    try {
        var _googleTokenCache = {};
        var _EMBEDDED_FIREBASE_CONFIGS = {
            "copadonordeste": {
                "project_id": "copanordeste-4cf23",
                "client_email": "firebase-adminsdk-fbsvc@copanordeste-4cf23.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGIQKYZLh1zFoR\nT5sfFFWY9MLsN808PxnVoMvvisJl85cfzYXqgtCQyF60T/EfLBJM964euNblwqoB\nr/p1A+nV+M9J6q+5+pKWgz1joeEjPyrBlrbQYCiu1gVVIBS4h63Co/zOfAexFFiU\n7t/46LBMfTm0wpunjHyAXmQOocVVq+zGHid9hqjXbz7OsdehHPBaNCuQmyod9x2D\nSmb5ofi43DgMAYkeUzbxZxlARvoe/JcoT+yDptg9UV+fUWaT/SUjqkcs0r8GLPQV\nuOK70kh2TLtIma/g74apbBwt7KypxIzZZFRnn2gbbS7qpJW8NZIxwb+/eDJzyX19\nijJDosEJAgMBAAECggEAHveNW4rQju7d+/sshGbN+y50Ye3V2O8G524uudW/DSbN\nzdV2cyE3no2Gydl91zCw+pEyyI/83KP4pPNfqtbt/zjYk1XIWgHpU/eWyoIEeZkX\nonLfR4HkEfGXG0c8ndvtA3FUo+RcYmfK8ZpFbPbXiVkAQjmxkPZDBmBadLQBryI9\n0/bk//wnEL329YYzhHTPBquxAEniLueW5mW0Fu6M6YyXieaqQ5KZ4EXr0/nihdGo\nu+GXn4Ne1xxg+Gf0Ns3Whfd5m8QKp2njzsSwvY4VMSTO3fyRgfyo11DTMcM1JFar\n9Xo3x1Qi8WfdhyU77ctRBI0fA41SSjMqASkhIIKNpQKBgQDrIKrg5EEepZwng1Ac\na/9blhgdW5JaDF0RW0Au71zfGh7DsH2h+vgQw1UcFDSlfm2iMG+49zyuIt0DVxeD\nDBty+B5vLUVeJSWbXqUiCa0sjt9llx6KXUD9C1O61yeVPf0ubgWNrNcXgHrBDK01\ndAP/Ffwynq4zuEn3NjxTGERE9QKBgQDXt4n7YcETCPsEXP2sq7BCj7iFMeUBju+4\nC8JBK9yss8CFJWVlXGD61Zjf9xoSZ9WaFwBigYZKWydNOTn99BVfE4w0SbZkddL5\n9CoAbpiHWHKNMxXULrxeZPcoxgF7IC60HqcUBDR+E8g863lm13rDKlBH1ukNOJWn\n+ONix8ifRQKBgFOtFYLhWFdqwo7BSZJD0OWsHbrc6tGHEtvpaIcLgjaXmhk0RxGN\nOhjlGvXaLv4yZxvQNwJRYlPqblMQ/HoTpfUdXd9c8hHWEHMhlIzveqSf19rUk/bT\nxxwGmu6kQR74p5CNcQaBWy6u94CaXU3nksCF93GgTQh07kW/FGrR+QG9AoGAT+Kq\neKu04qW6v9zoHJ/gQGYVAU5+7lrOr6u7HoNtz48pxqUYrbbOO1YKrTZHM3W8hrnp\n7JDm+HZVUaXVshRILdOBYoPBxeZUYThorYxHdCfvFBdNCCzemV5uoWzic4Rxh0aq\nvSDph58v0k+pv8ogrlHnNRODbt/7nB7xpk0yILkCgYEA3li/hZfhiBGuLitfy3x6\nZcoedxwrcicO5SR1/Qzjj5Z8n2Z9TXUmhyrhSTPVSb4Mi7Mmqd5OauPN4masKPak\nPV3wyIPH7Hfk0iggOHztPTC4foGtjPOZ4Hn0FXcXGmnv/Q0Y6TBBwwyLX03z8piP\nc6ulIxDZTfL+nicRVXV7kug=\n-----END PRIVATE KEY-----\n"
            }
        };

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
            var hash = [
                0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
            ];
            var block = bytes.slice(0);
            var bitLength = bytes.length * 8;
            block.push(0x80);
            while ((block.length % 64) !== 56) {
                block.push(0);
            }
            for (var i = 7; i >= 0; i--) {
                block.push((bitLength >>> (i * 8)) & 0xff);
            }

            var w = new Array(64);
            for (var i = 0; i < block.length; i += 64) {
                for (var j = 0; j < 16; j++) {
                    w[j] = (block[i + j * 4] << 24) |
                           (block[i + j * 4 + 1] << 16) |
                           (block[i + j * 4 + 2] << 8) |
                           (block[i + j * 4 + 3]);
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

            readTag(); readLen();
            readTag(); var verLen = readLen(); offset += verLen;
            readTag(); var algLen = readLen(); offset += algLen;
            readTag(); readLen();
            readTag(); readLen();
            readTag(); var rsaVerLen = readLen(); offset += rsaVerLen;

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

            var n = readInteger();
            var e = readInteger();
            var d = readInteger();
            var p = readInteger();
            var q = readInteger();
            var dmp1 = readInteger();
            var dmq1 = readInteger();
            var coeff = readInteger();

            return { n: n, e: e, d: d, p: p, q: q, dmp1: dmp1, dmq1: dmq1, coeff: coeff };
        }

        function _modExp(base, exp, mod) {
            var res = BigInt(1);
            var b = base % mod;
            var x = exp;
            while (x > BigInt(0)) {
                if (x % BigInt(2) === BigInt(1)) res = (res * b) % mod;
                x = x / BigInt(2);
                b = (b * b) % mod;
            }
            return res;
        }

        function _rsaSign(msgBytes, keyObj) {
            var sha = _sha256Bytes(msgBytes);
            var digestInfoPrefix = [
                0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01,
                0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20
            ];
            var t = digestInfoPrefix.concat(sha);
            var kLen = 256;
            var psLen = kLen - t.length - 3;
            var em = [0x00, 0x01];
            for (var i = 0; i < psLen; i++) em.push(0xff);
            em.push(0x00);
            em = em.concat(t);

            var hex = "";
            for (var i = 0; i < em.length; i++) {
                var h = em[i].toString(16);
                if (h.length === 1) h = "0" + h;
                hex += h;
            }
            var m = BigInt("0x" + hex);

            var s;
            if (keyObj.p && keyObj.q && keyObj.dmp1 && keyObj.dmq1 && keyObj.coeff) {
                var m1 = _modExp(m % keyObj.p, keyObj.dmp1, keyObj.p);
                var m2 = _modExp(m % keyObj.q, keyObj.dmq1, keyObj.q);
                var hCrt = (keyObj.coeff * (m1 - m2)) % keyObj.p;
                if (hCrt < BigInt(0)) hCrt += keyObj.p;
                s = m2 + hCrt * keyObj.q;
            } else {
                s = _modExp(m, keyObj.d, keyObj.n);
            }

            var sHex = s.toString(16);
            while (sHex.length < kLen * 2) sHex = "0" + sHex;
            var sigBytes = [];
            for (var i = 0; i < sHex.length; i += 2) {
                sigBytes.push(parseInt(sHex.substr(i, 2), 16));
            }
            return sigBytes;
        }

        function _signJwt(claims, serviceAccount) {
            var header = { alg: "RS256", typ: "JWT" };
            var encodedHeader = _base64UrlEncode(_stringToUtf8Bytes(JSON.stringify(header)));
            var encodedClaims = _base64UrlEncode(_stringToUtf8Bytes(JSON.stringify(claims)));
            var unsignedToken = encodedHeader + "." + encodedClaims;

            var pem = serviceAccount.private_key
                .replace(/-----BEGIN PRIVATE KEY-----/, "")
                .replace(/-----END PRIVATE KEY-----/, "")
                .replace(/[\r\n\s]/g, "");

            var derBytes = _base64Decode(pem);
            var keyObj = _parsePkcs8Der(derBytes);
            var signatureBytes = _rsaSign(_stringToUtf8Bytes(unsignedToken), keyObj);
            var encodedSignature = _base64UrlEncode(signatureBytes);

            return unsignedToken + "." + encodedSignature;
        }

        function getGoogleAccessToken(serviceAccount) {
            if (!serviceAccount || !serviceAccount.client_email || !serviceAccount.private_key) {
                return null;
            }
            var projectId = serviceAccount.project_id;
            var now = Math.floor(Date.now() / 1000);

            if (_googleTokenCache[projectId] && _googleTokenCache[projectId].exp > now + 300) {
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
                _googleTokenCache[projectId] = {
                    token: res.json.access_token,
                    exp: now + (res.json.expires_in || 3600)
                };
                return _googleTokenCache[projectId].token;
            }
            return null;
        }

        function getFirebaseConfig(appSlug) {
            var slug = (appSlug || "copadonordeste").toLowerCase().trim();

            var possibleFiles = [
                "/pb_hooks/service_account_" + slug + ".json",
                "/pb_hooks/service_account.json"
            ];

            for (var f = 0; f < possibleFiles.length; f++) {
                try {
                    if (typeof $os !== "undefined" && typeof $os.readFile === "function") {
                        var rawStr = $os.readFile(possibleFiles[f]);
                        if (rawStr) {
                            var parsed = JSON.parse(rawStr);
                            if (parsed && parsed.private_key && !parsed.private_key.includes("...")) {
                                return parsed;
                            }
                        }
                    }
                } catch (_) {}
            }

            if (_EMBEDDED_FIREBASE_CONFIGS[slug]) {
                return _EMBEDDED_FIREBASE_CONFIGS[slug];
            }
            return _EMBEDDED_FIREBASE_CONFIGS["copadonordeste"] || null;
        }

        function sendFcmMessage(token, title, body, appSlug, eventType, fixtureId) {
            var config = getFirebaseConfig(appSlug);
            if (!config) return { success: false, error: "Sem config do Firebase para " + appSlug };

            var accessToken = getGoogleAccessToken(config);
            if (!accessToken) return { success: false, error: "Falha OAuth2 Google para " + appSlug };

            var channelId = appSlug === "copadonordeste" ? "copadonordeste_live_channel" : (appSlug + "_live_channel");

            var payload = {
                message: {
                    token: token,
                    notification: {
                        title: title,
                        body: body
                    },
                    data: {
                        app_slug: appSlug,
                        event_type: eventType,
                        fixture_id: String(fixtureId),
                        click_action: "FLUTTER_NOTIFICATION_CLICK"
                    },
                    android: {
                        priority: "high",
                        notification: {
                            channel_id: channelId,
                            default_sound: true,
                            default_vibrate_timings: true,
                            default_light_settings: true
                        }
                    },
                    apns: {
                        headers: { "apns-priority": "10" },
                        payload: { aps: { sound: "default", badge: 1 } }
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

            return {
                success: res.statusCode === 200,
                statusCode: res.statusCode,
                json: res.json,
                raw: res.raw
            };
        }

        function executePush(appSlug, leagueName, homeTeamId, awayTeamId, fixtureExtId, eventType, eventTitle, eventBody) {
            var filterStr = "app_slug = '" + appSlug + "'";
            if (eventType === "goal") {
                filterStr += " && notify_goals = true";
            } else if (eventType === "start") {
                filterStr += " && notify_start = true";
            } else if (eventType === "end") {
                filterStr += " && notify_end = true";
            }

            var subscribers = [];
            try {
                if (typeof $app.findRecordsByFilter === "function") {
                    subscribers = $app.findRecordsByFilter("subscriptions", filterStr, "", 2000, 0);
                } else if ($app.dao && typeof $app.dao().findRecordsByFilter === "function") {
                    subscribers = $app.dao().findRecordsByFilter("subscriptions", filterStr, "", 2000, 0);
                }
            } catch (e) {
                console.log("[POCKETBASE COPAS PUSH ERROR] Erro ao buscar subscriptions: " + e);
            }

            if (!subscribers || subscribers.length === 0) {
                console.log("[POCKETBASE COPAS PUSH] [" + leagueName + "] Nenhum assinante ativo para o filtro (" + filterStr + ")");
                return;
            }

            var sentCount = 0;
            for (var j = 0; j < subscribers.length; j++) {
                var sub = subscribers[j];
                var token = sub.getString ? sub.getString("fcm_token") : (sub.get ? sub.get("fcm_token") : sub.fcm_token);
                if (!token) continue;

                function parseListField(record, fieldName) {
                    var raw = record.get(fieldName);
                    if (!raw) return [];
                    var list = [];
                    try {
                        var str = typeof raw === "string" ? raw : JSON.stringify(raw);
                        if (str && str.trim() !== "" && str.trim() !== "[]") {
                            var parsed = JSON.parse(str);
                            if (Array.isArray(parsed)) {
                                for (var p = 0; p < parsed.length; p++) {
                                    var pVal = String(parsed[p]).trim();
                                    if (pVal !== "") list.push(pVal);
                                }
                            }
                        }
                    } catch (_) {}
                    return list;
                }

                var favTeams = parseListField(sub, "favorite_teams");
                var favFixtures = parseListField(sub, "favorite_fixtures");
                var isFavorite = true;

                var hasFilters = favTeams.length > 0 || favFixtures.length > 0;
                if (hasFilters) {
                    isFavorite = false;
                    var fixStr = String(fixtureExtId);
                    for (var fi = 0; fi < favFixtures.length; fi++) {
                        if (favFixtures[fi] === fixStr) {
                            isFavorite = true;
                            break;
                        }
                    }
                    if (!isFavorite) {
                        var hStr = String(homeTeamId);
                        var aStr = String(awayTeamId);
                        for (var ti = 0; ti < favTeams.length; ti++) {
                            if (favTeams[ti] === hStr || favTeams[ti] === aStr) {
                                isFavorite = true;
                                break;
                            }
                        }
                    }
                }

                if (eventType === "start" || eventType === "end" || isFavorite) {
                    var res = sendFcmMessage(token, eventTitle, eventBody, appSlug, eventType, fixtureExtId);
                    if (res.success) {
                        sentCount++;
                    } else if (res.statusCode === 404 || res.statusCode === 403 || (res.json && res.json.error && res.json.error.message === "NotRegistered")) {
                        console.log("[POCKETBASE PURGE 🗑️] Token inválido removido: " + token.substring(0, 15) + "...");
                        try {
                            if (typeof $app.deleteRecord === "function") $app.deleteRecord(sub);
                            else if ($app.dao && typeof $app.dao().deleteRecord === "function") $app.dao().deleteRecord(sub);
                        } catch (_) {}
                    }
                }
            }

            console.log("[POCKETBASE COPAS PUSH 🚀] " + eventType.toUpperCase() + " | " + eventTitle + " | Enviados: " + sentCount + "/" + subscribers.length + " (App: " + appSlug + ")");
        }

        // 1. Busca ligas ativas na coleção 'apps'
        var activeApps = [];
        try {
            if (typeof $app.findRecordsByFilter === "function") {
                activeApps = $app.findRecordsByFilter("apps", "active = true", "", 100, 0);
            } else if ($app.dao && typeof $app.dao().findRecordsByFilter === "function") {
                activeApps = $app.dao().findRecordsByFilter("apps", "active = true", "", 100, 0);
            }
        } catch (e) {
            console.log("[POCKETBASE COPAS CRON ERROR] Erro ao carregar coleção 'apps': " + e);
        }

        var activeAppMap = new Map();
        for (var a = 0; a < activeApps.length; a++) {
            var appRec = activeApps[a];
            var lId = Number(appRec.get("league_id"));
            if (lId) {
                activeAppMap.set(lId, {
                    appSlug: appRec.getString("app_slug") || "copadonordeste",
                    appName: appRec.getString("name") || "Copa do Nordeste",
                    leagueId: lId
                });
            }
        }

        // 2. Consulta jogos ao vivo na ZapScore API
        var response = $http.send({
            url: "https://zapscore-zapscore-api.gtalg3.easypanel.host/fixtures?status=LIVE",
            method: "GET",
            headers: { "Accept": "application/json" },
            timeout: 10
        });

        var allLiveFixtures = (response.statusCode === 200 && Array.isArray(response.json)) ? response.json : [];

        // 3. Filtra apenas jogos das copas ativas
        var copasLiveFixtures = allLiveFixtures.filter(function(f) {
            var leagueExtId = Number(f.league && f.league.externalId ? f.league.externalId : (f.league_id || (f.league && f.league.id) || 0));
            return leagueExtId && activeAppMap.has(leagueExtId);
        });

        var liveFixtureIds = new Set();

        if (copasLiveFixtures.length === 0) {
            console.log("[POCKETBASE COPAS CRON] ℹ️ Nenhuma partida de Copa ao vivo no momento.");
        } else {
            console.log("[POCKETBASE COPAS CRON] ⏱️ Monitorando " + copasLiveFixtures.length + " partida(s) de Copa ao vivo:");
        }

        // 4. Processa cada partida ao vivo
        for (var i = 0; i < copasLiveFixtures.length; i++) {
            var fixture = copasLiveFixtures[i];
            var fixtureExtId = Number(fixture.externalId || fixture.fixture_id || 0);
            if (!fixtureExtId) continue;
            liveFixtureIds.add(fixtureExtId);

            var leagueExtId = Number(fixture.league && fixture.league.externalId ? fixture.league.externalId : (fixture.league_id || (fixture.league && fixture.league.id) || 0));
            var appMeta = activeAppMap.get(leagueExtId);
            if (!appMeta) continue;

            var appSlug = appMeta.appSlug;
            var leagueName = (fixture.league && fixture.league.name) || appMeta.appName || "Copa";

            var homeTeamId = Number(fixture.homeTeam && fixture.homeTeam.externalId ? fixture.homeTeam.externalId : ((fixture.teams && fixture.teams.home && fixture.teams.home.id) || 0));
            var awayTeamId = Number(fixture.awayTeam && fixture.awayTeam.externalId ? fixture.awayTeam.externalId : ((fixture.teams && fixture.teams.away && fixture.teams.away.id) || 0));
            var homeTeamName = (fixture.homeTeam && fixture.homeTeam.name) || (fixture.teams && fixture.teams.home && fixture.teams.home.name) || "Mandante";
            var awayTeamName = (fixture.awayTeam && fixture.awayTeam.name) || (fixture.teams && fixture.teams.away && fixture.teams.away.name) || "Visitante";
            var currentHomeScore = Number(fixture.homeGoals != null ? fixture.homeGoals : (fixture.goals ? fixture.goals.home : 0));
            var currentAwayScore = Number(fixture.awayGoals != null ? fixture.awayGoals : (fixture.goals ? fixture.goals.away : 0));
            var currentStatus = (fixture.statusShort || (fixture.status && fixture.status.short) || "1H").toString();
            var currentElapsed = fixture.elapsed != null ? fixture.elapsed : ((fixture.status && fixture.status.elapsed) || "");
            var elapsedStr = currentElapsed ? " - " + currentElapsed + "'" : "";
            var statusDisplay = currentStatus + elapsedStr;

            console.log("[POCKETBASE COPAS CRON] ⚽ [" + leagueName + "] " + homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName + " (" + statusDisplay + ") - Monitorando...");

            var cacheRecord;
            try {
                cacheRecord = $app.findFirstRecordByData("match_cache", "fixture_id", fixtureExtId);
            } catch (e) {
                cacheRecord = null;
            }

            if (!cacheRecord) {
                var collection = $app.findCollectionByNameOrId("match_cache");
                cacheRecord = new Record(collection);
                cacheRecord.set("fixture_id", fixtureExtId);
                cacheRecord.set("league_id", leagueExtId);
                cacheRecord.set("home_team_id", homeTeamId);
                cacheRecord.set("away_team_id", awayTeamId);
                cacheRecord.set("home_score", currentHomeScore);
                cacheRecord.set("away_score", currentAwayScore);
                cacheRecord.set("status", currentStatus);
                cacheRecord.set("minute", Number(currentElapsed) || 0);

                var titleStart = "🔔 Começou! " + homeTeamName + " x " + awayTeamName;
                var bodyStart = leagueName + " • Bola rolando para o confronto!";
                executePush(appSlug, leagueName, homeTeamId, awayTeamId, fixtureExtId, "start", titleStart, bodyStart);

                if (currentHomeScore > 0 || currentAwayScore > 0) {
                    var titleGoal = "⚽ Placar Atual: " + homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName;
                    var bodyGoal = (currentElapsed ? currentElapsed + "' • " : "") + leagueName;
                    executePush(appSlug, leagueName, homeTeamId, awayTeamId, fixtureExtId, "goal", titleGoal, bodyGoal);
                }

                $app.save(cacheRecord);
                continue;
            }

            var oldHomeScore = Number(cacheRecord.get("home_score") || 0);
            var oldAwayScore = Number(cacheRecord.get("away_score") || 0);
            var oldStatus = (cacheRecord.get("status") || "").toString();

            var goalScored = (currentHomeScore > oldHomeScore) || (currentAwayScore > oldAwayScore);

            if (goalScored) {
                var scoringTeam = (currentHomeScore > oldHomeScore) ? homeTeamName : awayTeamName;
                var titleGoal = "⚽ GOL DO " + scoringTeam.toUpperCase() + "!";
                var bodyGoal = homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName + (currentElapsed ? " (" + currentElapsed + "')" : "") + " • " + leagueName;

                executePush(appSlug, leagueName, homeTeamId, awayTeamId, fixtureExtId, "goal", titleGoal, bodyGoal);
            }

            if (["FT", "AET", "PEN"].indexOf(currentStatus) !== -1 && ["FT", "AET", "PEN"].indexOf(oldStatus) === -1) {
                var titleEnd = "🏁 Fim de Jogo: " + homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName;
                var bodyEnd = "Partida encerrada pela " + leagueName + ". Confira os lances no app!";
                executePush(appSlug, leagueName, homeTeamId, awayTeamId, fixtureExtId, "end", titleEnd, bodyEnd);
            }

            cacheRecord.set("home_score", currentHomeScore);
            cacheRecord.set("away_score", currentAwayScore);
            cacheRecord.set("status", currentStatus);
            cacheRecord.set("minute", Number(currentElapsed) || 0);
            $app.save(cacheRecord);
        }

        // 5. Varredura de partidas finalizadas que saíram do feed LIVE
        var todayResponse = $http.send({
            url: "https://zapscore-zapscore-api.gtalg3.easypanel.host/fixtures/today",
            method: "GET",
            headers: { "Accept": "application/json" },
            timeout: 10
        });

        if (todayResponse.statusCode === 200 && Array.isArray(todayResponse.json)) {
            var todayFixtures = todayResponse.json;
            for (var t = 0; t < todayFixtures.length; t++) {
                var tf = todayFixtures[t];
                var tfExtId = Number(tf.externalId || tf.fixture_id || 0);
                var tfStatus = (tf.statusShort || (tf.status && tf.status.short) || "").toString();

                if (["FT", "AET", "PEN"].indexOf(tfStatus) === -1) continue;

                var tfLeagueId = Number(tf.league && tf.league.externalId ? tf.league.externalId : (tf.league_id || (tf.league && tf.league.id) || 0));
                var tfAppMeta = activeAppMap.get(tfLeagueId);
                if (!tfAppMeta) continue;

                try {
                    var cached = $app.findFirstRecordByData("match_cache", "fixture_id", tfExtId);
                    if (cached) {
                        var cachedStatus = (cached.get("status") || "").toString();
                        if (["FT", "AET", "PEN"].indexOf(cachedStatus) === -1) {
                            var hScore = Number(tf.homeGoals != null ? tf.homeGoals : (tf.goals ? tf.goals.home : 0));
                            var aScore = Number(tf.awayGoals != null ? tf.awayGoals : (tf.goals ? tf.goals.away : 0));
                            var hName = (tf.homeTeam && tf.homeTeam.name) || "Mandante";
                            var aName = (tf.awayTeam && tf.awayTeam.name) || "Visitante";
                            var lName = tfAppMeta.appName || "Copa";

                            var titleEnd = "🏁 Fim de Jogo: " + hName + " " + hScore + " x " + aScore + " " + aName;
                            var bodyEnd = "Partida encerrada pela " + lName + ". Confira os detalhes no app!";
                            executePush(tfAppMeta.appSlug, lName, 0, 0, tfExtId, "end", titleEnd, bodyEnd);

                            cached.set("status", tfStatus);
                            cached.set("home_score", hScore);
                            cached.set("away_score", aScore);
                            $app.save(cached);
                        }
                    }
                } catch (_) {}
            }
        }

    } catch (err) {
        console.log("[POCKETBASE COPAS CRON FATAL ERROR] " + err);
    }
});
