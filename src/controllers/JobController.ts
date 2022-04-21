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
import { getDataSource } from "../utils";
import { JobFilter } from "../utils/FieldMatch";
import {
  getCandidatesOnJob,
  getSavedJobs,
  saveApplication,
  saveJob,
} from "../utils/MainCrud";

@JsonController("/api/job")
export class JobController {
  @Get("/search")
  async searchJobByID(@QueryParam("id") id: string): Promise<JobSearchByID> {
    const datasource = getDataSource(id);
    if (datasource === DataSource.BULLHORN) {
      const job = await this.getJobFromBullhorn(id);
      return {
        job,
        source: datasource,
      };
    } else if (datasource === DataSource.GETRO) {
      const job = await this.getJobFromGetro(id);
      return {
        job,
        source: datasource,
      };
    } else {
      return {
        source: DataSource.UNKNOWN,
        message: "unsupported id",
      };
    }
  }

  async getJobFromBullhorn(id: string): Promise<Job | undefined> {
    const fields = "*";
    const dataset = DATASET_BULLHORN;
    const table = Tables.JOBS;
    const condition = `id = '${id}'`;
    const result = (await BigQueryService.selectQuery(
      dataset,
      table,
      fields,
      undefined,
      condition
    )) as Job[];
    return result ? result[0] : undefined;
  }

  async getJobFromGetro(id: string): Promise<Job | undefined> {
    const fields = "*";
    const dataset = DATASET_GETRO;
    const table = Tables.JOBS;
    const condition = `id = '${id}'`;
    const result = (await BigQueryService.selectQuery(
      dataset,
      table,
      fields,
      undefined,
      condition
    )) as Job[];
    return result ? result[0] : undefined;
  }

  @Post("/search")
  async searchByFilter(
    @Body() body: FilterBody & { datasource?: DataSources }
  ): Promise<JobSearchByFilterResponse> {
    try {
      const { filters, fields, page, count, datasource, operator } = body;

      const _datasource = datasource ?? "bullhorn";

      const jobsToGet = [];

      switch (_datasource) {
        case "bullhorn":
          jobsToGet.push(
            this.getJobsByFilterFromBullhorn(
              filters,
              fields,
              page,
              count,
              operator
            )
          );
          break;
        case "getro":
          jobsToGet.push(
            this.getJobsByFilterFromGetro(
              filters,
              fields || [],
              count,
              operator
            )
          );
          break;
        case "main":
          jobsToGet.push(
            this.getJobsByFilterFromMain(filters, fields || [], count, operator)
          );
          break;
        case "all":
          jobsToGet.push(
            this.getJobsByFilterFromBullhorn(
              filters,
              fields,
              page,
              count,
              operator
            )
          );
          jobsToGet.push(
            this.getJobsByFilterFromGetro(
              filters,
              fields || [],
              count,
              operator
            )
          );
          jobsToGet.push(
            this.getJobsByFilterFromMain(filters, fields || [], count, operator)
          );
          break;
        default:
          throw "invalid datasource";
      }

      if (_datasource === "all") {
        const [bullhornJobs, mainJobs, getroJobs] = await Promise.all(
          jobsToGet
        );
        return {
          bullhorn: {
            jobs: bullhornJobs || undefined,
            total: bullhornJobs?.length,
          },
          main: {
            jobs: mainJobs || undefined,
            total: mainJobs?.length,
          },
          getro: {
            jobs: getroJobs || undefined,
            total: getroJobs?.length,
          },
        };
      } else {
        const [jobs] = await Promise.all(jobsToGet);
        return {
          jobs: jobs as Job[],
          total: jobs?.length,
          message: null,
        };
      }
    } catch (error) {
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
        const operator = opt.operator || "OR";
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

    const condition = this.getFilterConditions(_filters, operator);
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

      const alias = "bh_jobs";
      const companyAlias = "company";

      const _fields = fields?.length
        ? fields.join(", ")
        : `${alias}.*, ${companyAlias}.bh_url as company_url, ${companyAlias}.name as company_name, ${companyAlias}.logo as company_logo`;

      const _join = `
        LEFT JOIN \`${DATASET_MAIN}.${Tables.JOINED_COMPANIES}\` as ${companyAlias} 
        ON CONCAT("bl-", ${alias}.clientCorporationID) = ${companyAlias}.bh_id
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

  @Authorized()
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
  async savedJobs(
    @QueryParam("candidate") candidate: string
  ): Promise<GetSavedJobsResponse> {
    return await getSavedJobs(candidate);
  }

  @Authorized()
  @Put()
  async createJob(@Body() body: Job): Promise<ApplyResponse> {
    return await createJob(body);
  }
}
