import { BigQuery } from '@google-cloud/bigquery';
import { config } from 'dotenv';
import { User } from '../types/User';
import { consoleLog } from '../utils';

export class BigQueryService {
    public static client: BigQuery | null = null;

    public static getClient() {
        if (BigQueryService.client === null) {
            BigQueryService.client = new BigQuery();
        }
        return BigQueryService.client;
    }

    public static async selectQuery(datset: string, table: string, fields: string, count?: number, condition?: string) {
        try {
            let query = `SELECT ${fields} FROM \`${datset}.${table}\``;
            if (condition) {
                query = `
                    ${query}
                    WHERE ${condition}
                `;
            }
            if (count) {
                query = `
                    ${query}
                    LIMIT ${count}
                `;
            }
            const options = {
                query: query,
                location: 'US',
            };
            consoleLog(`BIGQUERY: SELECT QUERY = ${query}`);
            const [job] = await BigQueryService.getClient().createQueryJob(options);
            const [res] = await job.getQueryResults();
            if (res && res.length > 0) {
                return res;
            }
        } catch (error) {
            console.log(error);
        }
        return null;
    }
}