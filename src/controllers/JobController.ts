import { Datasource, Prisma, PrismaClient } from "@prisma/client";
import {
  Controller,
  Param,
  Body,
  Get,
  Post,
  Put,
  Delete,
  QueryParam,
  JsonController,
  Authorized,
  CurrentUser,
  Patch,
} from "routing-controllers";
import { Dictionary } from "typed-two-way-map";
import { BigQueryService } from "../services/BigQueryService";
import { GetroService } from "../services/GetroService";
import { createJob, getAppliedJobsByUser, updateJob } from "../services/Job";
import {
  DATASET_BULLHORN,
  DATASET_GETRO,
  FilterOption,
  Job,
  FilterBody,
  JobSearchByFilterResponse,
  JobSearchByID,
  DataSource,
  Tables,
  ApplyResponse,
  GetSavedJobsResponse,
  AdvancedFilterOption,
  DATASET_MAIN,
  DataSources,
  Operator,
} from "../types/Common";
import { ALLOWED_GETRO_FILTERS } from "../types/Getro";
import { ALLOWED_JOB_KEYS, JobKey } from "../types/Job";
import { User } from "../types/User";
import { consoleLog, getDataSource } from "../utils";
import db from "../utils/db";
import { JobFilter } from "../utils/FieldMatch";
import {
  getCandidatesOnJob,
  getSavedJobs,
  saveApplication,
  saveJob,
} from "../utils/MainCrud";

import { Job as DbJob } from "prisma/prisma-client";
import { BullhornService } from "../services/BullhornService";

