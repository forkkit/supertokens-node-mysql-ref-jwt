const assert = require("assert");
const SuperTokens = require("../..");
const { reset, delay } = require("../../lib/build/helpers/utils");
const config = require("../config");
const supertest = require("supertest");
let app = require("./app");
const { printPath } = require("../utils");
const errors = require("../../lib/build/error");

describe(`SuperToken: ${printPath("[test/supertoken/supertoken.test.js]")}`, function() {
    it("create, get and refresh session", async function() {
        await reset(config.configWithShortValidityForAccessToken);
        assert.strictEqual(typeof SuperTokens.createNewSession, "function");
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        let sAccessTokenCookie = undefined;
        let sRefreshTokenCookie = undefined;
        let sIdRefreshTokenCookie = undefined;

        // login | signup
        let response = await supertest(app)
            .post("/login")
            .send({
                userId,
                jwtPayload,
                sessionData
            })
            .expect(200);
        let cookies = response.headers["set-cookie"];
        let sAccessTokenCookieFound = false;
        let sRefreshTokenCookieFound = false;
        let sIdRefreshTokenCookieFound = false;
        assert.strictEqual(Array.isArray(cookies), true);
        for (let i = 0; i < cookies.length; i++) {
            if (cookies[i].includes("sAccessToken=")) {
                sAccessTokenCookieFound = true;
                sAccessTokenCookie = cookies[i];
            } else if (cookies[i].includes("sRefreshToken")) {
                sRefreshTokenCookieFound = true;
                sRefreshTokenCookie = cookies[i];
            } else if (cookies[i].includes("sIdRefreshToken")) {
                sIdRefreshTokenCookieFound = true;
                sIdRefreshTokenCookie = cookies[i];
            }
        }
        if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
            throw Error("");
        }

        response = await supertest(app)
            .get("/")
            .set("Cookie", [sAccessTokenCookie, sIdRefreshTokenCookie])
            .expect(200);
        if (!response.body.success) {
            throw Error("test failed");
        }
        await delay(1500);

        response = await supertest(app)
            .get("/")
            .set("Cookie", [sAccessTokenCookie, sIdRefreshTokenCookie])
            .expect(200);
        if (response.body.errCode !== errors.AuthError.TRY_REFRESH_TOKEN) {
            throw Error("test failed");
        }

        response = await supertest(app)
            .post("/refresh")
            .set("Cookie", [sRefreshTokenCookie, sAccessTokenCookie, sIdRefreshTokenCookie])
            .expect(200);
        cookies = response.headers["set-cookie"];
        sAccessTokenCookieFound = false;
        sRefreshTokenCookieFound = false;
        sIdRefreshTokenCookieFound = false;
        assert.strictEqual(Array.isArray(cookies), true);
        let oldAccessTokenCookie = undefined;
        let oldRefreshTokenCookie = undefined;
        let oldIdRefreshTokenCookie = undefined;
        for (let i = 0; i < cookies.length; i++) {
            if (cookies[i].includes("sAccessToken=")) {
                sAccessTokenCookieFound = true;
                if (cookies[i] === sAccessTokenCookie) {
                    throw Error("access token still same as last access token");
                }
                oldAccessTokenCookie = sAccessTokenCookie;
                sAccessTokenCookie = cookies[i];
            } else if (cookies[i].includes("sRefreshToken")) {
                sRefreshTokenCookieFound = true;
                if (cookies[i] === sRefreshTokenCookie) {
                    throw Error("refresh token still same as last refresh token");
                }
                oldRefreshTokenCookie = sRefreshTokenCookieFound;
                sRefreshTokenCookie = cookies[i];
            } else if (cookies[i].includes("sIdRefreshToken")) {
                sIdRefreshTokenCookieFound = true;
                if (cookies[i] === sIdRefreshTokenCookie) {
                    throw Error("id refresh token still same as last id refresh token");
                }
                oldIdRefreshTokenCookie = sIdRefreshTokenCookie;
                sIdRefreshTokenCookie = cookies[i];
            }
        }
        if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
            throw Error("");
        }

        response = await supertest(app)
            .get("/")
            .set("Cookie", [sAccessTokenCookie, sIdRefreshTokenCookie])
            .expect(200);
        if (!response.body.success) {
            throw Error("test failed");
        }

        response = await supertest(app)
            .post("/refresh")
            .set("Cookie", [oldRefreshTokenCookie, oldAccessTokenCookie, oldIdRefreshTokenCookie])
            .expect(200);
        if (response.body.errCode !== errors.AuthError.UNAUTHORISED) {
            throw Error("test failed");
        }
    });

    it("revoke session", async function() {
        await reset(config.minConfigTest);
        assert.strictEqual(typeof SuperTokens.createNewSession, "function");
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        let sAccessTokenCookie = undefined;
        let sRefreshTokenCookie = undefined;
        let sIdRefreshTokenCookie = undefined;

        // login | signup
        let response = await supertest(app)
            .post("/login")
            .send({
                userId,
                jwtPayload,
                sessionData
            })
            .expect(200);
        let cookies = response.headers["set-cookie"];
        let sAccessTokenCookieFound = false;
        let sRefreshTokenCookieFound = false;
        let sIdRefreshTokenCookieFound = false;
        assert.strictEqual(Array.isArray(cookies), true);
        for (let i = 0; i < cookies.length; i++) {
            if (cookies[i].includes("sAccessToken=")) {
                sAccessTokenCookieFound = true;
                sAccessTokenCookie = cookies[i];
            } else if (cookies[i].includes("sRefreshToken")) {
                sRefreshTokenCookieFound = true;
                sRefreshTokenCookie = cookies[i];
            } else if (cookies[i].includes("sIdRefreshToken")) {
                sIdRefreshTokenCookieFound = true;
                sIdRefreshTokenCookie = cookies[i];
            }
        }
        if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
            throw Error("");
        }

        response = await supertest(app)
            .get("/")
            .set("Cookie", [sAccessTokenCookie, sIdRefreshTokenCookie])
            .expect(200);
        if (!response.body.success) {
            throw Error("test failed");
        }

        response = await supertest(app)
            .post("/logout")
            .set("Cookie", [sRefreshTokenCookie, sAccessTokenCookie, sIdRefreshTokenCookie])
            .expect(200);
        if (!response.body.success) {
            throw Error("test failed");
        }

        response = await supertest(app)
            .post("/refresh")
            .set("Cookie", [sRefreshTokenCookie, sAccessTokenCookie, sIdRefreshTokenCookie])
            .expect(200);
        if (response.body.errCode !== errors.AuthError.UNAUTHORISED) {
            throw Error("test failed");
        }
    });

    it("refresh token expired", async function() {
        await reset(config.minConfigTest);
        assert.strictEqual(typeof SuperTokens.createNewSession, "function");
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        let sAccessTokenCookie = undefined;
        let sRefreshTokenCookie = undefined;
        let sIdRefreshTokenCookie = undefined;

        // login | signup
        let response = await supertest(app)
            .post("/login")
            .send({
                userId,
                jwtPayload,
                sessionData
            })
            .expect(200);
        let cookies = response.headers["set-cookie"];
        let sAccessTokenCookieFound = false;
        let sRefreshTokenCookieFound = false;
        let sIdRefreshTokenCookieFound = false;
        assert.strictEqual(Array.isArray(cookies), true);
        for (let i = 0; i < cookies.length; i++) {
            if (cookies[i].includes("sAccessToken=")) {
                sAccessTokenCookieFound = true;
                sAccessTokenCookie = cookies[i];
            } else if (cookies[i].includes("sRefreshToken")) {
                sRefreshTokenCookieFound = true;
                sRefreshTokenCookie = cookies[i];
            } else if (cookies[i].includes("sIdRefreshToken")) {
                sIdRefreshTokenCookieFound = true;
                sIdRefreshTokenCookie = cookies[i];
            }
        }
        if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
            throw Error("");
        }

        response = await supertest(app)
            .get("/")
            .set("Cookie", [sAccessTokenCookie, sIdRefreshTokenCookie])
            .expect(200);
        if (!response.body.success) {
            throw Error("test failed");
        }

        // this will remove refresh token from db
        await reset(config.minConfigTest);

        response = await supertest(app)
            .post("/refresh")
            .set("Cookie", [sRefreshTokenCookie, sAccessTokenCookie, sIdRefreshTokenCookie])
            .expect(200);
        if (response.body.errCode !== errors.AuthError.UNAUTHORISED) {
            throw Error("test failed");
        }
    });

    it("revoke all session for user", async function() {
        await reset(config.minConfigTest);
        assert.strictEqual(typeof SuperTokens.createNewSession, "function");
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        let sAccessTokenCookie1 = undefined;
        let sRefreshTokenCookie1 = undefined;
        let sIdRefreshTokenCookie1 = undefined;
        let sAccessTokenCookie2 = undefined;
        let sRefreshTokenCookie2 = undefined;
        let sIdRefreshTokenCookie2 = undefined;

        // login | signup
        let response = await supertest(app)
            .post("/login")
            .send({
                userId,
                jwtPayload,
                sessionData
            })
            .expect(200);
        let cookies = response.headers["set-cookie"];
        let sAccessTokenCookieFound = false;
        let sRefreshTokenCookieFound = false;
        let sIdRefreshTokenCookieFound = false;
        assert.strictEqual(Array.isArray(cookies), true);
        for (let i = 0; i < cookies.length; i++) {
            if (cookies[i].includes("sAccessToken=")) {
                sAccessTokenCookieFound = true;
                sAccessTokenCookie1 = cookies[i];
            } else if (cookies[i].includes("sRefreshToken")) {
                sRefreshTokenCookieFound = true;
                sRefreshTokenCookie1 = cookies[i];
            } else if (cookies[i].includes("sIdRefreshToken")) {
                sIdRefreshTokenCookieFound = true;
                sIdRefreshTokenCookie1 = cookies[i];
            }
        }
        if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
            throw Error("");
        }

        response = await supertest(app)
            .post("/login")
            .send({
                userId,
                jwtPayload,
                sessionData
            })
            .expect(200);
        cookies = response.headers["set-cookie"];
        sAccessTokenCookieFound = false;
        sRefreshTokenCookieFound = false;
        sIdRefreshTokenCookieFound = false;
        assert.strictEqual(Array.isArray(cookies), true);
        for (let i = 0; i < cookies.length; i++) {
            if (cookies[i].includes("sAccessToken=")) {
                sAccessTokenCookieFound = true;
                sAccessTokenCookie2 = cookies[i];
            } else if (cookies[i].includes("sRefreshToken")) {
                sRefreshTokenCookieFound = true;
                sRefreshTokenCookie2 = cookies[i];
            } else if (cookies[i].includes("sIdRefreshToken")) {
                sIdRefreshTokenCookieFound = true;
                sIdRefreshTokenCookie2 = cookies[i];
            }
        }
        if (!sAccessTokenCookieFound || !sRefreshTokenCookieFound || !sIdRefreshTokenCookieFound) {
            throw Error("");
        }

        response = await supertest(app)
            .get("/")
            .set("Cookie", [sAccessTokenCookie1, sIdRefreshTokenCookie1])
            .expect(200);
        if (!response.body.success) {
            throw Error("test failed");
        }

        response = await supertest(app)
            .get("/")
            .set("Cookie", [sAccessTokenCookie2, sIdRefreshTokenCookie2])
            .expect(200);
        if (!response.body.success) {
            throw Error("test failed");
        }

        response = await supertest(app)
            .post("/revokeAll")
            .set("Cookie", [sRefreshTokenCookie1, sAccessTokenCookie1, sIdRefreshTokenCookie1])
            .expect(200);
        if (!response.body.success) {
            throw Error("test failed");
        }

        response = await supertest(app)
            .post("/refresh")
            .set("Cookie", [sRefreshTokenCookie1, sAccessTokenCookie1, sIdRefreshTokenCookie1])
            .expect(200);
        if (response.body.errCode !== errors.AuthError.UNAUTHORISED) {
            throw Error("test failed");
        }

        response = await supertest(app)
            .post("/refresh")
            .set("Cookie", [sRefreshTokenCookie2, sAccessTokenCookie2, sIdRefreshTokenCookie2])
            .expect(200);
        if (response.body.errCode !== errors.AuthError.UNAUTHORISED) {
            throw Error("test failed");
        }
    });
});
