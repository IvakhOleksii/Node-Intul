import { Controller, Param, Body, Get, Post, Put, Delete, QueryParam } from 'routing-controllers';
import { BullhornService } from '../services/BullhornService';

@Controller()
export class BullhornController {
  @Get('/bullhorn/companies')
  async getCompanies() {
    return await (await BullhornService.getClient()).getCompanies();
  }

  @Get('/bullhorn/jobs')
  async getJobs() {
    return await (await BullhornService.getClient()).getJobs();
  }

  @Get('/bullhorn/clientContacts')
  async getClientContacts() {
    return await (await BullhornService.getClient()).getClientContacts();
  }

  @Get('/bullhorn/candidates')
  async getCandidates() {
    return await (await BullhornService.getClient()).getCandidates();
  }

  @Get('/bullhorn/leads')
  async getLeads() {
    return await (await BullhornService.getClient()).getLeads();
  }
}