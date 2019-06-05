const cookie = require("../lib/build/cookie");
const assert = require("assert");
const http = require("http");
const cookieParser = require("cookie-parser");
const supertest = require("supertest");

describe("Cookie", () => {
    it("set-get cookie", function() {
        const request = new http.IncomingMessage();
        const response = new http.OutgoingMessage();
        assert.strictEqual(typeof cookie.setCookie, "function");
        assert.strictEqual(typeof cookie.getCookieValue, "function");
    });
});
