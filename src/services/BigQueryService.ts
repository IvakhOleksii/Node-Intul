import { BigQuery } from '@google-cloud/bigquery';
import { config } from 'dotenv';
import { Tables } from '../types/Common';
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

    public static async insertQuery(dataset: string, table: string, data: any) {
        try {
            consoleLog(`BIGQUERY: INSERT QUERY = ${JSON.stringify(data)}`);
            const keys = Object.keys(data)
            const values = keys.map(k => `"""${data[k]}"""`);
          
            const query = `
              INSERT INTO \`${dataset}.${table}\`
              (${keys.join(', ')})
              VALUES (${values.join(', ')})
            `;
            console.log(query)

            const options = {
                query,
                location: 'US',
            };

            const [job] = await BigQueryService.getClient().createQueryJob(options);
            const res = await job.getQueryResults();

            return { result: true, res};
        } catch (error) {
            console.log(error);
            return { result: false, error  };
        }
    }
}