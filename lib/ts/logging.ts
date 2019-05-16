import { Config } from "./config";

const config = Config.get();

export function errorLogging(err: any) {
    if (config.logging.error !== undefined) {
        config.logging.error(err);
    }
}

export function infoLogging(info: any) {
    if (config.logging.info !== undefined) {
        config.logging.info(info);
    }
}