const assert = require("assert");
const SuperTokens = require("../..");
const { reset } = require("../../lib/build/helpers/utils");
const config = require("../config");
const supertest = require("supertest");
let app = require("./app");

describe("SuperToken", function() {
    it("create new session function", async function() {
        await new Promise(async function(resolve, reject) {
            await reset(config.minConfigTest);
            assert.strictEqual(typeof SuperTokens.createNewSession, "function");
            const userId = "testing";
            const jwtPaylaod = { a: "testing" };
            const sessionData = { s: "session" };
            supertest(app)
                .post("/login")
                .send({
                    userId: "testing",
                    jwtPaylaod: {
                        a: "jwt payload"
                    },
                    sessionData: {
                        s: "session data"
                    }
                })
                .expect(200)
                .then(function(res) {
                    const cookies = res.headers["set-cookie"];
                    let sAccessTokenCookieFound = false;
                    let sRefreshTokenCookieFound = false;
                    let sIdRefreshTokenCookieFound = false;
                    assert.strictEqual(Array.isArray(cookies), true);
                    for (let i = 0; i < cookies.length; i++) {
                        if (cookies[i].includes("sAccessToken=")) {
                            sAccessTokenCookieFound = true;
                        } else if (cookies[i].includes("sRefreshToken")) {
                            sRefreshTokenCookieFound = true;
                        } else if (cookies[i].includes("sIdRefreshToken")) {
                            sIdRefreshTokenCookieFound = true;
                        }
                    }
                    if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
                        reject();
                        return;
                    }
                    resolve();
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    });
});
