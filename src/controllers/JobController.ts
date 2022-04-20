import { Controller, Param, Body, Get, Post, Put, Delete, QueryParam, JsonController, Authorized, CurrentUser } from 'routing-controllers';
import { BigQueryService } from '../services/BigQueryService';
import { GetroService } from '../services/GetroService';
import { createJob, getAppliedJobsByUser } from '../services/Job';
import { DATASET_BULLHORN, DATASET_GETRO, FilterOption, Job, FilterBody, JobSearchByFilterResponse, JobSearchByID, DataSource, Tables, ApplyResponse, GetSavedJobsResponse } from '../types/Common';
import { User } from '../types/User';
import { getDataSource } from '../utils';
import { JobFilter } from '../utils/FieldMatch';
import { getCandidatesOnJob, getSavedJobs, saveApplication, saveJob } from '../utils/MainCrud';

@JsonController('/api/job')
export class JobController {
  @Get('/search')
  async searchJobByID(
    @QueryParam('id') id: string
  ): Promise<JobSearchByID> {
    const datasource = getDataSource(id);
    if (datasource === DataSource.BULLHORN) {
      const job = await this.getJobFromBullhorn(id);
      return {
        job,
        source: datasource
      };
    }
    else if(datasource === DataSource.GETRO) {
      const job = await this.getJobFromGetro(id);
      return {
        job,
        source: datasource
      };
    }
    else {
      return {
        source: DataSource.UNKNOWN,
        message: 'unsupported id'
      };
    }
  }

  async getJobFromBullhorn(id: string): Promise<Job | undefined> {
    const fields = '*';
    const dataset = DATASET_BULLHORN;
    const table = Tables.JOBS;
    const condition = `id = '${id}'`;
    const result = (await BigQueryService.selectQuery(dataset, table, fields, undefined, condition)) as Job[]; 
    return result ? result[0] : undefined;
  }

  async getJobFromGetro(id: string): Promise<Job | undefined> {
    const fields = '*';
    const dataset = DATASET_GETRO;
    const table = Tables.JOBS;
    const condition = `id = '${id}'`;
    const result = (await BigQueryService.selectQuery(dataset, table, fields, undefined, condition)) as Job[]; 
    return result ? result[0] : undefined;
  }

  @Post('/search')
  async searchByFilter(
    @Body() body: FilterBody
  ): Promise<JobSearchByFilterResponse> {
    try {
      const { filters, fields, page, count } = body;
      const bullhornJobs = (await this.getJobsByFilterFromBullhorn(filters, fields, page, count)) as Job[] ;
      const response = {
        jobs: bullhornJobs,
        total: bullhornJobs?.length,
        message: null
      };
      return response;
    } catch (error) {
      return {
        message: error
      };
    }
  }

  async getJobsByFilterFromBullhorn(
    filters: FilterOption[] | undefined,
    fields: string[] | null,
    page: number,
    count: number
  ) {
    if (filters?.map(opt => Object.keys(JobFilter.bullhorn).indexOf(opt.key) > -1).every(val => val === true)) {
      const _fields = fields ? fields.join(', ') : '*';
      const _dataset = DATASET_BULLHORN;
      const _table = Tables.JOBS;
      const _condition = filters && filters
        .map(opt => `LOWER(${JobFilter.bullhorn[opt.key]}) LIKE '%${opt.value.toLowerCase()}%'`)
        .join(' AND ');
      return await BigQueryService.selectQuery(_dataset, _table, _fields, count, _condition);
    }
    throw "invalid filter options";
  }

  @Authorized()
  @Get('/apply')
  async apply(
    @QueryParam('candidate') candidate: string,
    @QueryParam('job') job: string
  ): Promise<ApplyResponse> {
    return await saveApplication(job, candidate);
  }

  @Authorized()
  @Get('/candidates')
  async getCandidates(
    @QueryParam('job') job: string
  ) {
    return await getCandidatesOnJob(job);
  }

  @Authorized()
  @Put('/save')
  async save(
    @QueryParam('candidate') candidate: string,
    @QueryParam('job') job: string
  ): Promise<ApplyResponse> {
    return await saveJob(job, candidate);
  }

  @Authorized()
  @Get("/applied")
  async getAppliedJobs(
    @CurrentUser() authUser: User,
    @QueryParam('candidate') candidate: string,
  ) {
    return await getAppliedJobsByUser(candidate || authUser.id!);
  }

  @Authorized()
  @Get('/savedJobs')
  async savedJobs(
    @QueryParam('candidate') candidate: string,
  ): Promise<GetSavedJobsResponse> {
    return await getSavedJobs(candidate);
  }

  @Authorized()
  @Put()
  async createJob(
    @Body() body: Job
  ): Promise<ApplyResponse> {
    return await createJob(body)
  }
}