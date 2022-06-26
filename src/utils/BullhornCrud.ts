import { User } from "../types/User";
import { BigQueryService } from "../services/BigQueryService";
import { DATASET_BULLHORN, DATASET_MAIN, Tables } from "../types/Common";
import { genUUID, isExistByCondition, isExistByID } from "./";
import { Candidate } from "../types/Bullhorn";
import { Job } from "../types/Main";
import {
  parseBullhornCandidateToUser,
  parseBullhornJobToMain,
} from "./parseEntities";
import db from "./db";
import { Candidate as DbCandidate } from "prisma/prisma-client";

export const saveCompanies = async (companies: any[]) => {
  const expludeFields = [
    "address",
    "billingAddress",
    "_score",
    "notes",
    "dateAdded",
    "dateLastModified",
  ];
  try {
    for (const company of companies) {
      try {
        console.log(`Savng company with ID = ${company.id}`);
        const existing = await db.company.findFirst({
          where: {
            externalID: company.id,
          },
        });
        if (existing) {
          console.log(`Company with ID: ${company.id} exists`);
          return -1;
        }

        const companyData = { ...company };

        Object.keys(companyData).forEach((key) => {
          if (expludeFields.includes(key)) {
            delete companyData[key];
          }
        });

        const newCompany = await db.company.create({
          data: companyData,
        });

        console.log(`Saved company with ID = ${company.id} successfully`);
      } catch (error: any) {
        console.log(error.message);
        console.log(`ERROR: while saving company with ID = ${company.id}`);
      }
    }

    return { result: true };
  } catch (error: any) {
    console.log(error.message);
    return { result: false, error };
  }
};

export const saveJobs = async (jobs: any[]) => {
  const expludeFields = [
    "address",
    "location",
    "_score",
    "publicDescription", //
    "clientCorporation",
    "dateAdded",
    "dateClosed",
    "date_end",
    "dateLastExported",
    "dateLastModified",
    "dateLastPublished",
    "startDate", //
  ];
  try {
    for (const job of jobs) {
      try {
        console.log(`Savng job with ID = ${job.id}`);
        const parsedJob = parseBullhornJobToMain(job);
        if (parsedJob) {
          // await migrateJobInTPP(parsedJob);
        }

        const existing = await db.job.findFirst({
          where: {
            externalId: `bl-${job.id}`,
          },
        });

        if (existing) {
          console.log(`Job with ID: ${job.id} exists`);
          return -1;
        }
        const jobData = { ...job };
        Object.keys(jobData).forEach((key) => {
          if (expludeFields.includes(key)) {
            delete jobData[key];
          }
        });

        const newJob = await db.job.create({
          data: jobData,
        });

        console.log(`Saved job with ID = ${job.externalId} successfully`);
      } catch (error: any) {
        console.log(error.message);
        console.log(`ERROR: while saving job with ID = ${job.externalId}`);
      }
    }

    return { result: true };
  } catch (error: any) {
    console.log(error.message);
    return { result: false, error };
  }
};

export const saveClientContacts = async (contacts: any[]) => {
  const expludeFields = ["address", "location", "_score"];
  try {
    for (const contact of contacts) {
      try {
        console.log(`\nSavng ClientContact with ID = ${contact.id}`);
        const existing = await db.clientContact.findFirst({
          where: {
            externalID: contact.id,
          },
        });

        if (existing) {
          console.log(`ClientContact with ID: ${contact.id} exists`);
          return -1;
        }
        const contactData = { ...contact };
        Object.keys(contactData).forEach((key) => {
          if (expludeFields.includes(key)) {
            delete contactData[key];
          }
        });

        const newContact = await db.clientContact.create({
          data: contactData,
        });
        console.log(`Saved ClientContact with ID = ${contact.id} successfully`);
      } catch (error: any) {
        console.log(error.message);
        console.log(
          `ERROR: while saving ClientContact with ID = ${contact.id}`
        );
      }
    }

    return { result: true };
  } catch (error: any) {
    console.log(error.message);
    return { result: false, error };
  }
};

