import { User } from "../types/User";
import { BigQueryService } from "../services/BigQueryService";
import { DATASET_BULLHORN, DATASET_GETRO, DATASET_MAIN, Tables } from "../types/Common";
import { genUUID, isExistByCondition } from "./";

export const saveApplication = async (job: string, candidate: string) => {
    try {
        const condition = `job = '${job}' AND candidate = '${candidate}'`;
        const dataset = DATASET_MAIN;
        const table = Tables.APPLICATIONS;
        const appliedOn = new Date().getTime();
        const id = genUUID();
        const existing = await isExistByCondition(condition, dataset, table);
        if (!existing) {
            const query = `
                INSERT INTO \`${dataset}.${table}\` (id, job, candidate, appliedOn)
                VALUES ('${id}', '${job}', '${candidate}', '${appliedOn}')
            `;
            console.log(query);
            const options = {
                query: query,
                location: 'US',
            };
            const [jobBg] = await BigQueryService.getClient().createQueryJob(options);
            await jobBg.getQueryResults();
            return {
                result: true
            };
        }
        return {
            result: false,
            message: 'already applied'
        };
    } catch (error) {
        console.log(error);
        return { result: false, message: error };
    }
}

export const saveJob = async (job: string, candidate: string) => {
    try {
        const condition = `job = '${job}' AND candidate = '${candidate}'`;
        const dataset = DATASET_MAIN;
        const table = Tables.SAVEDJOBS;
        const id = genUUID();
        const existing = await isExistByCondition(condition, dataset, table);
        let query = null;
        if (!existing) {
            query = `
                INSERT INTO \`${dataset}.${table}\` (id, job, candidate)
                VALUES ('${id}', '${job}', '${candidate}')
            `;
        } else {
            query = `
                DELETE FROM \`${dataset}.${table}\`
                WHERE ${condition}
            `;
        }
        console.log(query);
        const options = {
            query: query,
            location: 'US',
        };
        const [jobBg] = await BigQueryService.getClient().createQueryJob(options);
        await jobBg.getQueryResults();
        return {
            result: true,
            messsage: existing ? 'unsaved job' : 'saved job'
        };
    } catch (error) {
        console.log(error);
        return { result: false, message: error };
    }
}

export const getSavedJobs = async (candidate: string) => {
    try {
        const condition = `candidate = '${candidate}'`;
        const datasetMain = DATASET_MAIN;
        const datasetBullhorn = DATASET_BULLHORN;
        const datasetGetro = DATASET_GETRO;
        const savedJobtable = Tables.SAVEDJOBS;
        const jobTable = Tables.JOBS;
        const query = `
            SELECT * 
            FROM (SELECT job FROM \`${datasetMain}.${savedJobtable}\` WHERE ${condition}) AS savedJob
            LEFT JOIN \`${datasetBullhorn}.${jobTable}\` AS bullhornJob
            ON savedJob.job = bullhornJob.id
            LEFT JOIN \`${datasetGetro}.${jobTable}\` AS getroJob
            ON savedJob.job = getroJob.id
        `;
        console.log(query);
        const options = {
            query: query,
            location: 'US',
        };
        const [jobBg] = await BigQueryService.getClient().createQueryJob(options);
        const [savedJobs] = await jobBg.getQueryResults();
        return {
            jobs: savedJobs,
            result: true
        };
    } catch (error) {
        console.log(error);
        return { message: error, result: false };
    }
}

export const getCandidatesOnJob = async (job: string) => {
    try {
        const condition = `job = '${job}'`;
        const datasetMain = DATASET_MAIN;
        const datasetBullhorn = DATASET_BULLHORN;
        const datasetGetro = DATASET_GETRO;
        const applicationTable = Tables.APPLICATIONS;
        const candidateTable = Tables.USER;
        const query = `
            SELECT * 
            FROM (SELECT candidate FROM \`${datasetMain}.${applicationTable}\` WHERE ${condition}) AS applications
            LEFT JOIN \`${datasetBullhorn}.${candidateTable}\` AS bullhornUser
            ON applications.candidate = bullhornUser.id
            LEFT JOIN \`${datasetBullhorn}.${candidateTable}\` AS getroUser
            ON applications.candidate = getroUser.id
        `;
        console.log(query);
        const options = {
            query: query,
            location: 'US',
        };
        const [jobBg] = await BigQueryService.getClient().createQueryJob(options);
        const [candidates] = await jobBg.getQueryResults();
        return {
            candidates,
            result: true
        };
    } catch (error) {
        console.log(error);
        return { message: error, result: false };
    }
}