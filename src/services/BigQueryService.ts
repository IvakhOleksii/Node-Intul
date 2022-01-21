import { BigQuery } from '@google-cloud/bigquery';
import { User } from '../types/User';

export class BigQueryService {
    public static client: BigQuery | null = null;
    private static readonly DATASET_ID = process.env.DATASET_ID;

    public static getClient() {
        if (BigQueryService.client === null) {
            BigQueryService.client = new BigQuery();
        }
        return BigQueryService.client;
    }
}