import { Dictionary, TypedDictionary } from "typed-two-way-map";

export const JobFilter: any = {
  bullhorn: {
    title: "title",
    skill: "skillList",
    city: "address_city",
    employmentType: "employmentType",
  },
};

export type CompanyFilterKey = "bullhorn" | "getro" | "joined";

export const CompanyFilter: TypedDictionary<
  CompanyFilterKey,
  Dictionary<string>
> = {
  bullhorn: {
    name: "name",
    city: "address_city",
    industry: "industryList",
  },
  getro: {
    name: "name",
    city: "locations",
  },
  joined: {
    name: "name",
  },
};

export const USER_FILTER: any = {
  firstname: "firstname",
  lastname: "lastname",
  role: "role",
  city: "city",
  state: "state",
  skills: "skills",
  expertise: "expertise",
};
