/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase JS Hook - Zapscore Estaduais Live Match Push Notifications
 * Localização: estaduais/pb_hooks/notifications.pb.js
 */

// ==========================================
// 1. Endpoint de Teste e Diagnóstico do JS Hook
// ==========================================

routerAdd("GET", "/api/test-notifications", function(c) {
    try {
        var _googleTokenCache = {};
        var _EMBEDDED_FIREBASE_CONFIGS = {
            "campeonato_carioca": {
                "project_id": "appcarioca",
                "client_email": "firebase-adminsdk-fbsvc@appcarioca.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAoO31UqaAYJfC\nR2jV7njHjjpAOHpU+PJPCDbGkGX5EYZTL4HJINt6yRUWWfhgPLfo1AoHQ8ztfMqQ\nlcvdhFta8rnW0JL8zJD8i4gcYOJsz5bnndKPNZQoJYtd5YRDcXm4RvYqrDxRSSuo\nZvvUk5RVP7nP2s3vAG4nyEUaTbcQHIteYJzq2HsTYCOSEBcvFBjfsahW2LQdaCdd\nB3Jk5T8YMGVwZ6t7UCEJqSg95YTLzXgLOERGF7LKpF0KLuyECWikwOabD7xMpccW\nZyueKXdIDpCu9ZSD5bbwc4J+CIRWAC1le02eGBJa2WVBiTnlhGYBu5rj5Qped+ga\n2f8RjcGJAgMBAAECggEAAa8mhXeUhxjRGty++Ofd3HjM35Te1PFcRP6gY/oNOjFC\nCGYo71Y/NQKfEZP1zPma7gk0kT2xg/4MU1lL8ALhPZlTsKIgNt+fAOZDaWQbdrIV\n8q55kdD5G6TAZDDGiERsuQS90D+zQ06teAp2dzRXHquw9zVFiapqTCS/HezCBf0F\n/ebKhbbf8vEwPy5yU4o1HsaD+HhEzhD40Hm8SuzVwffnANfYKJHCYvqH1Ty3QbVc\nqj5o2kwqZAVwfmIqF/czu3K57rJxe0WWThGBo8gWt1XIeEzX6gMcz3zm5o5gTWRj\nkm0iFpBjmFmhEm0oQXP1Su4c6Ft0zWGgzXauDBSAxQKBgQD54siayvnSE+bu2FgG\nLHJVa0SEVJIT5Wso219MNkf7HlGwFikCV8juNSWJeYS9/yLY8ZIbvCmv5O6MYc4r\nbEn1gXYQekPlTgJdShSbHIDvGlqhMYHmdBiqbc/aiKpXbwnwinSCf2+IOK8sNLQc\nED6cTSVJ+JW1Vst1phbV6ZnVnwKBgQDFV4CWOg1GV99uo/bVmIIx0J+9Qg6oHGNb\nroj6jNN3cU9OtXRFxUvMMJYFoNaA6eCDk5WVro6KoeB5nc7kxsAIEanUJuIZPn73\nlB0VEaPXg7TqidJMuucKdHiXq4blE1SFwwhZxm5jYYGZ+YTW+HjVXxKXTIsg1Iyk\n5nk3HPwH1wKBgQDlvBXqGgorlZiOpd/nbR2AYqoPbyENobIvUd//VThAKtO3K+hv\n+v0D42CrT0k21EXZZd6KGSfKSpL2BUVirqAgUfGVnJKnUlziH6VqJX50VKpV4Aop\nMTssFOEvbM4OrEtbFi+fekGz30lNPvcHhffKAzLxGtWobi+H7ja4W5fOyQKBgCBW\nNVDolFJJhehIX+MiSXtGN1a441Pyyuk0EWgU+XXiEF/SZgokyUXdVEf50gxvxoV\nAqLzZpIa8oCbNlLQqpjn5A9Ki9QdJIsHLzjLmjBveY7RJK/EFKXm7ffUeJdC8p+0\nlMK5PE92o9kKRRVAw/Qazx4Rwd6QVbeTuJsqWbYjAoGBAM3zg2QOxwEF+ajBjYS4\nkUKKV9Hn+u2EUUd/eGm7SgwuduijkcXG0FDoJc5tTgx5ZQHUXwqlXEKUQKbd60aC\nq7oKCwWXnkic1K8b5et1aOHTqCZ7Z9z1mmvNRj+HfVOXMOF7J+1OootkYCGKiGk/\n523Z8flDBSAUYfmSjBgSK6i5\n-----END PRIVATE KEY-----\n"
            },
            "appcarioca": {
                "project_id": "appcarioca",
                "client_email": "firebase-adminsdk-fbsvc@appcarioca.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAoO31UqaAYJfC\nR2jV7njHjjpAOHpU+PJPCDbGkGX5EYZTL4HJINt6yRUWWfhgPLfo1AoHQ8ztfMqQ\nlcvdhFta8rnW0JL8zJD8i4gcYOJsz5bnndKPNZQoJYtd5YRDcXm4RvYqrDxRSSuo\nZvvUk5RVP7nP2s3vAG4nyEUaTbcQHIteYJzq2HsTYCOSEBcvFBjfsahW2LQdaCdd\nB3Jk5T8YMGVwZ6t7UCEJqSg95YTLzXgLOERGF7LKpF0KLuyECWikwOabD7xMpccW\nZyueKXdIDpCu9ZSD5bbwc4J+CIRWAC1le02eGBJa2WVBiTnlhGYBu5rj5Qped+ga\n2f8RjcGJAgMBAAECggEAAa8mhXeUhxjRGty++Ofd3HjM35Te1PFcRP6gY/oNOjFC\nCGYo71Y/NQKfEZP1zPma7gk0kT2xg/4MU1lL8ALhPZlTsKIgNt+fAOZDaWQbdrIV\n8q55kdD5G6TAZDDGiERsuQS90D+zQ06teAp2dzRXHquw9zVFiapqTCS/HezCBf0F\n/ebKhbbf8vEwPy5yU4o1HsaD+HhEzhD40Hm8SuzVwffnANfYKJHCYvqH1Ty3QbVc\nqj5o2kwqZAVwfmIqF/czu3K57rJxe0WWThGBo8gWt1XIeEzX6gMcz3zm5o5gTWRj\nkm0iFpBjmFmhEm0oQXP1Su4c6Ft0zWGgzXauDBSAxQKBgQD54siayvnSE+bu2FgG\nLHJVa0SEVJIT5Wso219MNkf7HlGwFikCV8juNSWJeYS9/yLY8ZIbvCmv5O6MYc4r\nbEn1gXYQekPlTgJdShSbHIDvGlqhMYHmdBiqbc/aiKpXbwnwinSCf2+IOK8sNLQc\nED6cTSVJ+JW1Vst1phbV6ZnVnwKBgQDFV4CWOg1GV99uo/bVmIIx0J+9Qg6oHGNb\nroj6jNN3cU9OtXRFxUvMMJYFoNaA6eCDk5WVro6KoeB5nc7kxsAIEanUJuIZPn73\nlB0VEaPXg7TqidJMuucKdHiXq4blE1SFwwhZxm5jYYGZ+YTW+HjVXxKXTIsg1Iyk\n5nk3HPwH1wKBgQDlvBXqGgorlZiOpd/nbR2AYqoPbyENobIvUd//VThAKtO3K+hv\n+v0D42CrT0k21EXZZd6KGSfKSpL2BUVirqAgUfGVnJKnUlziH6VqJX50VKpV4Aop\nMTssFOEvbM4OrEtbFi+fekGz30lNPvcHhffKAzLxGtWobi+H7ja4W5fOyQKBgCBW\nNVDolFJJhehIX+MiSXtGN1a441Pyyuk0EWgU+XXiEF/SZgokyUXdVEf50gxvxoV\nAqLzZpIa8oCbNlLQqpjn5A9Ki9QdJIsHLzjLmjBveY7RJK/EFKXm7ffUeJdC8p+0\nlMK5PE92o9kKRRVAw/Qazx4Rwd6QVbeTuJsqWbYjAoGBAM3zg2QOxwEF+ajBjYS4\nkUKKV9Hn+u2EUUd/eGm7SgwuduijkcXG0FDoJc5tTgx5ZQHUXwqlXEKUQKbd60aC\nq7oKCwWXnkic1K8b5et1aOHTqCZ7Z9z1mmvNRj+HfVOXMOF7J+1OootkYCGKiGk/\n523Z8flDBSAUYfmSjBgSK6i5\n-----END PRIVATE KEY-----\n"
            },
            "campeonato_mineiro": {
                "project_id": "appmineiro",
                "client_email": "firebase-adminsdk-fbsvc@appmineiro.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLDBKgcIAj/qPb\nmK0w1coU/5K6EcFfn529PQFGMW8pAq6qj6AZroSf9yYrm0+fdmN+OMvXixm1z753\n/N+G9PrslE1yjsZcuyzWB9NHCiyhwcdmhNDKlgW+7m5N2R/Wawd0E+6b1cJ7bZJG\n/eHHj9rJ6Rfi19fXYCjgDpMVnhh02bTgBWSzVIxgLd8wNVFrdks0Qyerr2L2AvDk\nNWNIjgsbjr72/BP33ueNzJPESvtrGmd3UUpVbfkuax/g07deFWyynci7p3HT9P/z\n3+heuu6dQQbND3aKrUsAr/LCcZPRqZGasvd/D+qS3ZEnNnMcK2WU+7BV7CL3R/4w\nK41ujeofAgMBAAECggEARexlabz0U/D4KsJ8OgoVqn+M3ukIZ87G+olMrAiQGFZl\nIjWN0+pGn/PzwCafF/IkNy6F/DdZ5kOhex6pN4eb9eboeN/0LbEDsr1FI/y7/ASI\nj6SDZpCdb/AaKlLwZN281lua2y2U6P6F1k7N9vRySwAriqH8IZ5q1SYPvu0PzQUi\nsY0cURsTfQhDHjwa9V7ZmSGBRKfHgESOu64ncf/OetugZQa2HL2s/OPjh6Gm/qUN\n0RZqycLysvSZNT6w/UbD2KJzEu959GlW/O8RrCR0UHVFM/EAszKyI35P1YGt2RSj\nfdqx+iihuPMM6ELvCgzR1mj8EL5OCjwSb+Fw/6uQ2QKBgQDyhjyb8xnxVEeYbmGn\ncO0yUTxehgorFyn+cSl4nrQl6QJS1TqlkN5EpSG9NCn5QKMQxT0ZZ7u/rTU+Myjz\nOsnffZMvAmCdMidHqPDAMDa/oxI9nPUUU+/PPQqWw1j/uk6YNP+X1YOopXNr6/p0\ni79ctjgOaGSIfyOPt+1EJWnwqwKBgQDWVEvpIfeP07hy8ZzAF5NlojvyIKGZGiL4\nr3MC/hHsm7VMtziTlF2SlHJvnpPttgqIDCDUISPAXNdqTndp7WsvkPYvuBc8lJu8\n9oH2YjGOU9TFkSyPJwl3YjoqE/j+3ZR6CFWaYvnpXbZ8QzujrEVJy3uttHhiMMsq\neBAtqgx0XQKBgCz6/qTB6s7ancjEuDHw/N03OeYiICKr0isR2+o2LR1W4Qpx58Wr\nX74FjoNj+GD1PwkuO83JcoXzXwuhO3gZMDXWOYUfgMHG+ogM6lIK3yyd1xU8Viwm\nATVDkgIySwBrEoaiVcFYZWnS/dxHURVqkdxlI3JwpCy4v+S47TWVZtevAoGAUVFA\nT96cT8xzYeD7qQII4XmxJsdsqGr7M8FVcKA26r+VBNtLMusKqY9675CJ7Zmw2zdG\nyVUdfGF9NY85zU3P6gck8Kv23PxBLmuUmYdd5/M0ehT/g/y6obn5+XcEdKZbLAW3\nfNDqorj0gKb9nLbCvyHd9eTP++kpXB6bfMfU290CgYEAjmkijMoUlsjIg1/iFPWC\nov+Ua4EcKLUHPLTDNzMz08neT6F4WpuzQQ/fvFyxiFUnzoe+6o7yP7ZOLCXsE/Xg\n84LNfoyzkoARNwjoQBN32rwoiabPEefrX0g/kUYAID1N8D554vIGnFvmlhP6LZpj\ncr324vviJAH1/yTKJx0N5a0=\n-----END PRIVATE KEY-----\n"
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
            var slug = (appSlug || "campeonato_carioca").toLowerCase().trim();

            var possibleFiles = [
                "/pb_hooks/service_account_" + slug + ".json",
                "/pb_hooks/service_account_campeonato_mineiro.json",
                "/pb_hooks/service_account_campeonato_paulista.json",
                "/pb_hooks/service_account_campeonato_carioca.json",
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
            return _EMBEDDED_FIREBASE_CONFIGS["campeonato_carioca"] || null;
        }

        function sendFcmPush(appSlug, token, title, body, dataPayload) {
            var config = getFirebaseConfig(appSlug);
            if (!config) return { success: false, message: "Firebase config not found for " + appSlug };

            var tokenResult = getGoogleAccessToken(config);
            if (!tokenResult || !tokenResult.token) {
                return { success: false, message: (tokenResult && tokenResult.error) || "Failed to obtain Google Access Token" };
            }
            var accessToken = tokenResult.token;

            var channelId = appSlug + "_live_channel";
            var payload = {
                message: {
                    token: token,
                    notification: { title: title, body: body },
                    data: dataPayload || {},
                    android: {
                        priority: "HIGH",
                        notification: {
                            channel_id: channelId,
                            sound: "default",
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

        var shouldSend = true;
        var pushResults = [];

        if (shouldSend) {
            var subs = [];
            try {
                if (typeof $app.findRecordsByFilter === "function") {
                    subs = $app.findRecordsByFilter("subscriptions", "app_slug = 'campeonato_carioca'", "", 10, 0);
                } else if ($app.dao && typeof $app.dao().findRecordsByFilter === "function") {
                    subs = $app.dao().findRecordsByFilter("subscriptions", "app_slug = 'campeonato_carioca'", "", 10, 0);
                }
            } catch (errSubs) {
                return c.json(500, { error: "Erro ao buscar subscriptions: " + errSubs });
            }

            if (subs.length === 0) {
                return c.json(404, { message: "Nenhum aparelho registrado na coleção subscriptions." });
            }

            for (var s = 0; s < subs.length; s++) {
                var token = subs[s].getString("fcm_token");
                var r = sendFcmPush(
                    "campeonato_carioca",
                    token,
                    "⚽ [Campeonato Carioca] Teste de Notificação!",
                    "Notificação em tempo real funcionando 100% no seu celular!",
                    { event_type: "test", app_slug: "campeonato_carioca" }
                );
                pushResults.push({
                    deviceId: subs[s].getString("device_id"),
                    result: r
                });
            }
        }

        return c.json(200, {
            status: "ok",
            message: "Zapscore PocketBase Estaduais Notification Hook is active!",
            sendTestTriggered: shouldSend,
            pushResults: pushResults
        });
    } catch (e) {
        return c.json(500, { error: e.toString() });
    }
});

// ==========================================
// 2. Cron Job Principal — Monitoramento de Jogos Estaduais
// ==========================================

cronAdd("check_estaduais_live_matches", "*/1 * * * *", function() {
    try {
        var _googleTokenCache = {};
        var _EMBEDDED_FIREBASE_CONFIGS = {
            "campeonato_carioca": {
                "project_id": "appcarioca",
                "client_email": "firebase-adminsdk-fbsvc@appcarioca.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAoO31UqaAYJfC\nR2jV7njHjjpAOHpU+PJPCDbGkGX5EYZTL4HJINt6yRUWWfhgPLfo1AoHQ8ztfMqQ\nlcvdhFta8rnW0JL8zJD8i4gcYOJsz5bnndKPNZQoJYtd5YRDcXm4RvYqrDxRSSuo\nZvvUk5RVP7nP2s3vAG4nyEUaTbcQHIteYJzq2HsTYCOSEBcvFBjfsahW2LQdaCdd\nB3Jk5T8YMGVwZ6t7UCEJqSg95YTLzXgLOERGF7LKpF0KLuyECWikwOabD7xMpccW\nZyueKXdIDpCu9ZSD5bbwc4J+CIRWAC1le02eGBJa2WVBiTnlhGYBu5rj5Qped+ga\n2f8RjcGJAgMBAAECggEAAa8mhXeUhxjRGty++Ofd3HjM35Te1PFcRP6gY/oNOjFC\nCGYo71Y/NQKfEZP1zPma7gk0kT2xg/4MU1lL8ALhPZlTsKIgNt+fAOZDaWQbdrIV\n8q55kdD5G6TAZDDGiERsuQS90D+zQ06teAp2dzRXHquw9zVFiapqTCS/HezCBf0F\n/ebKhbbf8vEwPy5yU4o1HsaD+HhEzhD40Hm8SuzVwffnANfYKJHCYvqH1Ty3QbVc\nqj5o2kwqZAVwfmIqF/czu3K57rJxe0WWThGBo8gWt1XIeEzX6gMcz3zm5o5gTWRj\nkm0iFpBjmFmhEm0oQXP1Su4c6Ft0zWGgzXauDBSAxQKBgQD54siayvnSE+bu2FgG\nLHJVa0SEVJIT5Wso219MNkf7HlGwFikCV8juNSWJeYS9/yLY8ZIbvCmv5O6MYc4r\nbEn1gXYQekPlTgJdShSbHIDvGlqhMYHmdBiqbc/aiKpXbwnwinSCf2+IOK8sNLQc\nED6cTSVJ+JW1Vst1phbV6ZnVnwKBgQDFV4CWOg1GV99uo/bVmIIx0J+9Qg6oHGNb\nroj6jNN3cU9OtXRFxUvMMJYFoNaA6eCDk5WVro6KoeB5nc7kxsAIEanUJuIZPn73\nlB0VEaPXg7TqidJMuucKdHiXq4blE1SFwwhZxm5jYYGZ+YTW+HjVXxKXTIsg1Iyk\n5nk3HPwH1wKBgQDlvBXqGgorlZiOpd/nbR2AYqoPbyENobIvUd//VThAKtO3K+hv\n+v0D42CrT0k21EXZZd6KGSfKSpL2BUVirqAgUfGVnJKnUlziH6VqJX50VKpV4Aop\nMTssFOEvbM4OrEtbFi+fekGz30lNPvcHhffKAzLxGtWobi+H7ja4W5fOyQKBgCBW\nNVDolFJJhehIX+MiSXtGN1a441Pyyuk0EWgU+XXiEF/SZgokyUXdVEf50gxvxoV\nAqLzZpIa8oCbNlLQqpjn5A9Ki9QdJIsHLzjLmjBveY7RJK/EFKXm7ffUeJdC8p+0\nlMK5PE92o9kKRRVAw/Qazx4Rwd6QVbeTuJsqWbYjAoGBAM3zg2QOxwEF+ajBjYS4\nkUKKV9Hn+u2EUUd/eGm7SgwuduijkcXG0FDoJc5tTgx5ZQHUXwqlXEKUQKbd60aC\nq7oKCwWXnkic1K8b5et1aOHTqCZ7Z9z1mmvNRj+HfVOXMOF7J+1OootkYCGKiGk/\n523Z8flDBSAUYfmSjBgSK6i5\n-----END PRIVATE KEY-----\n"
            },
            "appcarioca": {
                "project_id": "appcarioca",
                "client_email": "firebase-adminsdk-fbsvc@appcarioca.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDAoO31UqaAYJfC\nR2jV7njHjjpAOHpU+PJPCDbGkGX5EYZTL4HJINt6yRUWWfhgPLfo1AoHQ8ztfMqQ\nlcvdhFta8rnW0JL8zJD8i4gcYOJsz5bnndKPNZQoJYtd5YRDcXm4RvYqrDxRSSuo\nZvvUk5RVP7nP2s3vAG4nyEUaTbcQHIteYJzq2HsTYCOSEBcvFBjfsahW2LQdaCdd\nB3Jk5T8YMGVwZ6t7UCEJqSg95YTLzXgLOERGF7LKpF0KLuyECWikwOabD7xMpccW\nZyueKXdIDpCu9ZSD5bbwc4J+CIRWAC1le02eGBJa2WVBiTnlhGYBu5rj5Qped+ga\n2f8RjcGJAgMBAAECggEAAa8mhXeUhxjRGty++Ofd3HjM35Te1PFcRP6gY/oNOjFC\nCGYo71Y/NQKfEZP1zPma7gk0kT2xg/4MU1lL8ALhPZlTsKIgNt+fAOZDaWQbdrIV\n8q55kdD5G6TAZDDGiERsuQS90D+zQ06teAp2dzRXHquw9zVFiapqTCS/HezCBf0F\n/ebKhbbf8vEwPy5yU4o1HsaD+HhEzhD40Hm8SuzVwffnANfYKJHCYvqH1Ty3QbVc\nqj5o2kwqZAVwfmIqF/czu3K57rJxe0WWThGBo8gWt1XIeEzX6gMcz3zm5o5gTWRj\nkm0iFpBjmFmhEm0oQXP1Su4c6Ft0zWGgzXauDBSAxQKBgQD54siayvnSE+bu2FgG\nLHJVa0SEVJIT5Wso219MNkf7HlGwFikCV8juNSWJeYS9/yLY8ZIbvCmv5O6MYc4r\nbEn1gXYQekPlTgJdShSbHIDvGlqhMYHmdBiqbc/aiKpXbwnwinSCf2+IOK8sNLQc\nED6cTSVJ+JW1Vst1phbV6ZnVnwKBgQDFV4CWOg1GV99uo/bVmIIx0J+9Qg6oHGNb\nroj6jNN3cU9OtXRFxUvMMJYFoNaA6eCDk5WVro6KoeB5nc7kxsAIEanUJuIZPn73\nlB0VEaPXg7TqidJMuucKdHiXq4blE1SFwwhZxm5jYYGZ+YTW+HjVXxKXTIsg1Iyk\n5nk3HPwH1wKBgQDlvBXqGgorlZiOpd/nbR2AYqoPbyENobIvUd//VThAKtO3K+hv\n+v0D42CrT0k21EXZZd6KGSfKSpL2BUVirqAgUfGVnJKnUlziH6VqJX50VKpV4Aop\nMTssFOEvbM4OrEtbFi+fekGz30lNPvcHhffKAzLxGtWobi+H7ja4W5fOyQKBgCBW\nNVDolFJJhehIX+MiSXtGN1a441Pyyuk0EWgU+XXiEF/SZgokyUXdVEf50gxvxoV\nAqLzZpIa8oCbNlLQqpjn5A9Ki9QdJIsHLzjLmjBveY7RJK/EFKXm7ffUeJdC8p+0\nlMK5PE92o9kKRRVAw/Qazx4Rwd6QVbeTuJsqWbYjAoGBAM3zg2QOxwEF+ajBjYS4\nkUKKV9Hn+u2EUUd/eGm7SgwuduijkcXG0FDoJc5tTgx5ZQHUXwqlXEKUQKbd60aC\nq7oKCwWXnkic1K8b5et1aOHTqCZ7Z9z1mmvNRj+HfVOXMOF7J+1OootkYCGKiGk/\n523Z8flDBSAUYfmSjBgSK6i5\n-----END PRIVATE KEY-----\n"
            },
            "campeonato_mineiro": {
                "project_id": "appmineiro",
                "client_email": "firebase-adminsdk-fbsvc@appmineiro.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLDBKgcIAj/qPb\nmK0w1coU/5K6EcFfn529PQFGMW8pAq6qj6AZroSf9yYrm0+fdmN+OMvXixm1z753\n/N+G9PrslE1yjsZcuyzWB9NHCiyhwcdmhNDKlgW+7m5N2R/Wawd0E+6b1cJ7bZJG\n/eHHj9rJ6Rfi19fXYCjgDpMVnhh02bTgBWSzVIxgLd8wNVFrdks0Qyerr2L2AvDk\nNWNIjgsbjr72/BP33ueNzJPESvtrGmd3UUpVbfkuax/g07deFWyynci7p3HT9P/z\n3+heuu6dQQbND3aKrUsAr/LCcZPRqZGasvd/D+qS3ZEnNnMcK2WU+7BV7CL3R/4w\nK41ujeofAgMBAAECggEARexlabz0U/D4KsJ8OgoVqn+M3ukIZ87G+olMrAiQGFZl\nIjWN0+pGn/PzwCafF/IkNy6F/DdZ5kOhex6pN4eb9eboeN/0LbEDsr1FI/y7/ASI\nj6SDZpCdb/AaKlLwZN281lua2y2U6P6F1k7N9vRySwAriqH8IZ5q1SYPvu0PzQUi\nsY0cURsTfQhDHjwa9V7ZmSGBRKfHgESOu64ncf/OetugZQa2HL2s/OPjh6Gm/qUN\n0RZqycLysvSZNT6w/UbD2KJzEu959GlW/O8RrCR0UHVFM/EAszKyI35P1YGt2RSj\nfdqx+iihuPMM6ELvCgzR1mj8EL5OCjwSb+Fw/6uQ2QKBgQDyhjyb8xnxVEeYbmGn\ncO0yUTxehgorFyn+cSl4nrQl6QJS1TqlkN5EpSG9NCn5QKMQxT0ZZ7u/rTU+Myjz\nOsnffZMvAmCdMidHqPDAMDa/oxI9nPUUU+/PPQqWw1j/uk6YNP+X1YOopXNr6/p0\ni79ctjgOaGSIfyOPt+1EJWnwqwKBgQDWVEvpIfeP07hy8ZzAF5NlojvyIKGZGiL4\nr3MC/hHsm7VMtziTlF2SlHJvnpPttgqIDCDUISPAXNdqTndp7WsvkPYvuBc8lJu8\n9oH2YjGOU9TFkSyPJwl3YjoqE/j+3ZR6CFWaYvnpXbZ8QzujrEVJy3uttHhiMMsq\neBAtqgx0XQKBgCz6/qTB6s7ancjEuDHw/N03OeYiICKr0isR2+o2LR1W4Qpx58Wr\nX74FjoNj+GD1PwkuO83JcoXzXwuhO3gZMDXWOYUfgMHG+ogM6lIK3yyd1xU8Viwm\nATVDkgIySwBrEoaiVcFYZWnS/dxHURVqkdxlI3JwpCy4v+S47TWVZtevAoGAUVFA\nT96cT8xzYeD7qQII4XmxJsdsqGr7M8FVcKA26r+VBNtLMusKqY9675CJ7Zmw2zdG\nyVUdfGF9NY85zU3P6gck8Kv23PxBLmuUmYdd5/M0ehT/g/y6obn5+XcEdKZbLAW3\nfNDqorj0gKb9nLbCvyHd9eTP++kpXB6bfMfU290CgYEAjmkijMoUlsjIg1/iFPWC\nov+Ua4EcKLUHPLTDNzMz08neT6F4WpuzQQ/fvFyxiFUnzoe+6o7yP7ZOLCXsE/Xg\n84LNfoyzkoARNwjoQBN32rwoiabPEefrX0g/kUYAID1N8D554vIGnFvmlhP6LZpj\ncr324vviJAH1/yTKJx0N5a0=\n-----END PRIVATE KEY-----\n"
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
                return res.json.access_token;
            }
            return null;
        }

        function getFirebaseConfig(appSlug) {
            var slug = (appSlug || "campeonato_carioca").toLowerCase().trim();

            var possibleFiles = [
                "/pb_hooks/service_account_" + slug + ".json",
                "/pb_hooks/service_account_campeonato_mineiro.json",
                "/pb_hooks/service_account_campeonato_paulista.json",
                "/pb_hooks/service_account_campeonato_carioca.json",
                "/pb_hooks/service_account.json"
            ];

            for (var f = 0; f < possibleFiles.length; f++) {
                try {
                    if (typeof $os !== "undefined" && typeof $os.readFile === "function") {
                        var raw = $os.readFile(possibleFiles[f]);
                        if (raw) return JSON.parse(raw);
                    }
                } catch (_) {}
            }

            if (_EMBEDDED_FIREBASE_CONFIGS[slug]) {
                return _EMBEDDED_FIREBASE_CONFIGS[slug];
            }
            return _EMBEDDED_FIREBASE_CONFIGS["campeonato_carioca"] || null;
        }

        function sendFcmPush(appSlug, token, title, body, dataPayload) {
            var config = getFirebaseConfig(appSlug);
            if (!config) return false;

            var accessToken = getGoogleAccessToken(config);
            if (!accessToken) return false;

            var channelId = appSlug + "_live_channel";
            var payload = {
                message: {
                    token: token,
                    notification: { title: title, body: body },
                    data: dataPayload || {},
                    android: {
                        priority: "HIGH",
                        notification: {
                            channel_id: channelId,
                            sound: "default",
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
                    subscribers = $app.findRecordsByFilter("subscriptions", filterStr, "", 1000, 0);
                } else if ($app.dao && typeof $app.dao().findRecordsByFilter === "function") {
                    subscribers = $app.dao().findRecordsByFilter("subscriptions", filterStr, "", 1000, 0);
                }
            } catch (e) {
                console.log("[POCKETBASE ESTADUAIS PUSH ERROR] Erro ao buscar subscriptions: " + e);
            }

            if (!subscribers || subscribers.length === 0) {
                console.log("[POCKETBASE ESTADUAIS PUSH] [" + leagueName + "] Nenhum assinante ativo para o filtro (" + filterStr + ")");
                return;
            }

            var sentCount = 0;
            for (var j = 0; j < subscribers.length; j++) {
                var sub = subscribers[j];
                var token = sub.getString("fcm_token");
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
                    if (!isFavorite && favTeams.length > 0) {
                        var hStr = String(homeTeamId);
                        var aStr = String(awayTeamId);
                        for (var f = 0; f < favTeams.length; f++) {
                            var item = favTeams[f];
                            if (item === hStr || item === aStr) {
                                isFavorite = true;
                                break;
                            }
                        }
                    }
                }

                if (isFavorite) {
                    var pushRes = sendFcmPush(appSlug, token, eventTitle, eventBody, {
                        fixture_id: fixtureExtId.toString(),
                        app_slug: appSlug,
                        event_type: eventType
                    });

                    if (pushRes && pushRes.success) {
                        sentCount++;
                    } else if (pushRes && (pushRes.statusCode === 404 || pushRes.statusCode === 403 || (pushRes.json && pushRes.json.error && pushRes.json.error.message === "NotRegistered"))) {
                        try {
                            if (typeof $app.deleteRecord === "function") $app.deleteRecord(sub);
                            else if ($app.dao && typeof $app.dao().deleteRecord === "function") $app.dao().deleteRecord(sub);
                        } catch (_) {}
                    }
                }
            }

            console.log("[POCKETBASE ESTADUAIS PUSH 🚀] [" + leagueName + "] " + sentCount + "/" + subscribers.length + " notificações enviadas (App: " + appSlug + " | Evento: " + eventType + ")");
        }

        // 1. Busca aplicativos ativos na coleção 'apps'
        var apps = [];
        try {
            if (typeof $app.findRecordsByFilter === "function") {
                apps = $app.findRecordsByFilter("apps", "active = true", "", 100, 0);
            } else if ($app.dao && typeof $app.dao().findRecordsByFilter === "function") {
                apps = $app.dao().findRecordsByFilter("apps", "active = true", "", 100, 0);
            }
        } catch (eApps) {
            console.log("[POCKETBASE ESTADUAIS APPS ERROR] " + eApps);
        }

        if (!apps || apps.length === 0) {
            console.log("[POCKETBASE ESTADUAIS CRON] Nenhum aplicativo ativo encontrado na coleção 'apps'.");
            return;
        }

        var activeAppMap = new Map();
        for (var a = 0; a < apps.length; a++) {
            var appRec = apps[a];
            var lId = appRec.getInt("league_id");
            if (lId) {
                activeAppMap.set(lId, {
                    appSlug: appRec.getString("app_slug") || "campeonato_carioca",
                    appName: appRec.getString("name") || "Campeonato Carioca",
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

        // 3. Filtra apenas jogos das ligas estaduais ativas
        var estaduaisLiveFixtures = allLiveFixtures.filter(function(f) {
            var leagueExtId = Number(f.league && f.league.externalId ? f.league.externalId : (f.league_id || (f.league && f.league.id) || 0));
            return leagueExtId && activeAppMap.has(leagueExtId);
        });

        var liveFixtureIds = new Set();

        if (estaduaisLiveFixtures.length === 0) {
            console.log("[POCKETBASE ESTADUAIS CRON] ℹ️ Nenhuma partida estadual ao vivo no momento.");
        } else {
            console.log("[POCKETBASE ESTADUAIS CRON] ⏱️ Monitorando " + estaduaisLiveFixtures.length + " partida(s) estadual(is) ao vivo:");
        }

        // 4. Processa cada partida estadual ao vivo
        for (var i = 0; i < estaduaisLiveFixtures.length; i++) {
            var fixture = estaduaisLiveFixtures[i];
            var fixtureExtId = Number(fixture.externalId || fixture.fixture_id || 0);
            if (!fixtureExtId) continue;
            liveFixtureIds.add(fixtureExtId);

            var leagueExtId = Number(fixture.league && fixture.league.externalId ? fixture.league.externalId : (fixture.league_id || (fixture.league && fixture.league.id) || 0));
            var appMeta = activeAppMap.get(leagueExtId);
            if (!appMeta) continue;

            var appSlug = appMeta.appSlug;
            var leagueName = (fixture.league && fixture.league.name) || appMeta.appName || "Estadual";

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

            console.log("[POCKETBASE ESTADUAIS CRON] ⚽ [" + leagueName + "] " + homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName + " (" + statusDisplay + ") - Monitorando...");

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
                cacheRecord.set("last_event_hash", currentElapsed ? String(currentElapsed) : "INIT");
                try {
                    if (currentElapsed) cacheRecord.set("minute", String(currentElapsed));
                } catch (_) {}
                $app.save(cacheRecord);

                if (currentStatus === "1H" || currentStatus === "LIVE") {
                    var eventTitle = "🔔 INÍCIO DE JOGO!";
                    var eventBody = homeTeamName + " x " + awayTeamName + " - A bola está rolando!";
                    executePush(appSlug, leagueName, homeTeamId, awayTeamId, fixtureExtId, "start", eventTitle, eventBody);
                }
                continue;
            }

            var prevHomeScore = cacheRecord.getInt("home_score");
            var prevAwayScore = cacheRecord.getInt("away_score");
            var prevStatus = cacheRecord.getString("status");

            var eventTitle = "";
            var eventBody = "";
            var eventType = "";

            if (currentHomeScore > prevHomeScore) {
                eventTitle = "⚽ GOL DO " + homeTeamName.toUpperCase() + "!";
                eventBody = homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName;
                eventType = "goal";
            } else if (currentAwayScore > prevAwayScore) {
                eventTitle = "⚽ GOL DO " + awayTeamName.toUpperCase() + "!";
                eventBody = homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName;
                eventType = "goal";
            } else if (prevStatus === "NS" && (currentStatus === "1H" || currentStatus === "LIVE")) {
                eventTitle = "🔔 INÍCIO DE JOGO!";
                eventBody = homeTeamName + " x " + awayTeamName + " - A bola está rolando!";
                eventType = "start";
            } else if (prevStatus !== "FT" && (currentStatus === "FT" || currentStatus === "AET" || currentStatus === "PEN")) {
                eventTitle = "🏁 FIM DE JOGO!";
                eventBody = "Placar Final: " + homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName;
                eventType = "end";
            }

            cacheRecord.set("home_score", Number(currentHomeScore));
            cacheRecord.set("away_score", Number(currentAwayScore));
            cacheRecord.set("status", currentStatus ? currentStatus.toString() : "1H");
            cacheRecord.set("last_event_hash", currentElapsed ? String(currentElapsed) : "TICK");
            try {
                if (currentElapsed) cacheRecord.set("minute", String(currentElapsed));
            } catch (_) {}
            $app.save(cacheRecord);

            if (eventTitle) {
                console.log("[POCKETBASE ESTADUAIS EVENT 📢] [" + leagueName + "] " + eventTitle + " | " + eventBody + " (App: " + appSlug + ")");
                executePush(appSlug, leagueName, homeTeamId, awayTeamId, fixtureExtId, eventType, eventTitle, eventBody);
            }
        }

        // 5. Verificação de Fim de Jogo para partidas que saíram do feed ao vivo
        var activeCachedMatches = [];
        try {
            if (typeof $app.findRecordsByFilter === "function") {
                activeCachedMatches = $app.findRecordsByFilter("match_cache", "status != 'FT'", "", 100, 0);
            } else if ($app.dao && typeof $app.dao().findRecordsByFilter === "function") {
                activeCachedMatches = $app.dao().findRecordsByFilter("match_cache", "status != 'FT'", "", 100, 0);
            }
        } catch (e) {
            activeCachedMatches = [];
        }

        for (var k = 0; k < activeCachedMatches.length; k++) {
            var cachedMatch = activeCachedMatches[k];
            var cachedFixtureId = cachedMatch.getInt("fixture_id");
            if (liveFixtureIds.has(cachedFixtureId)) continue;

            var leagueExtId = cachedMatch.getInt("league_id");
            var appMeta = activeAppMap.get(leagueExtId);
            if (!appMeta) continue;

            var appSlug = appMeta.appSlug;
            var leagueName = appMeta.appName || "Estadual";

            try {
                var todayRes = $http.send({
                    url: "https://zapscore-zapscore-api.gtalg3.easypanel.host/fixtures/today?leagueId=" + leagueExtId,
                    method: "GET",
                    headers: { "Accept": "application/json" },
                    timeout: 10
                });

                if (todayRes.statusCode === 200 && Array.isArray(todayRes.json)) {
                    var finalFixture = todayRes.json.find(function(f) { return Number(f.externalId) === cachedFixtureId; });
                    if (finalFixture) {
                        var finalStatus = (finalFixture.statusShort || (finalFixture.status && finalFixture.status.short) || "").toString();
                        var finalHomeScore = Number(finalFixture.homeGoals != null ? finalFixture.homeGoals : (finalFixture.goals ? finalFixture.goals.home : cachedMatch.getInt("home_score")));
                        var finalAwayScore = Number(finalFixture.awayGoals != null ? finalFixture.awayGoals : (finalFixture.goals ? finalFixture.goals.away : cachedMatch.getInt("away_score")));

                        if (["FT", "AET", "PEN"].includes(finalStatus)) {
                            var homeTeamName = (finalFixture.homeTeam && finalFixture.homeTeam.name) || "Mandante";
                            var awayTeamName = (finalFixture.awayTeam && finalFixture.awayTeam.name) || "Visitante";
                            var homeTeamId = cachedMatch.getInt("home_team_id");
                            var awayTeamId = cachedMatch.getInt("away_team_id");

                            var eventTitle = "🏁 FIM DE JOGO!";
                            var eventBody = "Placar Final: " + homeTeamName + " " + finalHomeScore + " x " + finalAwayScore + " " + awayTeamName;

                            cachedMatch.set("home_score", finalHomeScore);
                            cachedMatch.set("away_score", finalAwayScore);
                            cachedMatch.set("status", "FT");
                            $app.save(cachedMatch);

                            console.log("[POCKETBASE ESTADUAIS EVENT 🏁] [" + leagueName + "] FIM DE PARTIDA: " + eventBody + " (App: " + appSlug + ")");
                            executePush(appSlug, leagueName, homeTeamId, awayTeamId, cachedFixtureId, "end", eventTitle, eventBody);
                        }
                    }
                }
            } catch (errCheck) {
                console.log("[POCKETBASE ESTADUAIS CRON] Erro ao checar status final: " + errCheck);
            }
        }

    } catch (err) {
        console.log("[POCKETBASE ESTADUAIS CRON ERROR] Falha no Cron de Notificações: " + err);
    }
});
