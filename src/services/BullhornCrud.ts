import { User } from "../types/User";
import { BigQueryService } from "./BigQueryService";
import { DATASET_BULLHORN, Tables } from "../types/Common";

export const isExist = async (id: string, datset: string, table: string) => {
    try {
        const query = `
            SELECT * FROM \`${datset}.${table}\`
            WHERE id=${id}
        `;
        const options = {
            query: query,
            location: 'US',
        };
        console.log(query)
        const [job] = await BigQueryService.getClient().createQueryJob(options);
        const [res] = await job.getQueryResults();
        if (res && res.length > 0 && res[0].id === id) {
            return true;
        }
        return false;
    } catch (error) {
        console.log(error);
        return true;
    }
}

export const saveCompanies = async (companies: any[]) => {
    const expludeFields = ['address', 'billingAddress', '_score', 'notes','dateAdded', 'dateLastModified'];
    try {
        for (const company of companies) {
            try {
                console.log(`Savng company with ID = ${company.id}`);
                const existing = await isExist(`${company.id}`, DATASET_BULLHORN, Tables.COMPANIES);
                if (existing) {
                    console.log(`Company with ID: ${company.id} exists`);
                    continue;
                }
                const keys: string[] = Object.keys(company).filter(k => expludeFields.indexOf(k) === -1 && !!company[k]);
                const values = keys.map(k => 
                    typeof company[k]==='string' 
                        ? "'"+company[k].replace(/\'/g, "\"").replace(/\n/g, '')+"'"
                        : company[k]
                );
                const query = `
                    INSERT INTO \`${DATASET_BULLHORN}.${Tables.COMPANIES}\` (${keys.join(', ')})
                    VALUES (${values.join(', ')})
                `;
                console.log(query);
                const options = {
                    query: query,
                    location: 'US',
                };
                const [job] = await BigQueryService.getClient().createQueryJob(options);
                await job.getQueryResults();
                console.log(`Saved company with ID = ${company.id} successfully`);
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

export const saveJobs = async (jobs: any[]) => {
    const expludeFields = [
        'address',
        'location',
        '_score',
        'description', //
        'publicDescription', //
        'clientCorporation',
        'dateAdded',
        'dateClosed',
        'date_end',
        'dateLastExported',
        'dateLastModified',
        'dateLastPublished',
        'startDate', //
    ];
    try {
        for (const job of jobs) {
            try {
                console.log(`Savng job with ID = ${job.id}`);
                const existing = await isExist(`${job.id}`, DATASET_BULLHORN, Tables.JOBS);
                if (existing) {
                    console.log(`Job with ID: ${job.id} exists`);
                    continue;
                }
                const keys: string[] = Object.keys(job).filter(k => expludeFields.indexOf(k) === -1 && !!job[k]);
                const values: any = keys.map(k => 
                    typeof job[k]==='string' 
                        ? "'"+job[k].replace(/\'/g, "\"").replace(/\n/g, '')+"'"
                        : job[k]
                );
                const query = `
                    INSERT INTO \`${DATASET_BULLHORN}.${Tables.JOBS}\` (${keys.join(', ')})
                    VALUES (${values.join(', ')})
                `;
                console.log(query);
                const options = {
                    query: query,
                    location: 'US',
                };
                const [bgJob] = await BigQueryService.getClient().createQueryJob(options);
                await bgJob.getQueryResults();
                console.log(`Saved job with ID = ${job.id} successfully`);
            } catch (error) {
                console.log(error);
                console.log(`ERROR: while saving job with ID = ${job.id}`);
            }
        };

        return { result: true };
    } catch (error) {
        console.log(error);
        return { result: false, error };
    }
}


export const saveClientContacts = async (contacts: any[]) => {
    const expludeFields = [
        'address',
        'location',
        '_score',
        'description', //
    ];
    try {
        for (const contact of contacts) {
            try {
                console.log(`Savng job with ID = ${contact.id}`);
                const existing = await isExist(`'${contact.id}'`, DATASET_BULLHORN, Tables.USER);
                if (existing) {
                    console.log(`ClientContact with ID: ${contact.id} exists`);
                    continue;
                }
                console.log('------')
                const keys: string[] = Object.keys(contact).filter(k => expludeFields.indexOf(k) === -1 && !!contact[k]);
                const values: any = keys.map(k => 
                    `'${contact[k]}'`
                );
                const query = `
                    INSERT INTO \`${DATASET_BULLHORN}.${Tables.USER}\` (${keys.join(', ')})
                    VALUES (${values.join(', ')})
                `;
                console.log(query);
                const options = {
                    query: query,
                    location: 'US',
                };
                const [bgJob] = await BigQueryService.getClient().createQueryJob(options);
                await bgJob.getQueryResults();
                console.log(`Saved ClientContact with ID = ${contact.id} successfully`);
            } catch (error) {
                console.log(error);
                console.log(`ERROR: while saving ClientContact with ID = ${contact.id}`);
            }
        };

        return { result: true };
    } catch (error) {
        console.log(error);
        return { result: false, error };
    }
}