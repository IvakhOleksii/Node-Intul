import { BullhornService } from "../services/BullhornService";
import { consoleLog } from "../utils";

const testMode = process.argv[2] === "test";

(async () => {
    try {
        consoleLog('/// CRON_JOB_STARTED: BULLHORN_GET_CANDIDATES');
        await (await BullhornService.getClient()).getCandidates(testMode, 50);
    } catch (error) {
        consoleLog(error);
    }
    consoleLog('/// CRON_JOB_ENDED: BULLHORN_GET_CANDIDATES');
    process.exit();
})();