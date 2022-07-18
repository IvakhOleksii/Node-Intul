import { sendJobAlerts } from "../services/Job";
import { consoleLog } from "../utils";

(async () => {
    try {
        consoleLog('/// CRON_JOB_STARTED: SEND_JOB_ALERTS');
        await sendJobAlerts();
    } catch (error) {
        consoleLog(error);
    }
    consoleLog('/// CRON_JOB_ENDED: SEND_JOB_ALERTS');
    process.exit();
})();