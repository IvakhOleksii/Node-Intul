import { DATASET_MAIN, Tables } from "../types/Common";
import { genUUID, isExistByCondition } from "../utils";
import { BigQueryService } from "./BigQueryService";

export const saveCandidate = async (
  candidateId: string,
  companyUserId: string
) => {
  try {
    const condition = `candidate = '${candidateId}' AND company = '${companyUserId}'`;
    const dataset = DATASET_MAIN;
    const table = Tables.SAVED_CANDIDATES;
    const id = genUUID();
    const existing = await isExistByCondition(condition, dataset, table);
    let query = null;

    if (existing) {
      query = `
              DELETE FROM \`${dataset}.${table}\`
              WHERE ${condition}
          `;
    } else {
      query = `
              INSERT INTO \`${dataset}.${table}\` (id, candidate, company)
              VALUES ("${id}", "${candidateId}", "${companyUserId}")
          `;
    }
    console.log(query);
    const options = {
      query,
      location: "US",
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    await job.getQueryResults();
    return {
      result: true,
      message: existing ? "unsaved candidate" : "saved candidate",
    };
  } catch (error) {
    console.log(error);
    return { result: false, message: error };
  }
};

export const getSavedCandidates = async (companyUserId: string) => {
  try {
    const dataset = DATASET_MAIN;
    const table = Tables.SAVED_CANDIDATES;
    const query = `
        SELECT *
        FROM \`${dataset}.${table}\` as saved_candidate
        LEFT JOIN \`${dataset}.${Tables.USER}\` as company
        ON company.id = saved_candidate.company
        WHERE company.id = '${companyUserId}'
      `;
    console.log(query);
    const options = {
      query,
      location: "US",
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    const [res] = await job.getQueryResults();
    return {
      result: true,
      candidates: res,
    };
  } catch (error) {
    console.log(error);
    return { result: false, message: error };
  }
};

export const getCandidatesList = async (candidates_ids: string[]) => {
  try {
    const dataset = DATASET_MAIN;
    const table = Tables.USER;
    const query = `
        SELECT email
        FROM \`${dataset}.${table}\`
        WHERE id IN UNNEST(['${candidates_ids.join("','")}']);
      `;
    const options = {
      query,
      location: "US",
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    const [res] = await job.getQueryResults();
    return res.map( user => user.email );
  } catch (error) {
    console.log(error);
    throw error;
  }
};
