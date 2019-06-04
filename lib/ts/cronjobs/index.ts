import { CronJob } from "cron";

import { errorLogging, infoLogging } from "../helpers/logging";
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

    private constructor() {
        jobs.forEach(job => {
            createNewJob(
                job.jobFunction,
                job.interval,
                job.description
            ).start();
        });
    }

    static init() {
        if (Cronjob.instance === undefined) {
            Cronjob.instance = new Cronjob();
        }
    }
}

/**
 *
 * @param job
 * @param interval
 * @param jobDescription
 */
function createNewJob(
    job: Function,
    interval: string,
    jobDescription: string
): CronJob {
    return new CronJob({
        cronTime: interval,
        onTick: async () => {
            try {
                const startTime = Date.now();
                const startLog = `cron job started : ${jobDescription}`;
                infoLogging(startLog);
                await job();
                const endLog = `cron job ended : ${jobDescription}. time taken : ${Date.now() -
                    startTime}ms`;
                infoLogging(endLog);
            } catch (err) {
                errorLogging(err);
            }
        },
        start: false
    });
}

const jobs = [
    {
        jobFunction: oldRefreshTokenRemoval,
        interval: "0 0 0 1-31/7 * *", // run once every week starting from when this process starts. Feel free to change this as per your needs.
        description: "remove old expired refresh tokens"
    }
];
