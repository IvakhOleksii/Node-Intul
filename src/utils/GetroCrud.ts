import { User } from "../types/User";
import { BigQueryService } from "../services/BigQueryService";
import { DATASET_GETRO, Tables } from "../types/Common";
import { isExistByID } from "./";

export const saveCompanies = async (companies: any[]) => {
    const expludeFields = ['organization_careers_pages', 'managers', 'topics'];
    try {
        for (const company of companies) {
            try {
                console.log(`Savng Getro company with ID = ${company.id}`);
                const existing = await isExistByID(`'${company.id}'`, DATASET_GETRO, Tables.COMPANIES);
                if (existing) {
                    console.log(`Company with ID: ${company.id} exists`);
                    continue;
                }
                const keys: string[] = Object.keys(company).filter(k => expludeFields.indexOf(k) === -1 && !!company[k]);
                const values: any = keys.map(k => 
                    `"${company[k]}"`
                );
                const query = `
                    INSERT INTO \`${DATASET_GETRO}.${Tables.COMPANIES}\` (${keys.join(', ')})
                    VALUES (${values.join(', ')})
                `;
                console.log(query);
                const options = {
                    query: query,
                    location: 'US',
                };
                const [job] = await BigQueryService.getClient().createQueryJob(options);
                await job.getQueryResults();
                console.log(`Saved Getro Company with ID = ${company.id} successfully`);
            } catch (error) {
                console.log(error);
                console.log(`ERROR: while saving company with ID = ${company.id}`);
            }
        };

        return { result: true };
    } catch (error) {
        console.log(error);
        return { result: false, error };
    }
}

export const saveMembers = async (members: any[]) => {
    const expludeFields = ['user_talent_collection', 'referrals_given', 'referrals_received', 'opportunity_types', 'mentorship'];
    try {
        for (const member of members) {
            try {
                console.log(`Savng Getro Member with ID = ${member.id}`);
                const existing = await isExistByID(`'${member.id}'`, DATASET_GETRO, Tables.USER);
                if (existing) {
                    console.log(`Member with ID: ${member.id} exists`);
                    continue;
                }
                const keys: string[] = Object.keys(member).filter(k => expludeFields.indexOf(k) === -1 && !!member[k]);
                const values: any = keys.map(k => 
                    `"${member[k]}"`
                );
                const query = `
                    INSERT INTO \`${DATASET_GETRO}.${Tables.USER}\` (${keys.join(', ')})
                    VALUES (${values.join(', ')})
                `;
                console.log(query);
                const options = {
                    query: query,
                    location: 'US',
                };
                const [job] = await BigQueryService.getClient().createQueryJob(options);
                await job.getQueryResults();
                console.log(`Saved Getro Member with ID = ${member.id} successfully`);
            } catch (error) {
                console.log(error);
                console.log(`ERROR: while saving Member with ID = ${member.id}`);
            }
        };

        return { result: true };
    } catch (error) {
        console.log(error);
        return { result: false, error };
    }
}

export const getCompanies = async () => {
    const query = `SELECT id from ${DATASET_GETRO}.${Tables.COMPANIES}`;
    const options = {
        query,
        location: 'US'
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    const result = await job.getQueryResults();
    console.log(result);
    return result;
}

export const saveJobs = async (jobs: any[]) => {
    const expludeFields = ['organization', 'employment_types'];
    try {
        for (const job of jobs) {
            try {
                console.log(`Savng Getro Job with ID = ${job.id}`);
                const existing = await isExistByID(`'${job.id}'`, DATASET_GETRO, Tables.JOBS);
                if (existing) {
                    console.log(`Job with ID: ${job.id} exists`);
                    continue;
                }
                const keys: string[] = Object.keys(job).filter(k => expludeFields.indexOf(k) === -1 && !!job[k]);
                const values: any = keys.map(k => 
                    `"${job[k]}"`
                );
                const query = `
                    INSERT INTO \`${DATASET_GETRO}.${Tables.JOBS}\` (${keys.join(', ')})
                    VALUES (${values.join(', ')})
                `;
                console.log(query);
                const options = {
                    query: query,
                    location: 'US',
                };
                const [jobBg] = await BigQueryService.getClient().createQueryJob(options);
                await jobBg.getQueryResults();
                console.log(`Saved Getro Job with ID = ${job.id} successfully`);
            } catch (error) {
                console.log(error);
                console.log(`ERROR: while saving Job with ID = ${job.id}`);
            }
        };

        return { result: true };
    } catch (error) {
        console.log(error);
        return { result: false, error };
    }
}