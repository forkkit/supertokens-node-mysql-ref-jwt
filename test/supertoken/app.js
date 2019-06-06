const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const SuperTokens = require("../..");

let urlencodedParser = bodyParser.urlencoded({ limit: "20mb", extended: true, parameterLimit: 20000 });
let jsonParser = bodyParser.json({ limit: "20mb" });

let app = express();
app.use(urlencodedParser);
app.use(jsonParser);
app.use(cookieParser());

app.post("/login", async (req, res, next) => {
    const userId = req.body.userId;
    const jwtPaylaod = req.body.jwtPaylaod;
    const sessionData = req.body.sessionData;
    await SuperTokens.createNewSession(res, userId, jwtPaylaod, sessionData);
    res.send("success");
});

module.exports = app;
