import { Controller, Param, Body, Get, Post, Put, Delete, QueryParam } from 'routing-controllers';
import { GetroService } from '../services/GetroService';

@Controller()
export class GetroController {
  @Get('/getro/companies')
  async getCompanies() {
    return await (await GetroService.getClient()).getCompanies();    
  }
  
  @Get('/getro/members')
  async getMembers() {
    return await (await GetroService.getClient()).getMembers();    
  }
  
  @Get('/getro/jobs')
  async getJobs() {
    return await (await GetroService.getClient()).getJobs();    
  }
}