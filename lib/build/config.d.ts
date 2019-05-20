import { TypeConfig, TypeInputConfig } from './helpers/types';
export default class Config {
    private static instance;
    private config;
    private constructor();
    static init(config: TypeInputConfig): void;
    static get(): TypeConfig;
}
