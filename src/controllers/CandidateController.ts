import { Controller, Param, Body, Get, Post, Put, Delete, QueryParam, JsonController } from 'routing-controllers';
import { BigQueryService } from '../services/BigQueryService';
import { GetroService } from '../services/GetroService';
import { DATASET_BULLHORN, DATASET_GETRO, FilterOption, Job, FilterBody, JobSearchByFilterResponse, JobSearchByID, DataSource, Tables, ApplyResponse, GetSavedJobsResponse } from '../types/Common';
import { getDataSource } from '../utils';
import { JobFilter } from '../utils/FieldMatch';
import { getSavedJobs, saveApplication, saveJob } from '../utils/MainCrud';

@JsonController('/api/candidate')
export class JobController {
  @Get('/savedJobs')
  async savedJobs(
    @QueryParam('candidate') candidate: string,
  ): Promise<GetSavedJobsResponse> {
    return await getSavedJobs(candidate);
  }
}