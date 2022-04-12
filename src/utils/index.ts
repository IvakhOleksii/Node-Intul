import { v4 as uuid4 } from 'uuid';
import config from '../config';
import { BigQueryService } from "../services/BigQueryService";
import { DataSource } from "../types/Common";
import { CITY_INCLUDE_KEYS_REGEX, JOB_EXCLUDE_KEYS_REGEX } from './constant';

export const isExistByID = async (id: string, datset: string, table: string) => {
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

        if (res && res.length > 0 && `'${res[0].id}'` === id) {
            return true;
        }
        return false;
    } catch (error) {
        console.log(error);
        return true;
    }
}

export const isExistByCondition = async (condition: string, datset: string, table: string) => {
    try {
        const query = `
            SELECT * FROM \`${datset}.${table}\`
            WHERE ${condition}
        `;
        const options = {
            query: query,
            location: 'US',
        };
        console.log(query)
        const [job] = await BigQueryService.getClient().createQueryJob(options);
        const [res] = await job.getQueryResults();
        console.log(res);
        if (res && res.length > 0) {
            return true;
        }
        return false;
    } catch (error) {
        console.log(error);
        return true;
    }
}

export const consoleLog = (message: any, newLine = true) =>{
    console.log(`${newLine ? '\n' : ''}${message}`);
}

export const sleep = async (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const getDataSource = (id: string) => {
    const prefix = id.slice(0, 2);
    if (prefix === 'bl') return DataSource.BULLHORN;
    if (prefix === 'gt') return DataSource.GETRO;
    return DataSource.UNKNOWN;
}

export const genUUID = () => uuid4();

export const checkForJobFilter = (title: string, location: string) => {
    if (title.match(JOB_EXCLUDE_KEYS_REGEX)) return false;
    if (location.replace(/\s+/g, '').match(CITY_INCLUDE_KEYS_REGEX)) return true;
    return false;
}

export const fileUploadOptions = {
    limits: {
        fileSize: config.fileUploadSize,
    }
}

export const justifyData = (data: any, keys: string[], excludeKeys: string[] = []): any => {
    return Object.keys(data).filter(key => keys.indexOf(key) > -1 && excludeKeys.indexOf(key) === -1 ).reduce((v, key) => {
        return {
            ...v,
            [key]: data[key]
        };
    }, {});
}