@JsonController("/api/job")
export class JobController {
  @Get("/search")
  async searchJobByID(@QueryParam("id") id: string) {
    try {
      const job = await db.job.findFirst({
        where: {
          id,
        },
        include: {
          getroJobInfo: true,
          company: true,
        },
      });

      console.log({ job });

      if (job) {
        return {
          job: {
            ...(job?.getroJobInfo || {}),
            ...job,
            clientCorporation: job.company?.name,
          },
        };
      } else {
        return null;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  @Post("/run-job")
  async runJob(@Body() body: any) {
    try {
      consoleLog("/// BULLHORN_GET_JOBS");
      await (await BullhornService.getClient()).getJobs(true, 50);
      return { success: true };
    } catch (error) {
      consoleLog(error);
      return { success: false, error };
    }
  }

  @Post("/search")
  async searchByFilter(
    @Body() body: FilterBody & { datasource?: DataSources }
  ) {
    try {
      const { filters, fields, page, count, datasource } = body;

      const whereFilters = normalizeFilters(filters);

      console.log({ filters, whereFilters });

      const datasourceToEnum: Dictionary<Datasource> = {
        main: Datasource.main,
        bullhorn: Datasource.bullhorn,
        getro: Datasource.getro,
      };

      const _datasource = datasource ? datasourceToEnum[datasource] : undefined;

      console.log({ count, page });
      const jobs = await db.job.findMany({
        where: {
          datasource: _datasource as any,
          ...whereFilters,
        },
        take: count,
        skip: (count || 0) * (page || 0),
        include: {
          company: true,
          category: true,
        },
      }); // TODO: assumes we are changing frontend to pass compatible fields and filters params

      console.log({ jobs });

      return {
        jobs: jobs.map((job) => {
          return {
            ...job,
            company_name: job.company?.name,
            company_logo: job.company?.logo,
          };
        }),
        total: jobs?.length,
        message: null,
      };
    } catch (error) {
      console.error(error);
      return {
        message: error,
      };
    }
  }

  determineCondition = (
    key: string,
    value: string,
    specialHandlers: Dictionary<(key: string, value: string) => string>,
    nonStringFields: Set<string> = new Set()
  ) => {
    if (specialHandlers[key] != null) {
      return specialHandlers[key](key, value);
    } else if (nonStringFields.has(key) || typeof value !== "string") {
      return `${key} = ${value}`;
    } else {
      return `LOWER(${key}) LIKE '%${value.toLowerCase()}%'`;
    }
  };

  getFilterConditions = (
    filters: AdvancedFilterOption[],
    operator: Operator = "OR",
    specialHandlers: Dictionary<(key: string, value: string) => string> = {},
    nonStringFields: Set<string> = new Set()
  ) => {
    const conditions = filters.map((opt) => {
      if (Array.isArray(opt.value)) {
        const operator = opt.operator || "AND";
        const baseCondition = (value: string) =>
          this.determineCondition(
            opt.key,
            value,
            specialHandlers,
            nonStringFields
          );
        return opt.value.map(baseCondition).join(` ${operator} `);
      } else {
        return this.determineCondition(opt.key, opt.value, specialHandlers);
      }
    });
    return conditions.join(` ${operator} `);
  };

  @Authorized()
  // TODO: Extract all of these query/filter logic into its own service
  async getJobsByFilterFromMain(
    filters: AdvancedFilterOption[] = [],
    fields: string[] | undefined,
    count: number | undefined,
    operator: Operator = "OR"
  ) {
    const _filters = filters.filter((filter) =>
      ALLOWED_JOB_KEYS.has(filter.key as JobKey)
    );

    const filteredFields = fields?.filter((field) =>
      ALLOWED_JOB_KEYS.has(field as JobKey)
    );

    const alias = "main_jobs";
    const companyAlias = "company";

    const _fields = filteredFields?.length
      ? filteredFields.join(", ")
      : `${alias}.*, ${companyAlias}.bh_url as company_url, ${companyAlias}.name as company_name, ${companyAlias}.logo as company_logo`;

    const specialHandlers = {
      company_name: (_: string, value: string) =>
        `LOWER(${companyAlias}.name) LIKE '%${value.toLowerCase()}%'`,
    };

    const condition = this.getFilterConditions(
      _filters,
      operator,
      specialHandlers
    );
    const dataset = DATASET_MAIN;
    const table = Tables.JOBS;

    const _join = `
      LEFT JOIN \`${DATASET_MAIN}.${Tables.JOINED_COMPANIES}\` as ${companyAlias} 
      ON REPLACE(${alias}.companyId, "bh-", "bl-")  = ${companyAlias}.bh_id
      `;

    return await BigQueryService.selectQuery(
      dataset,
      table,
      _fields,
      count,
      condition,
      _join,
      alias
    );
  }

  async getJobsByFilterFromGetro(
    filters: AdvancedFilterOption[] = [],
    fields: string[] | undefined,
    count: number | undefined,
    operator: Operator = "OR"
  ) {
    const _filters = filters.filter((filter) =>
      ALLOWED_GETRO_FILTERS.has(filter.key as keyof Job)
    );

    const filteredFields = fields?.filter((field) =>
      ALLOWED_GETRO_FILTERS.has(field as keyof Job)
    );
    const _fields = filteredFields?.length ? filteredFields.join(", ") : "*";

    const condition = this.getFilterConditions(_filters, operator);
    const dataset = DATASET_GETRO;
    const table = Tables.JOBS;

    return (await BigQueryService.selectQuery(
      dataset,
      table,
      _fields,
      count,
      condition
    )) as Job[];
  }

  async getJobsByFilterFromBullhorn(
    filters: AdvancedFilterOption[] | undefined,
    fields: string[] | null,
    page: number,
    count: number,
    operator: Operator = "OR"
  ) {
    if (filters?.every((opt) => JobFilter.bullhorn[opt.key] != null)) {
      const _dataset = DATASET_BULLHORN;
      const _table = Tables.JOBS;

      const _specialHandlers = {
        clientCorporationID: (key: string, value: string) =>
          `${key} = REPLACE("${value}", "bl-", "")`,
      };
      const _filters = filters.map((filter) => ({
        key: JobFilter.bullhorn[filter.key],
        value: filter.value,
      }));
      const _condition = this.getFilterConditions(
        _filters,
        operator,
        _specialHandlers
      );

      const alias = "jobs";
      const companyAlias = "company";

      const _fields = fields?.length
        ? fields.join(", ")
        : `${alias}.*, ${companyAlias}.bh_url as company_url, ${companyAlias}.name as company_name, ${companyAlias}.logo as company_logo, publishedCategory.id AS publishedCategoryID`;

      const _join = `
        LEFT JOIN \`${DATASET_MAIN}.${Tables.JOINED_COMPANIES}\` as ${companyAlias} 
          ON CONCAT("bl-", ${alias}.clientCorporationID) = ${companyAlias}.bh_id
        LEFT JOIN \`${DATASET_BULLHORN}.bh_jobs\` as bh_jobs 
          ON CONCAT("bl-", bh_jobs.id) = jobs.id
        `;

      return await BigQueryService.selectQuery(
        _dataset,
        _table,
        _fields,
        count,
        _condition,
        _join,
        alias
      );
    }
    throw "invalid filter options";
  }

  @Get("/apply")
  async apply(
    @QueryParam("candidate") candidate: string,
    @QueryParam("job") job: string
  ): Promise<ApplyResponse> {
    return await saveApplication(job, candidate);
  }

  @Authorized()
  @Get("/candidates")
  async getCandidates(@QueryParam("job") job: string) {
    return await getCandidatesOnJob(job);
  }

  @Authorized()
  @Put("/save")
  async save(
    @QueryParam("candidate") candidate: string,
    @QueryParam("job") job: string
  ): Promise<ApplyResponse> {
    return await saveJob(job, candidate);
  }

  @Authorized()
  @Patch()
  async update(
    @Body() body: Partial<Job> & { id: string }
  ): Promise<ApplyResponse> {
    return await updateJob(body);
  }

  @Authorized()
  @Get("/applied")
  async getAppliedJobs(
    @CurrentUser() authUser: User,
    @QueryParam("candidate") candidate: string
  ) {
    return await getAppliedJobsByUser(candidate || authUser.id!);
  }

  @Authorized()
  @Get("/savedJobs")
  async savedJobs(@QueryParam("candidate") candidate: string) {
    return await getSavedJobs(candidate);
  }

  @Authorized()
  @Put()
  async createJob(@Body() body: Job): Promise<ApplyResponse> {
    return await createJob(body);
  }
}

const normalizeFilters = (filters: any[]) => {
  const filterObj: any = {};
  filters.forEach(({ key, value }) => {
    if (typeof value === "string") {
      filterObj[key] = {
        contains: value,
        mode: "insensitive",
      };
    } else {
      filterObj[key] = value;
    }
  });

  return filterObj;
};
