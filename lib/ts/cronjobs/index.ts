import { CronJob } from "cron";

import Config from "../config";
import { errorLogging, infoLogging } from "../helpers/logging";
import { TypeConfig } from "../helpers/types";
import oldRefreshTokenRemoval from "./oldRefreshTokenRemoval";

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
export default class Cronjob {
    private static instance: Cronjob | undefined;

    private constructor(config: TypeConfig) {
        const jobs = [
            {
                jobFunction: oldRefreshTokenRemoval,
                interval: config.tokens.refreshToken.removalCronjobInterval,
                description: "remove old expired refresh tokens"
            }
        ];
        jobs.forEach(job => {
            createNewJob(job.jobFunction, job.interval, job.description).start();
        });
    }

    static init() {
        const config = Config.get();
        if (Cronjob.instance === undefined) {
            Cronjob.instance = new Cronjob(config);
        }
    }
}

/**
 *
 * @param job
 * @param interval
 * @param jobDescription
 */
function createNewJob(job: Function, interval: string, jobDescription: string): CronJob {
    return new CronJob({
        cronTime: interval,
        onTick: async () => {
            try {
                const startTime = Date.now();
                const startLog = `cron job started : ${jobDescription}`;
                infoLogging(startLog);
                await job();
                const endLog = `cron job ended : ${jobDescription}. time taken : ${Date.now() - startTime}ms`;
                infoLogging(endLog);
            } catch (err) {
                errorLogging(err);
            }
        },
        start: false
    });
}
