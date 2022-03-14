import { GetroService } from "../services/GetroService";
import { consoleLog } from "../utils";
const testMode = process.argv[2] === "test";

(async () => {
    try {
        consoleLog('/// CRON_JOB_STARTED: GETRO_GET_MEMBERS');
        await (await GetroService.getClient()).getMembers(testMode, 50);
    } catch (error) {
        consoleLog(error);
    }
    consoleLog('/// CRON_JOB_ENDED: GETRO_GET_MEMBERS');
    process.exit();
})();