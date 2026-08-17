/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase JS Hook - Zapscore Europa Live Match Push Notifications
 * Localização: europa/pb_hooks/notifications.pb.js
 */

// ==========================================
// 1. Endpoint de Teste e Diagnóstico do JS Hook
// ==========================================

routerAdd("GET", "/api/test-notifications", function(c) {
    try {
        var _googleTokenCache = {};

        var _EMBEDDED_FIREBASE_CONFIGS = {
        "laliga": {
                "project_id": "applaliga",
                "client_email": "firebase-adminsdk-fbsvc@applaliga.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/VPMTT8eMMa2b\nStqaDfUu3PGYPZ/BPFRkZvFhU8+ZSk4Ed480yJXFzmm5IDTkTyzsPSsp3zffiCHj\ngRyZk2a7HXD7NNXVGuQiTw+ZfYJ4QHznvR8hLSFlEyyfYH78jSeVTihNpuJfzYVu\nusiVp0u2gnGJiOWBb4uFBG4dKQn6n3CUurUjzQj5jrMLjsHPyUgT4iY7j1q5gP6P\nqrRP4y2jcta184Wj5+cEHSFXOlm0Am2ifHK2bBAyDfmdv9j2v0bOcoBTqCYuJGEM\ni/kF49CBPgxvDuw94mo3VjGBYdPbke7/Scmdk7I0IzrN4niKt/i/JRxcXpWD2Bfn\nhyq8Ja2xAgMBAAECggEAU7U2TbYjPxZC9oSWxDykDtcySeF4IeIjp/OT2nmBA3dL\nT9ABEt5JDIwknA5XpaVwKYEPf9e9ian07aSAnz4qfWXBlt4ESaJkug/t6sDLEpJg\nM0D+PBUTHbX4WVgt5o9ZCIzzvBltw+1WWd4VQMg7K0PBqaL/ihQDrfQEuvRH/eH/\nAKDDt3jCtW1I1Xx+iV5bRV9w5MWjJv2YaUrdC3rP5Qq1rLMBHFqyCmIvbup0GUjt\n0p2s3y9fT+abw/SEVqhg+39AXyN+sLIophvUsJocRgqscbooKKzOc/umFe0lVNBJ\nNgZ2DpY4qvCg9HOQCr//tpH7prsRVZOnrNSH9htMswKBgQDg6KJ/IbKBXdnhjLLt\no8/yfuiVvYpVIdI/bAz23uaAgMQfhvpE22tuqCJisRhChCdIQkvm9KpdYqRvSkdt\nG5bkO6onHizR09RBjzponfA4GJM1FDux7wO/ZndJFGwKtrINQJQuO/QdsKNT8EDP\nyTSDdufhJ3cYnTSNldiAyaVfbwKBgQDZyA0wsrrvn2KIH7XKAOd8MyKo17WxjFY7\nL+PqEkn/XO9cHU1+jj91cYa0KDwN5REhddGYx7tmRfyfAPJuEZsS4kd1g1Ik7YRh\n5Y23dICRNOxV86Er71F1cHKIwKTiDyRIPYpch4I0ECIGYeEHWGBnzv+cHkTNeoUw\nvGbb4xs03wKBgQDdaynPD1W1lrfSHbppykQG8Hn6MUfm2A0s8yswP/GdwSdUAoaR\nE5OItW5kywSfN4uUz+/5yBWRKnPIPNBk0iyTNUomiMaHLIxinqdaJ2M/VrJWJz09\nx5lg7XeyMrDLO2G/Ojyn585FDIk/MeAcsHFKm91dBIVzbhE28rba06pDcQKBgCZR\nX5jA6ck9hu2ifq7TJ+efa6q/gXWC1q1FSNmnbCOlK2xOr5Lj3mCAoA3UwnRDaJc1\njrJN+jgNelxTo1QgfuN8sswHVg2vSMqcxCmSMwjZgffBjQsY6YE7TrunAZvQxDZ9\ntXmAUjVs3T+4Owq6zwOU1T6XyM1KkGK503M+60uLAoGACXUrhs+s4FyklMFd2nvC\nK8p4nDzyhWKrj15lUYxc+ZOWtny+WnNSExUn7sIttyWweKmFoK4m7jtmsrqeuYXJ\nuRON4T11WXXcWlNiR5yHlsPVXjSmBSV9yUCZapo7ialgOHK8A0evx4dIVfE1/MV1\nM4Y8WRBjtrJj7xCLO+q7byo=\n-----END PRIVATE KEY-----\n"
        },
        "bundesliga": {
                "project_id": "appbundesliga",
                "client_email": "firebase-adminsdk-fbsvc@appbundesliga.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCToJM7dbS4PEkM\nv6bOhJZR6vPf8JFWYFcOj1FNvLYWZ67TBJ8eYrIo/YFh1t1lCrKn7zSNLrNOUnRW\n0pqHWOIjI3KtunL6MYsN3nOUBYQo1FpIgm9GAe8bdL5pp/x3zV3hU8vW38E+y1lD\nBW3WU8sSWtJXxy0pgAuWfZHHVhSOEucOL1kpAiZUn0+pP/VJuZ8MFQOQL0se5D41\ny+EzU9a/YaVEYCuWVpW3AeDQMu90YE+UkIzghI6G3ekc1/pCGdB6Z04itBO9UQjH\nCZPLNKvl9g2eR4qM9O8Uvnrb7rDKLRiQ2nvsHnQiIMk3FkZhx/aqXXX/skNJTFDA\nI7iIZJklAgMBAAECggEANiJL2yHugyCYKPSeVlyIQsHFa/jrUqFBSzWCut7YZp7e\nnMK1Fo9ahW1wZFBGHyctHCe7PYpCdhYGU1AnGjqdsgTtqIcWYmiIdS19dGoRbGdy\nM+SgqStMYuUMbfILwmKsalQwCztBwaUPtmPnQxC3BqQHPejrxqwNk8G4E0CdiPsW\n6iEw6t5i3X3FDOHguVdmlAngGAURXBgkkbHDRc+oHu93f2q7sEZDTPOAkHylTpZs\nos7BflSo8jZpSZbrbLnx9ILLLo4PHNbQqZRcBihNOoCpGyK69WbGMRRTHkfXTUTt\nXMr0GwEitQK6ZTNR9gavoAuai7KgB29OU4XkmxKSgQKBgQDEaGG5KgyZD5k+ocao\nHdVIt3KOmle4etmhxPKli9QxFnvZhDZAkLaq/ymi7IrC+Ji5Gw3NYeRUjV71YVxO\n+TkcRTZzOZKh4D7ERwqzXk9a/durAjqMI6GS3DOYEIZVYDPanU1x76yMkPN6Oqvf\neyq6ST0a7tGSmwF/IfKKJsW+8wKBgQDAa0GTmIhTBfRQUbYsf327ymdFN5OjVNs4\nzKXgurohPkrMRhr4tdaW/4b393UmkaQv8TVSnWjtNCJH7e5SRsZ4ZmWx0gXbwsKy\n8MXj5H+HE5ZtOLqbTKxgZfAVC+MvNzkLJGDiuLmDdCT2nSoR7CWG9czl5XIe2RRj\nJJ+1sy89hwKBgAwg4f/8L8D37J+of8r75KLT6TgTId2bgHrz3YQJiXXqjIVXG76K\n8SzICvsrnjoB/fRYTlbjd6UdAcMnWvrpevRa9czRvlNOtLGMLYX8Cex1hq4duh3T\nSXP3Mxxt0M3O3gTe99xUT5RykwZ2PwzS30WXpjVWkAx8k/AU2ZRcZpOvAoGAGbR6\nXzBKTeUGvVAdKRajAlpIr3t8Mp6cZpsYMcxgHx7GOUHISp9oGmXqbufU86ETMQBl\nIjM7GC0Vw0wqwT0JOH5daYLoG3KKNgNqPEaDLtVUDCU+8I4unPYhO36KC/2xliZ2\n9vK8fa4fXf6i5yAH516gz7l2JF7VlWUIHOriDbMCgYAV60QOw9SCAuGCK0QpnIbBDOwKlj6TVud3/ki1E+aGdwb/pPAHMzAyBvwkhGF1mtMyiEUxjRavlxvYkEMRj/Bs\nuH8XgmGngXnsC/PQtDCefyq9CNzC4npljOsxfORAbwbM/c2CCNiX4dm2NvXunlzI\nOPjCHOmeBy1jTF3go4oYnQ==\n----END PRIVATE KEY-----\n"
        },
        "premierleague": {
                "project_id": "apppremierleague-8935b",
                "client_email": "firebase-adminsdk-fbsvc@apppremierleague-8935b.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCvMLFg9vzyT7JD\n4E1j0PUDZT1bTg2ZG8EYE5d+YzojHG3yu5hPj1XYDjwteqYMyKdXkRFb0Pd5KNkU\noFV7Wi/xV4OEE9nHQnLU8rMAAuWd+eevS41HPANokZPksMJJOMmfC7h9cUxTz9Nh\nLlw5ZkWlntguQisjw9QBR5kyOxc7wY5UXy4hjIciawEM8zcfPBQt9GUBiFNga4BJ\nSJdHHemMwI9+RZQfeub1GQ0rfXr4iWnR3H1kBQRiOVlrlUzFhstP9ynJjO5myqZV\nKYQXpeJfmCVkkWPbP+lBmJPVayHIwzkVE/soLeE5kShz8swnvGJtkC03jU0Ipc2a\nyR88arXhAgMBAAECggEABnvj9hhbbyDIfVnMpiGvznby26bVUCyhC6ypSiX5hZ78\nfxlML0D5QXnGET0tbqKG4Qc55X75MycyIPY4hmF640Y6KaCuH4FugcJUIi9j7gzN\nCKWgSQ89UA4380+gd+MjFotxl1ZNZ8+0vYTLUzDdad5pwWKKZAnlgOufDachZRZ6\njR5+cijGO8+UcXlE4WKDUysjOsXcbzX+iYyEl/qcsIU+ShPH8nvW3/sZofZkkrlg\nxj0LwnbVs2NYBS/nf0ZyXj/Yn/BR+kKyjWb83An3efwx9jfY0WOQxVQX6jDBTDws\nVo8QjkqE9v3UtBW0as6/qnZnV4jtueTyZdmNUilWrQKBgQDhq0ibgqenLXt2lf8J\ndbI0jKuz+teoDu5PtSLJ9j90HfBdVYGNgwX2QYI5sZtZFJdyuJ0HedYPEAVvYXOW\nBQuA3lcxn3aMrNTgpmIQ0x5mJwy94N7ikg77xd2JbgDdP2oAFylv1oMXl7kZpW7G\n1++BsxjBPgbqBkkMlSH6LylO5QKBgQDGvI5LRqWUKPzG8XKY8ljfDohDw8slpqsr\nwSEC3qs305hSqtseiEkjRmHyUGTcCTBd60bvybOrE1AYPvaW50GoovpnzCBCOzZk\naCQh1KonbpuTTkc6GX1kr6miwi45famwvVFAIIVR2aBvNdVC3hjM3UCxVLFyUpmD\n35WE02tfTQKBgQCbV2W2rryrhtJ7MguKPnt6Uu8LCHwVEpoXQi/9aEYLr2Q7S1XP\nzMZ42mVDQ7AVJOiPrudhMwwX+EZVgnanaTee8O6CmSto8LvlHINa44kEdpL9zeJ/\ngl1QEMdMB+4OXs2f3FHIy5gX0Hg5YDieJhyXYmqC8yidRdBZGft2lapQxQKBgHIN\nhjAHNEFKIH9f05+Y/Y3NfkA9nllWREfRB0vpVCOuyG0w5p2oIykeXFm+75MjpuFP\nhB9bB0R3yfCQOd4yi4jnN4PYLu8zoiyPY6USsi/9F0W7l77tH/xnn5frjrGpv3fR\nvk5qG3j0x1DreR9t7JetplHexBNS+g0nhFx9JNLFAoGAPBDTd+nXCBjvcGnDrqgJ\n34z+XtzI0Qj9DWGMhC1euIbEqgrHtXlgvufXASeD0/SvOEjClsfYbzlTFF+T3nzM\nPIK8GsPOV7XsegepL9ak90UUoWUY/fe+Jsomz5ylPjn9TAYXEGyAk0OVqJWwyCoR\nzHfoAln4NbXJCmMXMYhVB+4=\n-----END PRIVATE KEY-----\n"
        },
        "seriea-italia": {
                "project_id": "appseriea-italia",
                "client_email": "firebase-adminsdk-fbsvc@appseriea-italia.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqsQ0yS6LGMYUj\nMJoT1nReHlZwEHEnMuGhqQwo2oUewEJ9o3mgky0ZV3eTkuN6GHx4jDPSiWDDKBKJ\nWE7ie43US/9DPpgUyJpmr6rRxNQt9w6wtVrmoGw9y9ZUrnjTKOz/LC1KR1hKnnym\nfj/wM1cmO0rViVHnyuNxM1VnS+UNxkXceEnSunLodhy2Qaw+Vs9QAXv08bGXRvi3\n6qvo2j8zKCywciII68brHpUXQNjEvEOqe3F6PHZTLWD8R2C6QmFvgxB2pyA/X0AD\nNrAZ7Iqcan5y2KPzPVDXdiH6YPaXUiRZRjslGZo1NBnbngpsdhrQ4Ck5prixCqv8\na1FTp7G/AgMBAAECggEAL+/wclcenEXNC9B6/SZF4SbpBKkBdk5KYtHsmc6hAz1g\njxNptaiPymWvrfDbVO9qiZpqdW7ij3yCFDOKV/32G5DKXDLImFGsVzlvomECa/RO\nGl+ca1fTfllwVLD5OuhsAs//2jQGPlKbVFDxmP56M8EEJ8tchtoKnUCa9Bsy9XZr\nqZr4wha9LOjmQpoRlv2d5Euv5moBzOt/1JJRFO7atadpP/P85o717rQA/U2+TVTf\nwobZRaIUVQ7j9S5WD7m+MMx5gRX/VaxPvjbn0TbnQqagvOUjcJgvPn6izUuJPItl\nlba4iSVYyerehn8adl228vFYr/YdPErRRKu88Qf74QKBgQDZGGWpkXKIXF8MHDJv\n3EwL5Xxv2pC4vcBZ57o8691hE31QS1w/J6JF+fWzhUlklB0UmeeBPEcsh/rJ7wpY\nSldL8qODUT+QzesftzOLiB9OpJydzSiMqwSVPi6rlK3fwJl3JayMYG3sojFnIVQh\nAHiDqUiabJZ0JpenpmJ384ruYQKBgQDJR88UUuWFZI2UgbbiS1cBrGl2lotyYvZc\nYidpWD6uuqN4PSZXreOGG135wqpT3yCQIuFmW0XwfWUpm9B2uhG85smAZdSZotI4\nj4RZWFrcoPczzuF4Q/pIvl5ty6r5EpcgZLceDFLplJnVOT2DOgqTs/v1EZv60Wzz\nqpuCgr1UHwKBgQDI0hi40yLvoQMLYMoHT/HIz3BcyAI34s+cWw+ca1NOCYlSTWP3\nx+IEeUUf25wYvipodDYDBo+QUflb8xPOuHYoeztmrjHu8Y0euYmk+TZ8uSlnj/CC\nr3B93heuAMsWwEM2RFNpR4pn62Fn1RzNqnHQ2TegIfLLXyfKnc9YxqEuAQKBgHki\n4Hvoz/2R4KtpzbkvgnOdYfNe8xmqeX5sDDAYTdE2vj8U/khyfKYvPkWcZIoJlT1p\n4KGLePIdZY6/GZz6qsY3VzoRDvxPw5kKtqpWxIhXz668aXHJ5410FLybgJBaId36\n/0H0RMoTBuoOgvjBK7Bs98wsBuXSuHGFUgYfzPYdAoGBANByXut94OqJpLC8ZGJC\nbROSco2I4dnTdyCkgSB+EOhVpzx09Nyb3ZgOApH1ccwTKu/u2ZBPq+cOfv7vt3sv\nspA7ssQ3s3A5ASYd6AH3RXrtR9ydIvd3gDux/vJEz4zoN7tGm64+pEHsityLeVPs\nyRtxImc+JWRn72QgElFDGzZz\n-----END PRIVATE KEY-----\n"
        },
        "ligue1-franca": {
                "project_id": "appligue1",
                "client_email": "firebase-adminsdk-fbsvc@appligue1.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDI6hV88AB91V6Q\niTEUnS1xY7SFxFsIcCy2LTnHQ9AwtKedqHkDN/pJGOejmqkAAeg1T6yT7SxwQGTm\nd74yJ3ItUB/81tedZ1e59FTG2S7+5OXiXHxV4oGjN8rSEv8sT+GbPvGVaJ7guU7g\nCeYXc9aMZI+ZZ11dTffllzkA9+xx25YLvCwFH4OUWgU+DURPmP2PS6A6uejWdgN7\n91zGkCwk4k04OFc6HFziEAQw5Bt8ePg8Kf2Y99hgYaQ3xy3Ri+ktd2KDDwmhceDC\nHLDiItFQ/2GQ6d8pfKAL3p2MFaIRqaEkc3AnPoHXxjKhe1tHbBqFMj0eJz0MsSOE\nYyXXGNT5AgMBAAECggEAFy4kwQeqstnvgWMGud9hixPLE+Th8OEKU5F3uVUKW9g3\n/4FcxuGKO61HKnHRXkoaCa6R1XZXenL/gTSfCcfRzUcRjbkW4tb1wONe9ZtAqBFu\nMXXktX7+4H8zJBYjgTANMj1qn4eUzw4qOsCBnsKTZhrDE5qgo793YrKWFdXE3qTX\n+K1ypZCYeM4leaSl03wH4M42DIz+eJI17kxrEs9mamt1svqfWr8ZZCXbb0KJI2We\nUJEFRj+x5UMtxiUbbmt2oFWZ9Riz0ZoIgJDuQws776WCgeJEsK9469Ade2zbDDSR\nKzIfDZSAIPDgn5jNUgHbJqdSxj7QI8dvCOFcPyzwJQKBgQDqN4Ah8rG8DJyMeE6E\nwsET0jnHH0fUFnkgU5bBIlTrOiyK6i6LRq7QechhvtY2xhT11iwUihgK0XBIOBsg\nje0lBk8RUTmyfRmXx+WciaJ5dthL3IXCZ9EFZ1boEXtnUGmDhuBlG5D2Hr9mZLg7\n2XNuwVipHNzYybE5fln5Grh3/QKBgQDbma6OvVR2M3U+4maYNDyIIFoT/gfylhEi\nNzy3MXmADIuwF4joyvqiOmmOak1T4A0gJNKwZeVTQILMc6LBalsgjhvBPuE38xRo\nNPwDejbkNa+79lW4fbbS8gb1UrUp3eGITEhjjI1Zbi+RVfZxrsjImAO/0D76MY+X\niaY9oz1rrQKBgHOIvSQB27qvXenMzq6egy+L3ARlYcE09LsFgK/0h38hSyebLSp2\ny3T7HeVZhcGvJFfANi5LkGCFv6VgR8FfQUOqQQaB0rxBCYbdjF4TZpoUDc4eEb08\nCNdpim0fcogcGnBO8BHv7yn5MOEJfffH5DEWHu4M1sP5efqqYSeIDsbhAoGBAMzT\no4VwAv/dL1bgRWFiF7PAuUQ8hZ03a/PGIdOdSf6ttP0idojsCqqWYS586HN7X8LD\nleECqcvlOBsLIJvXX/gVlL3CsL9G85nfEdEMhXaGvMtNENdsKsLHDMZ1xpSuaFaB\nEGQKDS2FIMkmrR+ML6sqXxTiYFttLsnhkjWbtQZhAoGBANlfBz+Ike2oEkr51u8B\nwhHl7cuawKUxBbho+zLs1yZ5tHnuewdqBFMQFJzN4DzY6odL2s8cwH3bEPjzcP3j\nX/uJeFBvTO8hJQPyqcbS7S39dICpTaRpUoqQ7eglD5iIuOq1Wyz1PZQTTlvmiN0w\n7Gv6Ph0S7i31IXLH6qfJLU9y\n-----END PRIVATE KEY-----\n"
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

                var a = hash[0], b = hash[1], c = hash[2], d = hash[3];
                var e = hash[4], f = hash[5], g = hash[6], h = hash[7];

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
                    var c = l & 0x7f; l = 0;
                    for (var i = 0; i < c; i++) l = (l << 8) | der[offset++];
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

        var _lastOAuthResponse = null;

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

            _lastOAuthResponse = { statusCode: res.statusCode, raw: res.raw };

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
            var slug = (appSlug || "laliga").toLowerCase().trim();
            if (_EMBEDDED_FIREBASE_CONFIGS[slug]) {
                return _EMBEDDED_FIREBASE_CONFIGS[slug];
            }
            return _EMBEDDED_FIREBASE_CONFIGS["laliga"] || null;
        }

        function sendFcmPush(appSlug, token, title, body, dataPayload) {
            var config = getFirebaseConfig(appSlug);
            if (!config) return { success: false, error: "Config not found for " + appSlug };

            var accessToken = getGoogleAccessToken(config);
            if (!accessToken) return { success: false, error: "OAuth2 token failed for " + config.project_id };

            var channelId = appSlug === "laliga" ? "laliga_live_channel" : appSlug + "_live_channel";
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
                raw: res.raw,
                json: res.json
            };
        }

        var appParam = "laliga";
        var testToken = "";

        try {
            if (typeof c.queryParam === "function") {
                var qp = c.queryParam("token");
                if (qp) testToken = qp;
                var qa = c.queryParam("app");
                if (qa) appParam = qa;
            }
        } catch (_) {}

        try {
            if (typeof c.QueryParam === "function") {
                var QP = c.QueryParam("token");
                if (QP) testToken = QP;
                var QA = c.QueryParam("app");
                if (QA) appParam = QA;
            }
        } catch (_) {}

        try {
            if (typeof c.requestInfo === "function" && c.requestInfo().query) {
                var ri = c.requestInfo().query;
                if (ri["token"]) testToken = ri["token"];
                if (ri["app"]) appParam = ri["app"];
            }
        } catch (_) {}

        try {
            var req = null;
            if (typeof c.Request === "function") req = c.Request();
            else if (typeof c.request === "function") req = c.request();
            else if (c.request) req = c.request;

            if (req && req.URL && req.URL.RawQuery) {
                var raw = req.URL.RawQuery;
                var parts = raw.split("&");
                for (var p = 0; p < parts.length; p++) {
                    var pair = parts[p].split("=");
                    if (decodeURIComponent(pair[0]) === "token") testToken = decodeURIComponent(pair[1] || "");
                    if (decodeURIComponent(pair[0]) === "app") appParam = decodeURIComponent(pair[1] || "");
                }
            }
        } catch (_) {}

        var config = getFirebaseConfig(appParam);
        var oauthStatus = "Not Configured";
        var testPushResult = null;
        var authError = null;

        if (config) {
            try {
                var token = getGoogleAccessToken(config);
                oauthStatus = token ? "OAuth2 Token Generated Successfully" : "OAuth2 Token Generation Failed";
                if (!token && _lastOAuthResponse) {
                    authError = JSON.stringify(_lastOAuthResponse);
                }
            } catch (err) {
                authError = err.toString();
            }

            if (testToken) {
                testPushResult = sendFcmPush(
                    appParam,
                    testToken,
                    "🔔 Notificação de Teste PocketBase",
                    "Se você recebeu isso, o disparo FCM v1 está 100% operacional!",
                    { test: "true" }
                );

                if (testPushResult && (testPushResult.statusCode === 404 || testPushResult.statusCode === 403 || (testPushResult.json && testPushResult.json.error && (testPushResult.json.error.message === "NotRegistered" || testPushResult.json.error.status === "NOT_FOUND")))) {
                    try {
                        var deadSubs = [];
                        if (typeof $app.findRecordsByFilter === "function") {
                            deadSubs = $app.findRecordsByFilter("subscriptions", "fcm_token = '" + testToken + "'", "-created", 10, 0);
                        } else if ($app.dao && typeof $app.dao().findRecordsByFilter === "function") {
                            deadSubs = $app.dao().findRecordsByFilter("subscriptions", "fcm_token = '" + testToken + "'", "-created", 10, 0);
                        }

                        for (var ds = 0; ds < deadSubs.length; ds++) {
                            try {
                                if ($app.dao && typeof $app.dao().deleteRecord === "function") {
                                    $app.dao().deleteRecord(deadSubs[ds]);
                                } else if (typeof $app.deleteRecord === "function") {
                                    $app.deleteRecord(deadSubs[ds]);
                                } else if (typeof $app.delete === "function") {
                                    $app.delete(deadSubs[ds]);
                                }
                                console.log("[POCKETBASE PURGE 🗑️] Token de teste morto expurgado: " + deadSubs[ds].id);
                            } catch (eDel) {
                                console.log("[POCKETBASE PURGE ERROR individual]: " + eDel);
                            }
                        }
                    } catch (purgeErr) {
                        console.log("[POCKETBASE PURGE ERROR] " + purgeErr);
                    }
                }
            }
        }

        var subsDiagnose = [];
        var subsCount = 0;
        try {
            var found = [];
            if (typeof $app.findRecordsByFilter === "function") {
                found = $app.findRecordsByFilter("subscriptions", "app_slug = '" + appParam + "'", "", 100, 0);
            } else if ($app.dao && typeof $app.dao().findRecordsByFilter === "function") {
                found = $app.dao().findRecordsByFilter("subscriptions", "app_slug = '" + appParam + "'", "", 100, 0);
            }
            subsCount = found.length;
            for (var sd = 0; sd < Math.min(found.length, 10); sd++) {
                var sItem = found[sd];
                subsDiagnose.push({
                    id: sItem.id,
                    name: sItem.getString("user_name") || sItem.getString("user_nickname") || "User",
                    token: (sItem.getString("fcm_token") || "").substring(0, 15) + "...",
                    notify_goals: sItem.getBool("notify_goals"),
                    notify_start: sItem.getBool("notify_start"),
                    notify_end: sItem.getBool("notify_end"),
                    favorite_teams: sItem.get("favorite_teams"),
                    favorite_fixtures: sItem.get("favorite_fixtures")
                });
            }
        } catch (diagErr) {
            subsDiagnose = ["Error: " + diagErr.toString()];
        }

        var simulateResult = null;
        var isSimulate = false;
        try {
            if (typeof c.queryParam === "function" && c.queryParam("simulate") === "true") isSimulate = true;
            if (typeof c.QueryParam === "function" && c.QueryParam("simulate") === "true") isSimulate = true;
            if (ri && ri["simulate"] === "true") isSimulate = true;
        } catch (_) {}
        if (req && req.URL && req.URL.RawQuery && req.URL.RawQuery.indexOf("simulate=true") >= 0) isSimulate = true;

        if (isSimulate && found && found.length > 0) {
            var sentSimCount = 0;
            var simResults = [];
            for (var si = 0; si < found.length; si++) {
                var sRec = found[si];
                var sTok = sRec.getString("fcm_token");
                if (sTok) {
                    var sRes = sendFcmPush(appParam, sTok, "⚽ GOL DO DEPORTIVO LA CORUNA!", "Deportivo La Coruna 2 x 1 Elche - Teste do Sistema", {
                        fixture_id: "1570337",
                        app_slug: appParam,
                        event_type: "goal"
                    });
                    if (sRes && sRes.success) sentSimCount++;
                    simResults.push({
                        id: sRec.id,
                        name: sRec.getString("user_name") || sRec.getString("user_nickname") || "User",
                        status: sRes ? sRes.statusCode : "null",
                        success: sRes ? sRes.success : false
                    });
                }
            }
            simulateResult = {
                sent: sentSimCount + "/" + found.length,
                details: simResults
            };
        }

        return c.json(200, {
            status: "PocketBase JS Hook is ACTIVE!",
            app_tested: appParam,
            firebase_project: config ? config.project_id : "Not Loaded",
            oauth_status: oauthStatus,
            auth_error: authError,
            subscribers_count: subsCount,
            subscribers_sample: subsDiagnose,
            simulation_result: simulateResult,
            test_push_sent: testPushResult,
            token_received: testToken ? (testToken.substring(0, 10) + "...") : "None",
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        return c.json(200, {
            status: "HOOK_ERROR",
            error: e.toString()
        });
    }
});

// ==========================================
// 2. Cron Job de Sincronização de Jogos ao Vivo e Push
// ==========================================

cronAdd("zapscore_live_sync", "* * * * *", function() {
    try {
        var _googleTokenCache = {};

        var _EMBEDDED_FIREBASE_CONFIGS = {
        "laliga": {
                "project_id": "applaliga",
                "client_email": "firebase-adminsdk-fbsvc@applaliga.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/VPMTT8eMMa2b\nStqaDfUu3PGYPZ/BPFRkZvFhU8+ZSk4Ed480yJXFzmm5IDTkTyzsPSsp3zffiCHj\ngRyZk2a7HXD7NNXVGuQiTw+ZfYJ4QHznvR8hLSFlEyyfYH78jSeVTihNpuJfzYVu\nusiVp0u2gnGJiOWBb4uFBG4dKQn6n3CUurUjzQj5jrMLjsHPyUgT4iY7j1q5gP6P\nqrRP4y2jcta184Wj5+cEHSFXOlm0Am2ifHK2bBAyDfmdv9j2v0bOcoBTqCYuJGEM\ni/kF49CBPgxvDuw94mo3VjGBYdPbke7/Scmdk7I0IzrN4niKt/i/JRxcXpWD2Bfn\nhyq8Ja2xAgMBAAECggEAU7U2TbYjPxZC9oSWxDykDtcySeF4IeIjp/OT2nmBA3dL\nT9ABEt5JDIwknA5XpaVwKYEPf9e9ian07aSAnz4qfWXBlt4ESaJkug/t6sDLEpJg\nM0D+PBUTHbX4WVgt5o9ZCIzzvBltw+1WWd4VQMg7K0PBqaL/ihQDrfQEuvRH/eH/\nAKDDt3jCtW1I1Xx+iV5bRV9w5MWjJv2YaUrdC3rP5Qq1rLMBHFqyCmIvbup0GUjt\n0p2s3y9fT+abw/SEVqhg+39AXyN+sLIophvUsJocRgqscbooKKzOc/umFe0lVNBJ\nNgZ2DpY4qvCg9HOQCr//tpH7prsRVZOnrNSH9htMswKBgQDg6KJ/IbKBXdnhjLLt\no8/yfuiVvYpVIdI/bAz23uaAgMQfhvpE22tuqCJisRhChCdIQkvm9KpdYqRvSkdt\nG5bkO6onHizR09RBjzponfA4GJM1FDux7wO/ZndJFGwKtrINQJQuO/QdsKNT8EDP\nyTSDdufhJ3cYnTSNldiAyaVfbwKBgQDZyA0wsrrvn2KIH7XKAOd8MyKo17WxjFY7\nL+PqEkn/XO9cHU1+jj91cYa0KDwN5REhddGYx7tmRfyfAPJuEZsS4kd1g1Ik7YRh\n5Y23dICRNOxV86Er71F1cHKIwKTiDyRIPYpch4I0ECIGYeEHWGBnzv+cHkTNeoUw\nvGbb4xs03wKBgQDdaynPD1W1lrfSHbppykQG8Hn6MUfm2A0s8yswP/GdwSdUAoaR\nE5OItW5kywSfN4uUz+/5yBWRKnPIPNBk0iyTNUomiMaHLIxinqdaJ2M/VrJWJz09\nx5lg7XeyMrDLO2G/Ojyn585FDIk/MeAcsHFKm91dBIVzbhE28rba06pDcQKBgCZR\nX5jA6ck9hu2ifq7TJ+efa6q/gXWC1q1FSNmnbCOlK2xOr5Lj3mCAoA3UwnRDaJc1\njrJN+jgNelxTo1QgfuN8sswHVg2vSMqcxCmSMwjZgffBjQsY6YE7TrunAZvQxDZ9\ntXmAUjVs3T+4Owq6zwOU1T6XyM1KkGK503M+60uLAoGACXUrhs+s4FyklMFd2nvC\nK8p4nDzyhWKrj15lUYxc+ZOWtny+WnNSExUn7sIttyWweKmFoK4m7jtmsrqeuYXJ\nuRON4T11WXXcWlNiR5yHlsPVXjSmBSV9yUCZapo7ialgOHK8A0evx4dIVfE1/MV1\nM4Y8WRBjtrJj7xCLO+q7byo=\n-----END PRIVATE KEY-----\n"
        },
        "bundesliga": {
                "project_id": "appbundesliga",
                "client_email": "firebase-adminsdk-fbsvc@appbundesliga.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCToJM7dbS4PEkM\nv6bOhJZR6vPf8JFWYFcOj1FNvLYWZ67TBJ8eYrIo/YFh1t1lCrKn7zSNLrNOUnRW\n0pqHWOIjI3KtunL6MYsN3nOUBYQo1FpIgm9GAe8bdL5pp/x3zV3hU8vW38E+y1lD\nBW3WU8sSWtJXxy0pgAuWfZHHVhSOEucOL1kpAiZUn0+pP/VJuZ8MFQOQL0se5D41\ny+EzU9a/YaVEYCuWVpW3AeDQMu90YE+UkIzghI6G3ekc1/pCGdB6Z04itBO9UQjH\nCZPLNKvl9g2eR4qM9O8Uvnrb7rDKLRiQ2nvsHnQiIMk3FkZhx/aqXXX/skNJTFDA\nI7iIZJklAgMBAAECggEANiJL2yHugyCYKPSeVlyIQsHFa/jrUqFBSzWCut7YZp7e\nnMK1Fo9ahW1wZFBGHyctHCe7PYpCdhYGU1AnGjqdsgTtqIcWYmiIdS19dGoRbGdy\nM+SgqStMYuUMbfILwmKsalQwCztBwaUPtmPnQxC3BqQHPejrxqwNk8G4E0CdiPsW\n6iEw6t5i3X3FDOHguVdmlAngGAURXBgkkbHDRc+oHu93f2q7sEZDTPOAkHylTpZs\nos7BflSo8jZpSZbrbLnx9ILLLo4PHNbQqZRcBihNOoCpGyK69WbGMRRTHkfXTUTt\nXMr0GwEitQK6ZTNR9gavoAuai7KgB29OU4XkmxKSgQKBgQDEaGG5KgyZD5k+ocao\nHdVIt3KOmle4etmhxPKli9QxFnvZhDZAkLaq/ymi7IrC+Ji5Gw3NYeRUjV71YVxO\n+TkcRTZzOZKh4D7ERwqzXk9a/durAjqMI6GS3DOYEIZVYDPanU1x76yMkPN6Oqvf\neyq6ST0a7tGSmwF/IfKKJsW+8wKBgQDAa0GTmIhTBfRQUbYsf327ymdFN5OjVNs4\nzKXgurohPkrMRhr4tdaW/4b393UmkaQv8TVSnWjtNCJH7e5SRsZ4ZmWx0gXbwsKy\n8MXj5H+HE5ZtOLqbTKxgZfAVC+MvNzkLJGDiuLmDdCT2nSoR7CWG9czl5XIe2RRj\nJJ+1sy89hwKBgAwg4f/8L8D37J+of8r75KLT6TgTId2bgHrz3YQJiXXqjIVXG76K\n8SzICvsrnjoB/fRYTlbjd6UdAcMnWvrpevRa9czRvlNOtLGMLYX8Cex1hq4duh3T\nSXP3Mxxt0M3O3gTe99xUT5RykwZ2PwzS30WXpjVWkAx8k/AU2ZRcZpOvAoGAGbR6\nXzBKTeUGvVAdKRajAlpIr3t8Mp6cZpsYMcxgHx7GOUHISp9oGmXqbufU86ETMQBl\nIjM7GC0Vw0wqwT0JOH5daYLoG3KKNgNqPEaDLtVUDCU+8I4unPYhO36KC/2xliZ2\n9vK8fa4fXf6i5yAH516gz7l2JF7VlWUIHOriDbMCgYAV60QOw9SCAuGCK0QpnIbBDOwKlj6TVud3/ki1E+aGdwb/pPAHMzAyBvwkhGF1mtMyiEUxjRavlxvYkEMRj/Bs\nuH8XgmGngXnsC/PQtDCefyq9CNzC4npljOsxfORAbwbM/c2CCNiX4dm2NvXunlzI\nOPjCHOmeBy1jTF3go4oYnQ==\n----END PRIVATE KEY-----\n"
        },
        "premierleague": {
                "project_id": "apppremierleague-8935b",
                "client_email": "firebase-adminsdk-fbsvc@apppremierleague-8935b.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCvMLFg9vzyT7JD\n4E1j0PUDZT1bTg2ZG8EYE5d+YzojHG3yu5hPj1XYDjwteqYMyKdXkRFb0Pd5KNkU\noFV7Wi/xV4OEE9nHQnLU8rMAAuWd+eevS41HPANokZPksMJJOMmfC7h9cUxTz9Nh\nLlw5ZkWlntguQisjw9QBR5kyOxc7wY5UXy4hjIciawEM8zcfPBQt9GUBiFNga4BJ\nSJdHHemMwI9+RZQfeub1GQ0rfXr4iWnR3H1kBQRiOVlrlUzFhstP9ynJjO5myqZV\nKYQXpeJfmCVkkWPbP+lBmJPVayHIwzkVE/soLeE5kShz8swnvGJtkC03jU0Ipc2a\nyR88arXhAgMBAAECggEABnvj9hhbbyDIfVnMpiGvznby26bVUCyhC6ypSiX5hZ78\nfxlML0D5QXnGET0tbqKG4Qc55X75MycyIPY4hmF640Y6KaCuH4FugcJUIi9j7gzN\nCKWgSQ89UA4380+gd+MjFotxl1ZNZ8+0vYTLUzDdad5pwWKKZAnlgOufDachZRZ6\njR5+cijGO8+UcXlE4WKDUysjOsXcbzX+iYyEl/qcsIU+ShPH8nvW3/sZofZkkrlg\nxj0LwnbVs2NYBS/nf0ZyXj/Yn/BR+kKyjWb83An3efwx9jfY0WOQxVQX6jDBTDws\nVo8QjkqE9v3UtBW0as6/qnZnV4jtueTyZdmNUilWrQKBgQDhq0ibgqenLXt2lf8J\ndbI0jKuz+teoDu5PtSLJ9j90HfBdVYGNgwX2QYI5sZtZFJdyuJ0HedYPEAVvYXOW\nBQuA3lcxn3aMrNTgpmIQ0x5mJwy94N7ikg77xd2JbgDdP2oAFylv1oMXl7kZpW7G\n1++BsxjBPgbqBkkMlSH6LylO5QKBgQDGvI5LRqWUKPzG8XKY8ljfDohDw8slpqsr\nwSEC3qs305hSqtseiEkjRmHyUGTcCTBd60bvybOrE1AYPvaW50GoovpnzCBCOzZk\naCQh1KonbpuTTkc6GX1kr6miwi45famwvVFAIIVR2aBvNdVC3hjM3UCxVLFyUpmD\n35WE02tfTQKBgQCbV2W2rryrhtJ7MguKPnt6Uu8LCHwVEpoXQi/9aEYLr2Q7S1XP\nzMZ42mVDQ7AVJOiPrudhMwwX+EZVgnanaTee8O6CmSto8LvlHINa44kEdpL9zeJ/\ngl1QEMdMB+4OXs2f3FHIy5gX0Hg5YDieJhyXYmqC8yidRdBZGft2lapQxQKBgHIN\nhjAHNEFKIH9f05+Y/Y3NfkA9nllWREfRB0vpVCOuyG0w5p2oIykeXFm+75MjpuFP\nhB9bB0R3yfCQOd4yi4jnN4PYLu8zoiyPY6USsi/9F0W7l77tH/xnn5frjrGpv3fR\nvk5qG3j0x1DreR9t7JetplHexBNS+g0nhFx9JNLFAoGAPBDTd+nXCBjvcGnDrqgJ\n34z+XtzI0Qj9DWGMhC1euIbEqgrHtXlgvufXASeD0/SvOEjClsfYbzlTFF+T3nzM\nPIK8GsPOV7XsegepL9ak90UUoWUY/fe+Jsomz5ylPjn9TAYXEGyAk0OVqJWwyCoR\nzHfoAln4NbXJCmMXMYhVB+4=\n-----END PRIVATE KEY-----\n"
        },
        "seriea-italia": {
                "project_id": "appseriea-italia",
                "client_email": "firebase-adminsdk-fbsvc@appseriea-italia.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCqsQ0yS6LGMYUj\nMJoT1nReHlZwEHEnMuGhqQwo2oUewEJ9o3mgky0ZV3eTkuN6GHx4jDPSiWDDKBKJ\nWE7ie43US/9DPpgUyJpmr6rRxNQt9w6wtVrmoGw9y9ZUrnjTKOz/LC1KR1hKnnym\nfj/wM1cmO0rViVHnyuNxM1VnS+UNxkXceEnSunLodhy2Qaw+Vs9QAXv08bGXRvi3\n6qvo2j8zKCywciII68brHpUXQNjEvEOqe3F6PHZTLWD8R2C6QmFvgxB2pyA/X0AD\nNrAZ7Iqcan5y2KPzPVDXdiH6YPaXUiRZRjslGZo1NBnbngpsdhrQ4Ck5prixCqv8\na1FTp7G/AgMBAAECggEAL+/wclcenEXNC9B6/SZF4SbpBKkBdk5KYtHsmc6hAz1g\njxNptaiPymWvrfDbVO9qiZpqdW7ij3yCFDOKV/32G5DKXDLImFGsVzlvomECa/RO\nGl+ca1fTfllwVLD5OuhsAs//2jQGPlKbVFDxmP56M8EEJ8tchtoKnUCa9Bsy9XZr\nqZr4wha9LOjmQpoRlv2d5Euv5moBzOt/1JJRFO7atadpP/P85o717rQA/U2+TVTf\nwobZRaIUVQ7j9S5WD7m+MMx5gRX/VaxPvjbn0TbnQqagvOUjcJgvPn6izUuJPItl\nlba4iSVYyerehn8adl228vFYr/YdPErRRKu88Qf74QKBgQDZGGWpkXKIXF8MHDJv\n3EwL5Xxv2pC4vcBZ57o8691hE31QS1w/J6JF+fWzhUlklB0UmeeBPEcsh/rJ7wpY\nSldL8qODUT+QzesftzOLiB9OpJydzSiMqwSVPi6rlK3fwJl3JayMYG3sojFnIVQh\nAHiDqUiabJZ0JpenpmJ384ruYQKBgQDJR88UUuWFZI2UgbbiS1cBrGl2lotyYvZc\nYidpWD6uuqN4PSZXreOGG135wqpT3yCQIuFmW0XwfWUpm9B2uhG85smAZdSZotI4\nj4RZWFrcoPczzuF4Q/pIvl5ty6r5EpcgZLceDFLplJnVOT2DOgqTs/v1EZv60Wzz\nqpuCgr1UHwKBgQDI0hi40yLvoQMLYMoHT/HIz3BcyAI34s+cWw+ca1NOCYlSTWP3\nx+IEeUUf25wYvipodDYDBo+QUflb8xPOuHYoeztmrjHu8Y0euYmk+TZ8uSlnj/CC\nr3B93heuAMsWwEM2RFNpR4pn62Fn1RzNqnHQ2TegIfLLXyfKnc9YxqEuAQKBgHki\n4Hvoz/2R4KtpzbkvgnOdYfNe8xmqeX5sDDAYTdE2vj8U/khyfKYvPkWcZIoJlT1p\n4KGLePIdZY6/GZz6qsY3VzoRDvxPw5kKtqpWxIhXz668aXHJ5410FLybgJBaId36\n/0H0RMoTBuoOgvjBK7Bs98wsBuXSuHGFUgYfzPYdAoGBANByXut94OqJpLC8ZGJC\nbROSco2I4dnTdyCkgSB+EOhVpzx09Nyb3ZgOApH1ccwTKu/u2ZBPq+cOfv7vt3sv\nspA7ssQ3s3A5ASYd6AH3RXrtR9ydIvd3gDux/vJEz4zoN7tGm64+pEHsityLeVPs\nyRtxImc+JWRn72QgElFDGzZz\n-----END PRIVATE KEY-----\n"
        },
        "ligue1-franca": {
                "project_id": "appligue1",
                "client_email": "firebase-adminsdk-fbsvc@appligue1.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDI6hV88AB91V6Q\niTEUnS1xY7SFxFsIcCy2LTnHQ9AwtKedqHkDN/pJGOejmqkAAeg1T6yT7SxwQGTm\nd74yJ3ItUB/81tedZ1e59FTG2S7+5OXiXHxV4oGjN8rSEv8sT+GbPvGVaJ7guU7g\nCeYXc9aMZI+ZZ11dTffllzkA9+xx25YLvCwFH4OUWgU+DURPmP2PS6A6uejWdgN7\n91zGkCwk4k04OFc6HFziEAQw5Bt8ePg8Kf2Y99hgYaQ3xy3Ri+ktd2KDDwmhceDC\nHLDiItFQ/2GQ6d8pfKAL3p2MFaIRqaEkc3AnPoHXxjKhe1tHbBqFMj0eJz0MsSOE\nYyXXGNT5AgMBAAECggEAFy4kwQeqstnvgWMGud9hixPLE+Th8OEKU5F3uVUKW9g3\n/4FcxuGKO61HKnHRXkoaCa6R1XZXenL/gTSfCcfRzUcRjbkW4tb1wONe9ZtAqBFu\nMXXktX7+4H8zJBYjgTANMj1qn4eUzw4qOsCBnsKTZhrDE5qgo793YrKWFdXE3qTX\n+K1ypZCYeM4leaSl03wH4M42DIz+eJI17kxrEs9mamt1svqfWr8ZZCXbb0KJI2We\nUJEFRj+x5UMtxiUbbmt2oFWZ9Riz0ZoIgJDuQws776WCgeJEsK9469Ade2zbDDSR\nKzIfDZSAIPDgn5jNUgHbJqdSxj7QI8dvCOFcPyzwJQKBgQDqN4Ah8rG8DJyMeE6E\nwsET0jnHH0fUFnkgU5bBIlTrOiyK6i6LRq7QechhvtY2xhT11iwUihgK0XBIOBsg\nje0lBk8RUTmyfRmXx+WciaJ5dthL3IXCZ9EFZ1boEXtnUGmDhuBlG5D2Hr9mZLg7\n2XNuwVipHNzYybE5fln5Grh3/QKBgQDbma6OvVR2M3U+4maYNDyIIFoT/gfylhEi\nNzy3MXmADIuwF4joyvqiOmmOak1T4A0gJNKwZeVTQILMc6LBalsgjhvBPuE38xRo\nNPwDejbkNa+79lW4fbbS8gb1UrUp3eGITEhjjI1Zbi+RVfZxrsjImAO/0D76MY+X\niaY9oz1rrQKBgHOIvSQB27qvXenMzq6egy+L3ARlYcE09LsFgK/0h38hSyebLSp2\ny3T7HeVZhcGvJFfANi5LkGCFv6VgR8FfQUOqQQaB0rxBCYbdjF4TZpoUDc4eEb08\nCNdpim0fcogcGnBO8BHv7yn5MOEJfffH5DEWHu4M1sP5efqqYSeIDsbhAoGBAMzT\no4VwAv/dL1bgRWFiF7PAuUQ8hZ03a/PGIdOdSf6ttP0idojsCqqWYS586HN7X8LD\nleECqcvlOBsLIJvXX/gVlL3CsL9G85nfEdEMhXaGvMtNENdsKsLHDMZ1xpSuaFaB\nEGQKDS2FIMkmrR+ML6sqXxTiYFttLsnhkjWbtQZhAoGBANlfBz+Ike2oEkr51u8B\nwhHl7cuawKUxBbho+zLs1yZ5tHnuewdqBFMQFJzN4DzY6odL2s8cwH3bEPjzcP3j\nX/uJeFBvTO8hJQPyqcbS7S39dICpTaRpUoqQ7eglD5iIuOq1Wyz1PZQTTlvmiN0w\n7Gv6Ph0S7i31IXLH6qfJLU9y\n-----END PRIVATE KEY-----\n"
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

                var a = hash[0], b = hash[1], c = hash[2], d = hash[3];
                var e = hash[4], f = hash[5], g = hash[6], h = hash[7];

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
                    var c = l & 0x7f; l = 0;
                    for (var i = 0; i < c; i++) l = (l << 8) | der[offset++];
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
            var slug = (appSlug || "laliga").toLowerCase().trim();
            if (_EMBEDDED_FIREBASE_CONFIGS[slug]) {
                return _EMBEDDED_FIREBASE_CONFIGS[slug];
            }
            return _EMBEDDED_FIREBASE_CONFIGS["laliga"] || null;
        }

        function sendFcmPush(appSlug, token, title, body, dataPayload) {
            var config = getFirebaseConfig(appSlug);
            if (!config) return false;

            var accessToken = getGoogleAccessToken(config);
            if (!accessToken) return false;

            var channelId = appSlug === "laliga" ? "laliga_live_channel" : appSlug + "_live_channel";
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

        // Função interna de envio push
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
                console.log("[POCKETBASE PUSH ERROR] [" + leagueName + "] Erro ao buscar subscriptions: " + e);
            }

            if (!subscribers || subscribers.length === 0) {
                try {
                    var allSubs = [];
                    if (typeof $app.findRecordsByFilter === "function") {
                        allSubs = $app.findRecordsByFilter("subscriptions", "app_slug = '" + appSlug + "'", "", 1000, 0);
                    } else if ($app.dao && typeof $app.dao().findRecordsByFilter === "function") {
                        allSubs = $app.dao().findRecordsByFilter("subscriptions", "app_slug = '" + appSlug + "'", "", 1000, 0);
                    }
                    if (allSubs && allSubs.length > 0) {
                        for (var s = 0; s < allSubs.length; s++) {
                            var itemSub = allSubs[s];
                            var wantNotify = true;
                            if (eventType === "goal" && itemSub.getBool && !itemSub.getBool("notify_goals")) wantNotify = false;
                            if (eventType === "start" && itemSub.getBool && !itemSub.getBool("notify_start")) wantNotify = false;
                            if (eventType === "end" && itemSub.getBool && !itemSub.getBool("notify_end")) wantNotify = false;
                            if (wantNotify) subscribers.push(itemSub);
                        }
                    }
                } catch (fallbackErr) {
                    console.log("[POCKETBASE PUSH ERROR FALLBACK] " + fallbackErr);
                }
            }

            if (!subscribers || subscribers.length === 0) {
                console.log("[POCKETBASE PUSH] [" + leagueName + "] Nenhum assinante ativo para o filtro (" + filterStr + ")");
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
                        var str = "";
                        if (typeof raw === "string") {
                            str = raw;
                        } else if (typeof raw.length === "number") {
                            var chars = [];
                            for (var b = 0; b < raw.length; b++) {
                                chars.push(typeof raw[b] === "number" ? String.fromCharCode(raw[b]) : String(raw[b]));
                            }
                            str = chars.join("");
                        } else {
                            str = JSON.stringify(raw);
                        }

                        if (str && str.trim() !== "" && str.trim() !== "[]" && str.trim() !== "null" && str.trim() !== "[91,93]") {
                            var parsed = JSON.parse(str);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                for (var p = 0; p < parsed.length; p++) {
                                    var pVal = String(parsed[p]).trim();
                                    if (pVal !== "" && pVal !== "null" && pVal !== "0") list.push(pVal);
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

                    // 1. Verifica se favoritou a partida específica
                    var fixStr = String(fixtureExtId);
                    for (var fi = 0; fi < favFixtures.length; fi++) {
                        if (favFixtures[fi] === fixStr) {
                            isFavorite = true;
                            break;
                        }
                    }

                    // 2. Se não favoritou a partida, verifica se favoritou algum dos times
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

                if (!isFavorite) {
                    console.log("[POCKETBASE PUSH SKIPPED] Sub " + (sub.getString("user_name") || sub.id) + " ignorado por filtro de favoritos: Times=" + JSON.stringify(favTeams) + ", Partidas=" + JSON.stringify(favFixtures) + " (Jogo: " + fixtureExtId + " | " + homeTeamId + " vs " + awayTeamId + ")");
                }

                if (isFavorite) {
                    var pushRes = sendFcmPush(appSlug, token, eventTitle, eventBody, {
                        fixture_id: fixtureExtId.toString(),
                        app_slug: appSlug,
                        event_type: eventType
                    });

                    console.log("[POCKETBASE PUSH RESULT] Sub " + (sub.getString("user_name") || sub.id) + " -> " + (pushRes ? ("Status: " + pushRes.statusCode + " | " + JSON.stringify(pushRes.json || pushRes.raw)) : "NULL_RESULT"));

                    if (pushRes && pushRes.success) {
                        sentCount++;
                    } else if (pushRes && (pushRes.statusCode === 404 || pushRes.statusCode === 403 || (pushRes.json && pushRes.json.error && (pushRes.json.error.message === "NotRegistered" || pushRes.json.error.status === "NOT_FOUND")))) {
                        try {
                            if ($app.dao && typeof $app.dao().deleteRecord === "function") {
                                $app.dao().deleteRecord(sub);
                            } else if (typeof $app.deleteRecord === "function") {
                                $app.deleteRecord(sub);
                            } else if (typeof $app.delete === "function") {
                                $app.delete(sub);
                            }
                            console.log("[POCKETBASE PURGE 🗑️] Token órfão/desinstalado expurgado: " + token.substring(0, 15) + "... (App: " + appSlug + ")");
                        } catch (delErr) {
                            console.log("[POCKETBASE PURGE ERROR] Falha ao expurgar token: " + delErr);
                        }
                    }
                }
            }

            console.log("[POCKETBASE PUSH 🚀] [" + leagueName + "] " + sentCount + "/" + subscribers.length + " notificações enviadas com sucesso (App: " + appSlug + " | Evento: " + eventType + ")");
        }

        // 1. Busca os aplicativos ativos cadastrados na coleção 'apps' do PocketBase Europa
        var apps = [];
        try {
            if (typeof $app.findRecordsByFilter === "function") {
                apps = $app.findRecordsByFilter("apps", "active = true", "", 100, 0);
            } else if ($app.dao && typeof $app.dao().findRecordsByFilter === "function") {
                apps = $app.dao().findRecordsByFilter("apps", "active = true", "", 100, 0);
            }
        } catch (eApps) {
            console.log("[POCKETBASE APPS ERROR] " + eApps);
        }
        if (!apps || apps.length === 0) {
            console.log("[POCKETBASE CRON] Nenhum aplicativo ativo encontrado na coleção 'apps'.");
            return;
        }

        var activeAppMap = new Map();
        for (var a = 0; a < apps.length; a++) {
            var appRec = apps[a];
            var lId = appRec.getInt("league_id");
            if (lId) {
                activeAppMap.set(lId, {
                    appSlug: appRec.getString("app_slug") || "laliga",
                    appName: appRec.getString("name") || "Liga Europeia",
                    leagueId: lId
                });
            }
        }

        // 2. Consulta os jogos ao vivo na Zapscore API
        var response = $http.send({
            url: "https://zapscore-zapscore-api.gtalg3.easypanel.host/fixtures?status=LIVE",
            method: "GET",
            headers: { "Accept": "application/json" },
            timeout: 10
        });

        var allLiveFixtures = (response.statusCode === 200 && Array.isArray(response.json)) ? response.json : [];
        
        // 3. FILTRA APENAS JOGOS DAS LIGAS DO POCKETBASE EUROPA
        var europaLiveFixtures = allLiveFixtures.filter(function(f) {
            var leagueExtId = Number(f.league && f.league.externalId ? f.league.externalId : (f.league_id || (f.league && f.league.id) || 0));
            return leagueExtId && activeAppMap.has(leagueExtId);
        });

        var liveFixtureIds = new Set();

        if (europaLiveFixtures.length === 0) {
            console.log("[POCKETBASE CRON] ℹ️ Nenhuma partida europeia ao vivo no momento.");
        } else {
            console.log("[POCKETBASE CRON] ⏱️ Monitorando " + europaLiveFixtures.length + " partida(s) europeia(s) ao vivo:");
        }

        // 4. Processa cada partida europeia ao vivo
        for (var i = 0; i < europaLiveFixtures.length; i++) {
            var fixture = europaLiveFixtures[i];
            var fixtureExtId = Number(fixture.externalId || fixture.fixture_id || 0);
            if (!fixtureExtId) continue;
            liveFixtureIds.add(fixtureExtId);

            var leagueExtId = Number(fixture.league && fixture.league.externalId ? fixture.league.externalId : (fixture.league_id || (fixture.league && fixture.league.id) || 0));
            var appMeta = activeAppMap.get(leagueExtId);
            if (!appMeta) continue;

            var appSlug = appMeta.appSlug;
            var leagueName = (fixture.league && fixture.league.name) || appMeta.appName || "Europa";

            var homeTeamId = Number(fixture.homeTeam && fixture.homeTeam.externalId ? fixture.homeTeam.externalId : ((fixture.teams && fixture.teams.home && fixture.teams.home.id) || 0));
            var awayTeamId = Number(fixture.awayTeam && fixture.awayTeam.externalId ? fixture.awayTeam.externalId : ((fixture.teams && fixture.teams.away && fixture.teams.away.id) || 0));
            var homeTeamName = (fixture.homeTeam && fixture.homeTeam.name) || (fixture.teams && fixture.teams.home && fixture.teams.home.name) || "Mandante";
            var awayTeamName = (fixture.awayTeam && fixture.awayTeam.name) || (fixture.teams && fixture.teams.away && fixture.teams.away.name) || "Visitante";
            var currentHomeScore = Number(fixture.homeGoals != null ? fixture.homeGoals : (fixture.goals ? fixture.goals.home : 0));
            var currentAwayScore = Number(fixture.awayGoals != null ? fixture.awayGoals : (fixture.goals ? fixture.goals.away : 0));
            var currentStatus = (fixture.statusShort || (fixture.status && fixture.status.short) || "1H").toString();
            
            // Extração da Minutagem
            var currentElapsed = fixture.elapsed != null ? fixture.elapsed : ((fixture.status && fixture.status.elapsed) || "");
            var elapsedStr = currentElapsed ? " - " + currentElapsed + "'" : "";
            var statusDisplay = currentStatus + elapsedStr;

            // Log individual com Minutagem em tempo real
            console.log("[POCKETBASE CRON] ⚽ [" + leagueName + "] " + homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName + " (" + statusDisplay + ") - Monitorando...");

            // 5. Verifica o estado da partida no 'match_cache' do PocketBase
            var cacheRecord;
            try {
                cacheRecord = $app.findFirstRecordByData("match_cache", "fixture_id", fixtureExtId);
            } catch (e) {
                cacheRecord = null;
            }

            // CASO 1: Primeira vez vendo este jogo ao vivo
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

                console.log("[POCKETBASE CRON] 🆕 [" + leagueName + "] Novo jogo registrado no cache: " + homeTeamName + " vs " + awayTeamName + " (" + appSlug + ")");

                // Se o jogo apareceu pela primeira vez e está em 1H / LIVE, DISPARA O INÍCIO!
                if (currentStatus === "1H" || currentStatus === "LIVE") {
                    var eventTitle = "🔔 INÍCIO DE JOGO!";
                    var eventBody = homeTeamName + " x " + awayTeamName + " - A bola está rolando!";
                    console.log("[POCKETBASE EVENT 🔔] [" + leagueName + "] INÍCIO DE JOGO: " + homeTeamName + " vs " + awayTeamName + " (App: " + appSlug + ")");
                    executePush(appSlug, leagueName, homeTeamId, awayTeamId, fixtureExtId, "start", eventTitle, eventBody);
                }
                continue;
            }

            // CASO 2: Jogo já existente no cache — compara alterações
            var prevHomeScore = cacheRecord.getInt("home_score");
            var prevAwayScore = cacheRecord.getInt("away_score");
            var prevStatus = cacheRecord.getString("status");

            var eventTitle = "";
            var eventBody = "";
            var eventType = "";

            // Detecta GOL Mandante
            if (currentHomeScore > prevHomeScore) {
                eventTitle = "⚽ GOL DO " + homeTeamName.toUpperCase() + "!";
                eventBody = homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName;
                eventType = "goal";
            }
            // Detecta GOL Visitante
            else if (currentAwayScore > prevAwayScore) {
                eventTitle = "⚽ GOL DO " + awayTeamName.toUpperCase() + "!";
                eventBody = homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName;
                eventType = "goal";
            }
            // Detecta Início de Jogo (Transição explícita NS -> 1H/LIVE)
            else if (prevStatus === "NS" && (currentStatus === "1H" || currentStatus === "LIVE")) {
                eventTitle = "🔔 INÍCIO DE JOGO!";
                eventBody = homeTeamName + " x " + awayTeamName + " - A bola está rolando!";
                eventType = "start";
            }
            // Detecta Fim de Jogo direto no feed ao vivo
            else if (prevStatus !== "FT" && (currentStatus === "FT" || currentStatus === "AET" || currentStatus === "PEN")) {
                eventTitle = "🏁 FIM DE JOGO!";
                eventBody = "Placar Final: " + homeTeamName + " " + currentHomeScore + " x " + currentAwayScore + " " + awayTeamName;
                eventType = "end";
            }

            // Atualiza o cache com placar, status e minutagem atualizada
            cacheRecord.set("home_score", Number(currentHomeScore));
            cacheRecord.set("away_score", Number(currentAwayScore));
            cacheRecord.set("status", currentStatus ? currentStatus.toString() : "1H");
            cacheRecord.set("last_event_hash", currentElapsed ? String(currentElapsed) : "TICK");
            try {
                if (currentElapsed) cacheRecord.set("minute", String(currentElapsed));
            } catch (_) {}
            $app.save(cacheRecord);

            // Se houve evento relevante, dispara notificações
            if (eventTitle) {
                console.log("[POCKETBASE EVENT 📢] [" + leagueName + "] " + eventTitle + " | " + eventBody + " (App: " + appSlug + ")");
                executePush(appSlug, leagueName, homeTeamId, awayTeamId, fixtureExtId, eventType, eventTitle, eventBody);
            }
        }

        // 6. VERIFICAÇÃO DE FIM DE JOGO PARA PARTIDAS QUE SAÍRAM DO FEED AO VIVO
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

            // Se ainda está no feed ao vivo ativo, já foi processada acima
            if (liveFixtureIds.has(cachedFixtureId)) continue;

            var leagueExtId = cachedMatch.getInt("league_id");
            var appMeta = activeAppMap.get(leagueExtId);
            if (!appMeta) {
                continue;
            }

            var appSlug = appMeta.appSlug;
            var leagueName = appMeta.appName || "Europa";

            // Consulta os jogos de hoje da liga específica na ZapScore API
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

                            console.log("[POCKETBASE EVENT 🏁] [" + leagueName + "] FIM DE PARTIDA: " + eventBody + " (App: " + appSlug + ")");
                            executePush(appSlug, leagueName, homeTeamId, awayTeamId, cachedFixtureId, "end", eventTitle, eventBody);
                        }
                    }
                }
            } catch (errCheck) {
                console.log("[POCKETBASE CRON] [" + leagueName + "] Erro ao checar status final do jogo " + cachedFixtureId + ": " + errCheck);
            }
        }

    } catch (err) {
        console.log("[POCKETBASE CRON ERROR] Falha no Cron de Notificações: " + err);
    }
});
