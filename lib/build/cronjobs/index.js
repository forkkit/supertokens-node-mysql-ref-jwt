"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cron_1 = require("cron");
const logging_1 = require("../helpers/logging");
const oldRefreshTokenRemoval_1 = require("./oldRefreshTokenRemoval");
/**
 *  Seconds: 0-59
 *  Minutes: 0-59
 *  Hours: 0-23
 *  Day of Month: 1-31
 *  Months: 0-11
 *  Day of Week: 0-6 (starts with sunday)
 */
/**
 * @class
 */
class Cronjob {
    constructor() {
        jobs.forEach(job => {
            createNewJob(job.jobFunction, job.interval, job.description).start();
        });
    }
    static init() {
        if (Cronjob.instance === undefined) {
            Cronjob.instance = new Cronjob();
        }
    }
}
exports.default = Cronjob;
/**
 *
 * @param job
 * @param interval
 * @param jobDescription
 */
function createNewJob(job, interval, jobDescription) {
    return new cron_1.CronJob({
        cronTime: interval,
        onTick: () => __awaiter(this, void 0, void 0, function* () {
            try {
                const startTime = Date.now();
                const startLog = `cron job started : ${jobDescription}`;
                logging_1.infoLogging(startLog);
                yield job();
                const endLog = `cron job ended : ${jobDescription}. time taken : ${Date.now() - startTime}ms`;
                logging_1.infoLogging(endLog);
            }
            catch (err) {
                logging_1.errorLogging(err);
            }
        }),
        start: false
    });
}
const jobs = [{
        jobFunction: oldRefreshTokenRemoval_1.default,
        interval: "0 0 0 1-31/7 * *",
        description: "remove old expired refresh tokens"
    }];
//# sourceMappingURL=index.js.map