export const saveCandidates = async (candidates: any[]) => {
  const expludeFields = ["address", "_score"];
  try {
    for (const candidate of candidates) {
      try {
        console.log(`\n\nSavng Candidate with ID = ${candidate.id}`);
        const parsedUser = parseBullhornCandidateToUser(candidate) as any;
        if (parsedUser) {
          // await migrateUserInTPP(parsedUser);
        }

        const existing = await db.candidate.findFirst({
          where: {
            externalId: candidate.id,
          },
        });

        if (existing) {
          console.log(`Candidate with ID: ${candidate.id} exists`);
          continue;
        }
        const candidateData = { ...candidate };
        Object.keys(candidateData).forEach((key) => {
          if (expludeFields.includes(key)) {
            delete candidateData[key];
          }
        });

        const newCandidate = await db.candidate.create({
          data: candidateData,
        });
        console.log(`Saved Candidate with ID = ${candidate.id} successfully`);
      } catch (error: any) {
        console.log(error.message);
        console.log(`ERROR: while saving Candidate with ID = ${candidate.id}`);
      }
    }

    return { result: true };
  } catch (error: any) {
    console.log(error.message);
    return { result: false, error };
  }
};

export const saveLeads = async (leads: any[]) => {
  const expludeFields = ["address", "_score"];
  try {
    for (const lead of leads) {
      try {
        console.log(`Savng Lead with ID = ${lead.id}`);
        const existing = await db.lead.findFirst({
          where: {
            externalId: lead.id,
          },
        });
        if (existing) {
          console.log(`Lead with ID: ${lead.id} exists`);
          return -1;
        }
        const leadData = { ...lead };
        Object.keys(leadData).forEach((key) => {
          if (expludeFields.includes(key)) {
            delete leadData[key];
          }
        });

        const newLead = await db.lead.create({
          data: leadData,
        });
        console.log(`Saved Lead with ID = ${lead.id} successfully`);
      } catch (error: any) {
        console.log(error.message);
        console.log(`ERROR: while saving Lead with ID = ${lead.id}`);
      }
    }

    return { result: true };
  } catch (error: any) {
    console.log(error.message);
    return { result: false, error };
  }
};

export const migrateUserInTPP = async (data: Partial<DbCandidate>) => {
  try {
    const existing = await db.candidate.findFirst({
      where: {
        externalId: data.externalId,
      },
    });
    if (existing) {
      console.log(
        `Migration Failed: Bullhorn User (bh_id=${data.externalId}) is already migratd`
      );
      return;
    }
    await db.candidate.create({ data });
    console.log(`Saved Bullhorn User (bh_id=${data.externalId}) successfully`);
  } catch (error: any) {
    console.log(error.message);
    console.log(
      `ERROR: Migration Failed Bullhorn User (bh_id=${data.externalId})`
    );
  }
};

export const migrateJobInTPP = async (data: Job) => {
  try {
    console.log(`Migrating Job from Bullhorn: bh_id = ${data.externalId}`);
    const condition = `externalId = '${data.externalId}'`;
    const dataset = DATASET_MAIN;
    const table = Tables.JOBS;
    const id = genUUID();
    const existing = await isExistByCondition(condition, dataset, table);
    if (existing) {
      console.log(
        `Migration Failed: Bullhorn Job (bh_id=${data.externalId}) is already migrated`
      );
      return;
    }
    const keys: string[] = Object.keys(data);
    const values: any = keys.map((k) => `"""${(data as any)[k]}"""`);
    keys.unshift("id");
    values.unshift(`"""${id}"""`);
    const query = `
            INSERT INTO \`${dataset}.${table}\` (${keys.join(", ")})
            VALUES (${values.join(", ")})
        `;
    // console.log(query);
    const options = {
      query: query,
      location: "US",
    };
    const [bgJob] = await BigQueryService.getClient().createQueryJob(options);
    await bgJob.getQueryResults();
    console.log(
      `Migrated Bullhorn Job (bh_id=${data.externalId}) successfully`
    );
  } catch (error: any) {
    console.log(error.message);
    console.log(
      `ERROR: Migration Failed Bullhorn Job (bh_id=${data.externalId})`
    );
  }
};
