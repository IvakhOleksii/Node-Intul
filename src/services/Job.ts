import { DATASET_BULLHORN, DATASET_GETRO, DATASET_MAIN } from "../types/Common";
import {
  Job,
  ALLOWED_JOB_KEYS,
  JobKey,
  ALLOWED_JOB_KEYS_TO_UPDATE,
} from "../types/Job";
import db from "../utils/db";

export const createJob = async (job: Job) => {
  try {
    const jobError = validateJob(job);
    if (jobError) {
      throw new Error(jobError);
    }

    const sanitizedJob = sanitizeJob(job) as any;

    const newJob = await db.job.create({
      data: {
        ...sanitizedJob,
        datasource: sanitizedJob?.datasource as any,
      },
    });

    return {
      result: true,
      data: newJob,
    };
  } catch (err) {
    console.error(err);
    return {
      result: false,
      error: err,
    };
  }
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
  try {
    const jobs = await db.job.findMany({
      where: {
        applications: {
          some: {
            userId,
          },
        },
      },
    });

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

    const filteredJob: any = {};

    sanitizedKeys.forEach((key) => {
      const typedKey = key as JobKey;
      filteredJob[typedKey] = job[typedKey] as any;
    });

    const res = await db.job.update({
      where: {
        id,
      },
      data: {
        ...filteredJob,
        datasource: filteredJob?.datasource as any,
      },
    });

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
