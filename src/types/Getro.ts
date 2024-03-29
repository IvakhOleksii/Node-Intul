export type Company = {
  id: string;
  angellist_url?: string;
  approx_employees?: string;
  crunchbase_url?: string;
  description?: string;
  domain?: string;
  facebook_url?: string;
  founded?: string;
  instagram_url?: string;
  jobs_count?: string;
  linkedin_url?: string;
  logo_url?: string;
  name?: string;
  ocp_search_status?: string;
  scraping_enabled?: string;
  slug?: string;
  status?: string;
  topics?: string;
  twitter_url?: string;
  url?: string;
  website_url?: string;
  managers?: string;
  network_id?: string;
  locations?: string;
  collections?: string;
};

export type Job = {
  id: string;
  application_method?: string;
  application_path?: string;
  compensation_currency?: string;
  compensation_max?: string;
  compensation_min?: string;
  compensation_period?: string;
  compensation_public?: string;
  description?: string;
  discarded?: string;
  employment_types?: string;
  expires_at?: string;
  job_functions?: string;
  locations?: string;
  organization_id?: string;
  passes_filter?: string;
  posted_at?: string;
  slug?: string;
  source?: string;
  status?: string;
  title?: string;
  url?: string;
  hidden?: boolean;
};

export const ALLOWED_GETRO_FILTERS = new Set<keyof Job>([
  "id",
  "application_method",
  "application_path",
  "compensation_currency",
  "compensation_max",
  "compensation_min",
  "compensation_period",
  "compensation_public",
  "description",
  "discarded",
  "employment_types",
  "expires_at",
  "job_functions",
  "locations",
  "organization_id",
  "passes_filter",
  "posted_at",
  "slug",
  "source",
  "status",
  "title",
  "url",
  "hidden",
]);

export type User = {
  id: string;
  avatar_url?: string;
  bio?: string;
  dribbble_url?: string;
  email?: string;
  first_name?: string;
  github_url?: string;
  introduction_requested?: string;
  last_name?: string;
  linkedin_url?: string;
  resume_url?: string;
  share_permission?: string;
  skills?: string;
  talent_groups?: string;
  twitter_url?: string;
  verified?: string;
  website_url?: string;
  invited?: string;
  invited_by?: string;
  job_search_status?: string;
  joined_at?: string;
  remote_work?: string;
  require_sponsorship_visa?: string;
  seniority?: string;
  employment_type?: string;
  will_work_anywhere?: string;
  us_work_authorization?: string;
};
