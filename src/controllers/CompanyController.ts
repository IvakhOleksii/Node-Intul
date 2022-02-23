import { Controller, Param, Body, Get, Post, Put, Delete, QueryParam, JsonController } from 'routing-controllers';
import { BigQueryService } from '../services/BigQueryService';
import { GetroService } from '../services/GetroService';
import { DATASET_BULLHORN, DATASET_GETRO, FilterOption, Job, FilterBody, JobSearchByFilterResponse, JobSearchByID, DataSource, Tables, Company, CompanySearchByID, CompanySearchByFilterResponse } from '../types/Common';
import { getDataSource } from '../utils';
import { CompanyFilter, JobFilter } from '../utils/FieldMatch';

@JsonController('/api/company')
export class CompanyController {
  @Get('/search')
  async searchJobByID(
    @QueryParam('id') id: string
  ): Promise<CompanySearchByID> {
    const datasource = getDataSource(id);
    if (datasource === DataSource.BULLHORN) {
      const company = await this.getCompanyByIdFromBullhorn(id);
      return {
        company,
        source: datasource
      };
    }
    else if(datasource === DataSource.GETRO) {
      const company = await this.getCompanyByIdFromGetro(id);
      return {
        company,
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

  async getCompanyByIdFromBullhorn(id: string): Promise<Company | undefined> {
    const fields = '*';
    const dataset = DATASET_BULLHORN;
    const table = Tables.COMPANIES;
    const condition = `id = '${id}'`;
    const result = (await BigQueryService.selectQuery(dataset, table, fields, undefined, condition)) as Company[]; 
    return result ? result[0] : undefined;
  }

  async getCompanyByIdFromGetro(id: string): Promise<Company | undefined> {
    const fields = '*';
    const dataset = DATASET_GETRO;
    const table = Tables.COMPANIES;
    const condition = `id = '${id}'`;
    const result = (await BigQueryService.selectQuery(dataset, table, fields, undefined, condition)) as Company[]; 
    return result ? result[0] : undefined;
  }

  @Post('/search')
  async searchByFilter(
    @Body() body: FilterBody
  ): Promise<CompanySearchByFilterResponse> {
    try {
      const { filters, fields, page, count } = body;
      const bullhornCompanies = (await this.getCompaniesByFilterFromBullhorn(filters, fields, page, count)) as Company[] ;
      const getroCompanies = (await this.getCompaniesByFilterFromGetro(filters, fields, page, count)) as Company[] ;
      let companies: Job[] = [];
      if (bullhornCompanies) {
        companies = [...bullhornCompanies]
      }
      if (getroCompanies) {
        companies = [...companies, ...getroCompanies];
      }
      const response = {
        companies: companies,
        total: companies?.length,
        message: null
      };
      return response;
    } catch (error) {
      return {
        message: error
      };
    }
  }

  async getCompaniesByFilterFromBullhorn(
    filters: FilterOption[] | undefined,
    fields: string[] | null,
    page: number,
    count: number
  ) {
    const _filters = filters?.filter(opt => Object.keys(CompanyFilter.bullhorn).indexOf(opt.key) > -1);
    if (_filters && _filters?.length > 0) {
      const _fields = fields ? fields.join(' ') : '*';
      const _dataset = DATASET_BULLHORN;
      const _table = Tables.COMPANIES;
      const _condition = _filters
        .map(opt => `${CompanyFilter.bullhorn[opt.key]} LIKE '%${opt.value}%'`)
        .join(' AND ');
      const result = await BigQueryService.selectQuery(_dataset, _table, _fields, count, _condition);
      return result;
    }
    return null;
  }

  async getCompaniesByFilterFromGetro(
    filters: FilterOption[] | undefined,
    fields: string[] | null,
    page: number,
    count: number
  ) {
    const _filters = filters?.filter(opt => Object.keys(CompanyFilter.getro).indexOf(opt.key) > -1);
    if (_filters && _filters?.length > 0) {
      const _fields = fields ? fields.join(' ') : '*';
      const _dataset = DATASET_GETRO;
      const _table = Tables.COMPANIES;
      const _condition = _filters
        .map(opt => `${CompanyFilter.getro[opt.key]} LIKE '%${opt.value}%'`)
        .join(' AND ');
      const result = await BigQueryService.selectQuery(_dataset, _table, _fields, count, _condition);
      return result;
    }
    return null;
  }
}