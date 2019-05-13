import { 
    Config,
    TypeInputConfig
} from "./config";
import {
    Mysql
} from "./mysql";

class Auth {
    constructor () {}

    static async init (config: TypeInputConfig) {
        Config.set(config);
        await Mysql.init();
    }
}

export = Auth;