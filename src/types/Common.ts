import config from "../config";
import {
  Job as BullhornJob,
  Company as BullhornCompany,
} from "../types/Bullhorn";
import { Job as GetroJob, Company as GetroCompany } from "../types/Getro";
import { Category } from "./Category";
import { User } from "./User";

export enum Tables {
  COMPANIES = "Companies",
  JOBS = "Jobs",
  USER = "User",
  CONTACTS = "Contacts",
  LEADS = "Leads",
  CANDIDATES = "Candidates",
  APPLICATIONS = "Applications",
  SAVEDJOBS = "SavedJobs",
  SAVED_COMPANIES = "SavedCompanies",
  SAVED_CANDIDATES = "SavedCandidates",
  JOINED_COMPANIES = "companies_joined",
  JOINED_CANDIDATES = "candidates_joined",
  CATEGORIES = "Categories",
}

export const DATASET_BULLHORN = config.bullhornDatasetID || "";
export const DATASET_GETRO = config.getroDatasetID || "";
export const DATASET_MAIN = config.mainDatasetID || "";

// Common
export enum DataSource {
  BULLHORN = "bullhorn",
  GETRO = "getro",
  UNKNOWN = "unknown",
}

export type DataSources = "bullhorn" | "getro" | "main" | "all";

type Operator = "AND" | "OR";

export type FilterOption = {
  key: string;
  value: string;
};

export type AdvancedFilterOption = {
  key: string;
  value: string | string[];
  operator?: Operator;
};

export type FilterBody = {
  filters?: FilterOption[];
  fields: string[] | null;
  page: number;
  count: number;
};

type CountFilterResponse = {
  total?: number;
  message?: any;
};

// Job Types
export type Job = BullhornJob | GetroJob;
export type JobSearchByID = {
  job?: Job;
  source: DataSource;
  message?: string;
};

export type JobSearchByFilterResponse =
  | {
      jobs?: Job[];
      total?: number;
      message?: any;
    }
  | AllJobsResponse;

export type AllJobsResponse = {
  bullhorn: JobSearchByFilterResponse;
  getro: JobSearchByFilterResponse;
  main: JobSearchByFilterResponse;
};

export type ApplyResponse = {
  result: boolean;
  message?: any;
};

export type GetSavedCompaniesResponse = {
  companies?: Company[];
} & ApplyResponse;

export type GetSavedJobsResponse = {
  jobs?: Job[];
  result: boolean;
  message?: any;
};

export type GetCandidatesOnJobResponse = {
  candidates?: any[];
  result: boolean;
  message?: any;
};

// Company Types
export type Company = BullhornCompany | GetroCompany;
export type CompanySearchByID = {
  company?: Company;
  source: DataSource;
  message?: string;
};

export type CompanySearchByFilterResponse = {
  companies?: Company[];
  total?: number;
  message?: any;
};

// Candidate Types
export type CandidateSearchByIdResponse = {
  candidate?: User;
  message?: any;
};

export type CandidateSearchByFilterResponse = {
  candidates?: User[];
  total?: number;
  message?: any;
};

export type UpdateComapnyProfileResponse = {
  result: boolean;
  message?: any;
};

// Category Types
export type CategorySearchByFilterResponse = {
  categories?: Category[];
} & CountFilterResponse;

export type CategoryByIdResponse = {
  category?: Category;
  message?: any;
};
