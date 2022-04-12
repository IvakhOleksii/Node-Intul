import { Controller, Param, Body, Get, Post, Put, Delete, QueryParam, JsonController, Authorized } from 'routing-controllers';
import { BigQueryService } from '../services/BigQueryService';
import { GetroService } from '../services/GetroService';
import { FilterBody, Tables, GetSavedJobsResponse, CandidateSearchByFilterResponse, CandidateSearchByIdResponse, DATASET_MAIN, Company, UpdateComapnyProfileResponse } from '../types/Common';
import { User } from '../types/User';
import { getDataSource } from '../utils';
import { JobFilter, USER_FILTER } from '../utils/FieldMatch';
import { getSavedJobs, saveApplication, saveJob } from '../utils/MainCrud';

@JsonController('/api/candidate')
export class JobController {
  @Authorized()
  @Get('/savedJobs')
  async savedJobs(
    @QueryParam('candidate') candidate: string,
  ): Promise<GetSavedJobsResponse> {
    return await getSavedJobs(candidate);
  }

  @Authorized()
  @Get('/search')
  async searchById(
    @QueryParam('id') id: string
  ): Promise<CandidateSearchByIdResponse> {
    try {
      const fields = '*';
      const dataset = DATASET_MAIN;
      const table = Tables.USER;
      const condition = `id = '${id}' AND role = 'candidate'`;
      const result = (await BigQueryService.selectQuery(dataset, table, fields, undefined, condition)) as User[]; 
      return {
        candidate: result ? result[0] : undefined,
        message: result && !result[0] ? "No user with given ID" : undefined
      };
    } catch (error) {
      return { message: error };
    }
  }

  @Authorized()
  @Post('/search')
  async searchByFilters(
    @Body() body: FilterBody
  ): Promise<CandidateSearchByFilterResponse> {
    try {
      const { filters, fields, page, count } = body;
      const _filters = filters?.filter(opt => Object.keys(USER_FILTER).indexOf(opt.key) > -1) || [];
      _filters.push({key: 'role', value: 'candidate'});
      if (_filters && _filters?.length > 0) {
        const _fields = fields ? fields.join(' ') : '*';
        const _dataset = DATASET_MAIN;
        const _table = Tables.USER;
        const _condition = _filters
          .map(opt => `${USER_FILTER[opt.key]} LIKE '%${opt.value}%'`)
          .join(' AND ');
        const result = await BigQueryService.selectQuery(_dataset, _table, _fields, count, _condition);
        return {
          candidates: result || []
        }
      }
      return {
        message: 'Invalid filter'
      };
    } catch (error) {
      console.log(error);
      return { message: error };
    }
  }
}