import { User } from "../types/User";
import { BigQueryService } from "./BigQueryService";
import { DATASET_GETRO, Tables } from "../types/Common";

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
    const expludeFields = ['organization_careers_pages', 'managers', 'topics'];
    try {
        for (const company of companies) {
            try {
                console.log(`Savng Getro company with ID = ${company.id}`);
                const existing = await isExist(`'${company.id}'`, DATASET_GETRO, Tables.COMPANIES);
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
                const existing = await isExist(`'${member.id}'`, DATASET_GETRO, Tables.USER);
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