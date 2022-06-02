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
} from "routing-controllers";
import { BigQueryService } from "../services/BigQueryService";
import { BullhornService } from "../services/BullhornService";
import { getSavedCompanies, saveCompany } from "../services/Company";
import { GetroService } from "../services/GetroService";
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
  Company,
  CompanySearchByID,
  CompanySearchByFilterResponse,
  DATASET_MAIN,
  ApplyResponse,
  GetSavedCompaniesResponse,
  Operator,
} from "../types/Common";
import { User } from "../types/User";
import { getDataSource } from "../utils";
import {
  CompanyFilter,
  CompanyFilterKey,
  JobFilter,
} from "../utils/FieldMatch";
import { COORDINATOR } from "../utils/constant";

@JsonController("/api/company")
export class CompanyController {
  @Get("/search")
  async searchJobByID(
    @QueryParam("id") id: string
  ): Promise<CompanySearchByID> {
    const datasource = getDataSource(id);
    if (datasource === DataSource.BULLHORN) {
      const company = await this.getCompanyByIdFromBullhorn(id);
      return {
        company,
        source: datasource,
      };
    } else if (datasource === DataSource.GETRO) {
      const company = await this.getCompanyByIdFromGetro(id);
      return {
        company,
        source: datasource,
      };
    } else {
      return {
        source: DataSource.UNKNOWN,
        message: "unsupported id",
      };
    }
  }

  @Authorized()
  @Put("/save")
  async save(
    @CurrentUser() authUser: User,
    @Body() body: { company: string; candidate?: string }
  ): Promise<ApplyResponse> {
    return await saveCompany(body.company, body.candidate! || authUser.id!);
  }

  @Authorized()
  @Put()
  async insert(
    @Body() body: Company,
    @CurrentUser() authUser: User
  ): Promise<any> {
    if (authUser.role !== COORDINATOR) {
      return {
        result: false,
        error: "You should be a coordinator for creating a company",
      };
    }

    const bullhornService = new BullhornService();
    await bullhornService.init();
    return await bullhornService.insertCompany(body);
  }

  @Authorized()
  @Get("/saved")
  async savedCompanies(
    @CurrentUser() authUser: User,
    @QueryParam("candidate") candidate: string
  ): Promise<GetSavedCompaniesResponse> {
    return await getSavedCompanies(candidate || authUser.id!);
  }

  async getCompanyByIdFromBullhorn(id: string): Promise<Company | undefined> {
    const fields = "*";
    const dataset = DATASET_BULLHORN;
    const table = Tables.COMPANIES;
    const condition = `id = '${id}'`;
    const result = (await BigQueryService.selectQuery(
      dataset,
      table,
      fields,
      undefined,
      condition
    )) as Company[];
    return result ? result[0] : undefined;
  }

  async getCompanyByIdFromGetro(id: string): Promise<Company | undefined> {
    const fields = "*";
    const dataset = DATASET_GETRO;
    const table = Tables.COMPANIES;
    const condition = `id = '${id}'`;
    const result = (await BigQueryService.selectQuery(
      dataset,
      table,
      fields,
      undefined,
      condition
    )) as Company[];
    return result ? result[0] : undefined;
  }

  @Post("/search")
  async searchByFilter(
    @Body() body: FilterBody
  ): Promise<CompanySearchByFilterResponse> {
    try {
      const { filters, fields, page, count, operator } = body;

      let companies: Job[] = await this.getCompaniesFromJoinTable(
        filters,
        fields,
        count,
        operator
      );

      const response = {
        companies: companies || [],
        total: companies?.length,
        message: null,
      };
      return response;
    } catch (error) {
      return {
        message: error,
      };
    }
  }

  getConditionsFromFilters = (
    filters: FilterOption[] | undefined,
    filterableKey: CompanyFilterKey,
    operator: Operator = "OR"
  ) => {
    const _filters = filters?.filter(
      (opt) => CompanyFilter[filterableKey]?.[opt.key] != null
    );
    if (_filters && _filters?.length > 0) {
      const _condition = _filters
        .map((opt) => `LOWER(${opt.key}) LIKE '%${opt.value.toLowerCase()}%'`)
        .join(` ${operator} `);
      return _condition;
    }
    return undefined;
  };

  getJoinedFields = (fields: string[] | null) => {
    return fields?.length ? fields.join(", ") : "*";
  };

  async getCompaniesFromJoinTable(
    filters: FilterOption[] | undefined,
    fields: string[] | null,
    count: number,
    operator: Operator = "OR"
  ): Promise<Company[]> {
    const _fields = this.getJoinedFields(fields);
    const _conditions = this.getConditionsFromFilters(
      filters,
      "joined",
      operator
    );

    const result = (await BigQueryService.selectQuery(
      DATASET_MAIN,
      Tables.JOINED_COMPANIES,
      _fields,
      count,
      _conditions
    )) as Company[];
    return result;
  }

  async getCompaniesByFilterFromBullhorn(
    filters: FilterOption[] | undefined,
    fields: string[] | null,
    page: number,
    count: number,
    operator: Operator = "OR"
  ) {
    const _filters =
      filters?.filter(
        (opt) => Object.keys(CompanyFilter.bullhorn).indexOf(opt.key) > -1
      ) || [];
    const _fields = fields ? fields.join(", ") : "*";
    const _dataset = DATASET_BULLHORN;
    const _table = Tables.COMPANIES;
    const _condition = _filters
      .map(
        (opt) =>
          `LOWER(${
            CompanyFilter.bullhorn[opt.key]
          }) LIKE '%${opt.value.toLowerCase()}%'`
      )
      .join(` ${operator} `);
    const result = await BigQueryService.selectQuery(
      _dataset,
      _table,
      _fields,
      count,
      _condition
    );
    return result;
  }

  async getCompaniesByFilterFromGetro(
    filters: FilterOption[] | undefined,
    fields: string[] | null,
    page: number,
    count: number,
    operator: Operator = "OR"
  ) {
    const _filters =
      filters?.filter(
        (opt) => Object.keys(CompanyFilter.getro).indexOf(opt.key) > -1
      ) || [];
    const _fields = fields ? fields.join(", ") : "*";
    const _dataset = DATASET_GETRO;
    const _table = Tables.COMPANIES;
    const _condition = _filters
      .map(
        (opt) =>
          `LOWER(${
            CompanyFilter.getro[opt.key]
          }) LIKE '%${opt.value.toLowerCase()}%'`
      )
      .join(` ${operator} `);
    const result = await BigQueryService.selectQuery(
      _dataset,
      _table,
      _fields,
      count,
      _condition
    );
    return result;
  }
}
