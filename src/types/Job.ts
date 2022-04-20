export type Job = {
  id?: string;
  externalId?: string;
  description?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country_id?: string;
  employmentType?: string;
  title?: string;
  willRelocate?: string;
  yearsRequired?: string;
  status?: string;
  skillList?: string;
  locations?: string;
  companyId?: string;
  interviews?: string;
  onSite?: string;
  salary?: string;
  salaryUnit?: string;
  startDate?: string;
  type?: string;
  isDeleted?: string;
  postedAt?: string;
};

export type JobKey = keyof Job;

export const ALLOWED_JOB_KEYS = new Set<JobKey>([
  "id",
  "externalId",
  "description",
  "address1",
  "address2",
  "city",
  "state",
  "zip",
  "country_id",
  "employmentType",
  "title",
  "willRelocate",
  "yearsRequired",
  "status",
  "skillList",
  "locations",
  "companyId",
  "interviews",
  "onSite",
  "salary",
  "salaryUnit",
  "startDate",
  "type",
  "isDeleted",
  "postedAt",
]);
