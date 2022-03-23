
import cron from 'node-cron';
import { BullhornService } from '../services/BullhornService';
import { GetroService } from '../services/GetroService';
import { consoleLog } from '../utils';

const testMode = false;

const setupCronJobs = () => {

    cron.schedule('* 0 * * *', async () => {
        try {
            consoleLog('/// CRON_JOB_STARTED: BULLHORN_GET_COMPANIES');
            await (await BullhornService.getClient()).getCompanies(testMode, 50);
        } catch (error) {
            consoleLog(error);
        }
        consoleLog('/// CRON_JOB_ENDED: BULLHORN_GET_COMPANIES');
    });

    cron.schedule('* 4 * * *', async () => {
        try {
            consoleLog('/// CRON_JOB_STARTED: BULLHORN_GET_JOBS');
            await (await BullhornService.getClient()).getJobs(testMode, 50);
        } catch (error) {
            consoleLog(error);
        }
        consoleLog('/// CRON_JOB_ENDED: BULLHORN_GET_JOBS');
    });

    cron.schedule('* 8 * * *', async () => {
        try {
            consoleLog('/// CRON_JOB_STARTED: BULLHORN_GET_CLIENTCONTACTS');
            await (await BullhornService.getClient()).getClientContacts(testMode, 50);
        } catch (error) {
            consoleLog(error);
        }
        consoleLog('/// CRON_JOB_ENDED: BULLHORN_GET_CLIENTCONTACTS');
    });

    cron.schedule('* 12 * * *', async () => {
        try {
            consoleLog('/// CRON_JOB_STARTED: BULLHORN_GET_CANDIDATES');
            await (await BullhornService.getClient()).getCandidates(testMode, 50);
        } catch (error) {
            consoleLog(error);
        }
        consoleLog('/// CRON_JOB_ENDED: BULLHORN_GET_CANDIDATES');
    });

    cron.schedule('* 17 * * *', async () => {
        try {
            consoleLog('/// CRON_JOB_STARTED: BULLHORN_GET_LEADS');
            await (await BullhornService.getClient()).getLeads(testMode, 50);
        } catch (error) {
            consoleLog(error);
        }
        consoleLog('/// CRON_JOB_ENDED: BULLHORN_GET_LEADS');
    });

    cron.schedule('* 0 * * *', async () => {
        try {
            consoleLog('/// CRON_JOB_STARTED: GETRO_GET_COMPANIES');
            await (await GetroService.getClient()).getCompanies(testMode, 50);
        } catch (error) {
            consoleLog(error);
        }
        consoleLog('/// CRON_JOB_ENDED: GETRO_GET_COMPANIES');
    });

    cron.schedule('* 8 * * *', async () => {
        try {
            consoleLog('/// CRON_JOB_STARTED: GETRO_GET_JOBS');
            await (await GetroService.getClient()).getJobs(testMode, 50);
        } catch (error) {
            consoleLog(error);
        }
        consoleLog('/// CRON_JOB_ENDED: GETRO_GET_JOBS');
    });

    cron.schedule('* 16 * * *', async () => {
        try {
            consoleLog('/// CRON_JOB_STARTED: GETRO_GET_MEMBERS');
            await (await GetroService.getClient()).getMembers(testMode, 50);
        } catch (error) {
            consoleLog(error);
        }
        consoleLog('/// CRON_JOB_ENDED: GETRO_GET_MEMBERS');
    });
};

export default setupCronJobs;