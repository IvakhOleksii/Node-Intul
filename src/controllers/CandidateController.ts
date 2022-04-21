import { Controller, Param, Body, Get, Post, Put, Delete, QueryParam, JsonController, Authorized, CurrentUser } from 'routing-controllers';
import { BigQueryService } from '../services/BigQueryService';
import { saveCandidate, getSavedCandidates } from '../services/Candidate';
import { GetroService } from '../services/GetroService';
import { FilterBody, Tables, GetSavedJobsResponse, CandidateSearchByFilterResponse, CandidateSearchByIdResponse, DATASET_MAIN, Company, UpdateComapnyProfileResponse } from '../types/Common';
import { User } from '../types/User';
import { getDataSource } from '../utils';
import { COMPANY } from '../utils/constant';
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
      const table = Tables.JOINED_CANDIDATES;
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
      const _filters = filters?.filter(opt => USER_FILTER[opt.key] != null) || [];
      _filters.push({key: 'role', value: 'candidate'});
      if (_filters && _filters?.length > 0) {
        const _fields = fields ? fields.join(' ') : '*';
        const _dataset = DATASET_MAIN;
        const _table = Tables.JOINED_CANDIDATES;
        const _condition = _filters
          .map(opt => `LOWER(${USER_FILTER[opt.key]}) LIKE '%${typeof opt.value == "string" ? opt.value.toLowerCase() : opt.value}%'`)
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

  @Authorized()
  @Put('/save')
  async save(
    @Body() body: { candidate: string, company: string },
    @CurrentUser() authUser: User,
  ) {
    if(authUser.role === COMPANY) {
      return await saveCandidate(body.candidate, body.company || authUser.id!);
    }else{
      return {
        result: false,
        message: 'You are not a company'
      }
    }
  }

  @Authorized()
  @Get('/saved')
  async savedCandidates(
    @CurrentUser() authUser: User,
    @QueryParam('candidate') candidate: string,
  ) {
    return await getSavedCandidates(candidate || authUser.id!);
  }
}