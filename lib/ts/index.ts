import { 
    Config,
    TypeInputConfig
} from "./config";

class Auth {
    constructor () {}

    static init (config: TypeInputConfig) {
        Config.set(config);
    }
}

export = Auth;