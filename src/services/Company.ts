import { DATASET_MAIN, Tables } from "../types/Common";
import { genUUID, isExistByCondition } from "../utils";
import { BigQueryService } from "./BigQueryService";

export const saveCompany = async (company: string, candidate: string) => {
  try{
    const condition = `company = '${company}' AND candidate = '${candidate}'`;
    const dataset = DATASET_MAIN
    const table = Tables.SAVED_COMPANIES;
    const id = genUUID();
    const existing = await isExistByCondition(condition, dataset, table);
    let query = null;
    if (!existing) {
      query = `
        INSERT INTO \`${dataset}.${table}\` (id, company, candidate)
        VALUES ('${id}', '${company}', '${candidate}')
      `;
    }else {
      query = `
        DELETE FROM \`${dataset}.${table}\`
        WHERE ${condition}
      `;
    }
    console.log(query);
    const options = {
      query,
      location: 'US',
    };

    const [job] = await BigQueryService.getClient().createQueryJob(options);
    await job.getQueryResults();
    return {
      result: true,
      message: existing ? 'unsaved company' : 'saved company'
    }
  }catch(e){
    console.log(e);
    return {result: false, message: e};
  }
}