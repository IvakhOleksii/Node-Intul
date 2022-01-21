import { User } from "../types/User";
import { BigQueryService } from "./BigQueryService";
import { DATASET_ID, Tables } from "../types/Common";

export const register = async (data: User) => {
    try {
        const {firstname, lastname, email, password, type, city, state} = data;
        
        const existing = await isExistUser(email);
        if (existing) {
            return {
                result: false,
                error: `User with ${email} exists`
            };
        }

        const query = `
            INSERT INTO \`${DATASET_ID}.${Tables.USER}\` (firstname, lastname, email, password, type, city, state)
            VALUES ("${firstname}", "${lastname}", "${email}", "${password}", "${type}", "${city}", "${state}")
        `;
        const options = {
            query: query,
            location: 'US',
        };
        const [job] = await BigQueryService.getClient().createQueryJob(options);
        await job.getQueryResults();

        return { result: true };
    } catch (error) {
        return { result: false, error };
    }
}

export const isExistUser = async (email: string) => {
    try {
        const query = `
            SELECT * FROM \`${DATASET_ID}.${Tables.USER}\`
            WHERE email='${email}'
        `;
        const options = {
            query: query,
            location: 'US',
        };
        const [job] = await BigQueryService.getClient().createQueryJob(options);
        const [res] = await job.getQueryResults();
        if (res && res.length > 0 && res[0].email === email) {
            return true;
        }
        return false;
    } catch (error) {
        return true;
    }
}

export const login = async (email: string, password: string) => {
    try {
        const query = `
            SELECT * FROM \`${DATASET_ID}.${Tables.USER}\`
            WHERE email='${email}' AND password='${password}'
        `;
        const options = {
            query: query,
            location: 'US',
        };
        const [job] = await BigQueryService.getClient().createQueryJob(options);
        const [res] = await job.getQueryResults();
        if (res && res.length > 0 && res[0].email === email) {
            return { result: true };
        }
        return { result: false, error: 'wrong credential' };
    } catch (error) {
        return { result: false, error };
    }
};
