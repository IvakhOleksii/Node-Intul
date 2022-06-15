import { Dataset } from "@google-cloud/bigquery";
import {
  ApplyResponse,
  DATASET_BULLHORN,
  DATASET_GETRO,
  DATASET_MAIN,
  Tables,
} from "../types/Common";
import {
  Job,
  ALLOWED_JOB_KEYS,
  JobKey,
  ALLOWED_JOB_KEYS_TO_UPDATE,
} from "../types/Job";
import { BigQueryService } from "./BigQueryService";

export const createJob = async (job: Job): Promise<ApplyResponse> => {
  const jobError = validateJob(job);
  if (jobError) {
    throw new Error(jobError);
  }

  const sanitizedJob = sanitizeJob(job);

  const dataset = DATASET_MAIN;
  const table = Tables.JOBS;
  return await BigQueryService.insertQuery(dataset, table, sanitizedJob);
};

// TODO: Figure out what we want to make required
const validateJob = (job: Job): string | undefined => {
  return undefined;
};

const sanitizeJob = (job: Job): Job => {
  const newJob = { ...job };

  Object.keys(newJob).forEach((key) => {
    const typedKey = key as keyof Job;
    if (!ALLOWED_JOB_KEYS.has(typedKey)) {
      delete newJob[typedKey];
    }
  });

  return newJob;
};

export const getAppliedJobsByUser = async (userId: string) => {
  const query = `SELECT * FROM \`${DATASET_MAIN}.${Tables.APPLICATIONS}\` 
                 INNER JOIN \`${DATASET_MAIN}.${Tables.JOBS}\`
                 ON \`${DATASET_MAIN}.${Tables.JOBS}\`.\`id\` = \`${DATASET_MAIN}.${Tables.APPLICATIONS}\`.\`job\`
                 OR \`${DATASET_MAIN}.${Tables.JOBS}\`.\`externalId\` = \`${DATASET_MAIN}.${Tables.APPLICATIONS}\`.\`job\`
                 WHERE \`${DATASET_MAIN}.${Tables.APPLICATIONS}\`.\`candidate\` = '${userId}'`;
  ``;
  console.log(query);
  try {
    const [job] = await BigQueryService.getClient().createQueryJob({
      query,
      location: "US",
    });

    const [jobs] = await job.getQueryResults();

    return {
      jobs,
      result: jobs != null,
    };
  } catch (error) {
    console.log(error);
    return {
      message: error,
      result: false,
    };
  }
};

export const inferDatasetById = (id: string) => {
  if (id.startsWith("gt-")) {
    return DATASET_GETRO;
  } else if (id.startsWith("bl-")) {
    return DATASET_BULLHORN;
  } else {
    return DATASET_MAIN;
  }
};

export const updateJob = async (job: Partial<Job> & { id: string }) => {
  try {
    const { id, ...jobData } = job;

    const sanitizedKeys = Object.keys(jobData).filter((key) =>
      ALLOWED_JOB_KEYS_TO_UPDATE.has(key as JobKey)
    );

    const setters = sanitizedKeys
      .map((key) => {
        const typedKey = key as JobKey;
        return `\`${typedKey}\` = ${(jobData as any)[typedKey]}`;
      })
      .join(", ");

    const dataset = inferDatasetById(id);

    const query = `UPDATE \`${dataset}.${Tables.JOBS}\`
                  SET ${setters}
                  WHERE \`id\` = '${id}'`;

    console.log(query);

    const [bigJob] = await BigQueryService.getClient().createQueryJob({
      query,
      location: "US",
    });

    const [res] = await bigJob.getQueryResults();

    return {
      result: true,
      res,
    };
  } catch (err) {
    console.log(err);
    return {
      message: err,
      result: false,
    };
  }
};

export const getJobsList = async (jobs_ids: string[]) => {
  try {
    const dataset = DATASET_MAIN;
    const table = Tables.JOBS;
    const query = `
        SELECT title
        FROM \`${dataset}.${table}\`
        WHERE id IN UNNEST(['${jobs_ids.join("','")}']);
      `;
    const options = {
      query,
      location: "US",
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    const [res] = await job.getQueryResults();
    return res.map( job => job.title );
  } catch (error) {
    console.log(error);
    throw error;
  }
 };
