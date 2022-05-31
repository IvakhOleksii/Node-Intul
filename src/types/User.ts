export type User = {
  id?: string;
  externalId?: string;
  firstname?: string;
  lastname?: string;
  gender?: string;
  email: string;
  password?: string;
  role: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  resume?: string;
  avatar?: string;
  linkedin?: string;
  skills?: string;
  expertise?: string;
  seniority?: string;
  workspace?: string;
  referredBy?: string;
  roles?: string;

  description?: string;
  phone?: string;
  status?: string;
  username?: string;
  logo?: string;

  companyName?: string;
  annualRevenue?: string;
  companyURL?: string;
  numEmployees?: string;
  revenue?: string;
  dateFounded?: string;

  employeeType?: string;
  experience?: string;
  hourlyRate?: string;
  willRelocate?: string;
  ethnicity?: string;
  workAuthorized?: string;
  disability?: string;
  occupation?: string;

  employmentPreference?: string;
};

export const IUSER = {
  id: "",
  externalId: "",
  firstname: "",
  lastname: "",
  gender: "",
  email: "",
  password: "",
  role: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  resume: "",
  avatar: "",
  linkedin: "",
  skills: "",
  expertise: "",
  seniority: "",
  workspace: "",
  referredBy: "",
  roles: "",
  description: "",
  phone: "",
  status: "",
  username: "",
  logo: "",
  companyName: "",
  annualRevenue: "",
  companyURL: "",
  numEmployees: "",
  revenue: "",
  dateFounded: "",
  employeeType: "",
  experience: "",
  hourlyRate: "",
  willRelocate: "",
  ethnicity: "",
  workAuthorized: "",
  disability: "",
  occupation: "",
  employmentPreference: "",
};

export const USERKEYS = Object.keys(IUSER);

export type LoginInfo = {
  email: string;
  password: string;
};

export const USER_TABLE = "User";
