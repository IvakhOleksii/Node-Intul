import { ApplyResponse, DATASET_MAIN, Tables } from "../types/Common";
import { Job, ALLOWED_JOB_KEYS } from "../types/Job";
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
  const query = `SELECT * FROM \`${DATASET_MAIN}.${Tables.JOBS}\`
                 INNER JOIN \`${DATASET_MAIN}.${Tables.APPLICATIONS}\`
                 ON \`${DATASET_MAIN}.${Tables.JOBS}\`.\`id\` = \`${DATASET_MAIN}.${Tables.APPLICATIONS}\`.\`job\`
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
