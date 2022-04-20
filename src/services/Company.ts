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

export const getSavedCompanies = async (candidate: string) => {
  try{
    const dataset = DATASET_MAIN
    const table = Tables.SAVED_COMPANIES;
    const query = `
      SELECT *
      FROM \`${dataset}.${table}\` as savedCompany
      LEFT JOIN \`${dataset}.${Tables.JOINED_COMPANIES}\` as joinedCompany
      ON joinedCompany.bh_id = savedCompany.company OR joinedCompany.getro_id = savedCompany.company
      WHERE savedCompany.candidate = '${candidate}'
    `;
    console.log(query);
    const options = {
      query,
      location: 'US',
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    const [rows] = await job.getQueryResults();
    return {
      companies: rows,
      result: true,
    }
  }catch(e){
    console.log(e);
    return {result: false, message: e};
  }
}