import config from "../config";
import { Job as BullhornJob, Company as BullhornCompany } from '../types/Bullhorn';
import { Job as GetroJob , Company as GetroCompany} from '../types/Getro';

export enum Tables {
    COMPANIES = 'Companies',
    JOBS = 'Jobs',
    USER = 'User',
    CANDIDATES = 'Candidates',
    APPLICATIONS = 'Applications',
    SAVEDJOBS = 'SavedJobs',
}

export const DATASET_BULLHORN = config.bullhornDatasetID || '';
export const DATASET_GETRO = config.getroDatasetID || '';
export const DATASET_MAIN = config.mainDatasetID || '';

// Common
export enum DataSource {
    BULLHORN = 'bullhorn',
    GETRO = 'getro',
    UNKNOWN = 'unknown'
}

export type FilterOption = {
    key: string,
    value: string,
}

export type FilterBody = {
    filters?: FilterOption[];
    fields: string[] | null;
    page: number;
    count: number;
}

// Job Types
export type Job = BullhornJob | GetroJob;
export type JobSearchByID = {
    job?: Job,
    source: DataSource;
    message?: string;
}

export type JobSearchByFilterResponse = {
    jobs?: Job[];
    total?: number;
    message?: any;
}

export type ApplyResponse = {
    result: boolean;
    message?: any;
}

export type GetSavedJobsResponse = {
    jobs?: Job[];
    result: boolean;
    message?: any;
}

export type GetCandidatesOnJobResponse = {
    candidates?: any[];
    result: boolean;
    message?: any;
}

// Company Types
export type Company = BullhornCompany | GetroCompany;
export type CompanySearchByID = {
    company?: Company,
    source: DataSource;
    message?: string;
}

export type CompanySearchByFilterResponse = {
    companies?: Company[];
    total?: number;
    message?: any;
}