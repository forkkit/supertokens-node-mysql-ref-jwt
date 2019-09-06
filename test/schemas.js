let definitions = {
    token: {
        type: "object",
        properties: {
            value: {
                type: "string"
            },
            expires: {
                type: "integer"
            }
        },
        required: ["value", "expires"],
        additionalProperties: false
    },
    session: {
        type: "object",
        properties: {
            handle: {
                type: "string"
            },
            userId: {
                type: ["string", "integer"]
            },
            jwtPayload: {
                type: ["object", "array", "integer", "string", "boolean", "null"]
            }
        },
        required: ["handle", "userId", "jwtPayload"],
        additionalProperties: false
    },
    antiCsrfNotUndefined: {
        type: "string"
    },
    antiCsrfUndefined: {
        type: "null"
    },
    none: {
        type: "null"
    }
};

module.exports.schemaCreateNewSessionACTEnabled = {
    type: "object",
    properties: {
        accessToken: definitions.token,
        idRefreshToken: definitions.token,
        refreshToken: definitions.token,
        antiCsrfToken: definitions.antiCsrfNotUndefined,
        session: definitions.session
    },
    required: ["accessToken", "idRefreshToken", "refreshToken", "antiCsrfToken", "session"],
    additionalProperties: false
};

module.exports.schemaCreateNewSessionACTDisabled = {
    type: "object",
    properties: {
        accessToken: definitions.token,
        idRefreshToken: definitions.token,
        refreshToken: definitions.token,
        antiCsrfToken: definitions.antiCsrfUndefined,
        session: definitions.session
    },
    required: ["accessToken", "idRefreshToken", "refreshToken", "session"],
    additionalProperties: false
};

module.exports.schemaRefreshSessionACTEnabled = {
    type: "object",
    properties: {
        newAccessToken: definitions.token,
        newIdRefreshToken: definitions.token,
        newRefreshToken: definitions.token,
        newAntiCsrfToken: definitions.antiCsrfNotUndefined,
        session: definitions.session
    },
    required: ["newAccessToken", "newIdRefreshToken", "newRefreshToken", "newAntiCsrfToken", "session"],
    additionalProperties: false
};

module.exports.schemaRefreshSessionACTDisabled = {
    type: "object",
    properties: {
        newAccessToken: definitions.token,
        newIdRefreshToken: definitions.token,
        newRefreshToken: definitions.token,
        newAntiCsrfToken: definitions.antiCsrfUndefined,
        session: definitions.session
    },
    required: ["newAccessToken", "newIdRefreshToken", "newRefreshToken", "session"],
    additionalProperties: false
};

module.exports.schemaNewSessionGet = {
    type: "object",
    properties: {
        session: definitions.session,
        newAccessToken: definitions.none
    },
    required: ["session"],
    additionalProperties: false
};

module.exports.schemaUpdatedAccessTokenSessionGet = {
    type: "object",
    properties: {
        session: definitions.session,
        newAccessToken: definitions.token
    },
    required: ["session", "newAccessToken"],
    additionalProperties: false
};
