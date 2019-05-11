import Config from "./config";

class Auth {
    constructor () {}

    static init (config: any) {
        Config.set(config);
    }
}

export = Auth;