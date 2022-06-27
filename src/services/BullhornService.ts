import axios from "axios";
import config from "../config";
import queryString from "query-string";
import {
  saveCandidates,
  saveClientContacts,
  saveCompanies,
  saveJobs,
  saveLeads,
} from "../utils/BullhornCrud";
import fs from "fs";
import { checkForJobFilter, sleep } from "../utils";
import { User } from "../types/User";
import { Job } from "prisma/prisma-client";

export class BullhornService {
  public static client: BullhornService | null = null;
  private auth_code = null;
  private access_token = null;
  private refresh_token = null;
  private BhRestToken = null;
  private restUrl = null;
  private corpToken = null;
  private oauth_url = "https://auth.bullhornstaffing.com/oauth";
  private api_base_url = "https://rest.bullhornstaffing.com/rest-services";

  public static async getClient() {
    if (BullhornService.client === null) {
      BullhornService.client = new BullhornService();
      await BullhornService.client.init(false);
    }
    return BullhornService.client;
  }

  async init(invalid = true): Promise<boolean> {
    if (!invalid) {
      const cookie: any = await this.getCookie();
      if (cookie !== null) {
        const { auth_code, access_token, refresh_token, BhRestToken, restUrl } =
          cookie;
        this.auth_code = auth_code;
        this.access_token = access_token;
        this.refresh_token = refresh_token;
        this.BhRestToken = BhRestToken;
        this.restUrl = restUrl;
        if (
          this.auth_code &&
          this.access_token &&
          this.refresh_token &&
          this.BhRestToken &&
          this.restUrl
        )
          return true;
      }
    }
    if (await this.getAuthCode()) {
      if (await this.getAccessToken()) return await this.login();
    }
    return false;
  }

  async getCookie() {
    const targetFile = __dirname + "/../config/cookie.json";
    return new Promise((resolve) => {
      fs.readFile(targetFile, async function (err, data) {
        if (err) {
          return resolve(null);
        }
        let cookies = JSON.parse(data.toString());
        return resolve(cookies);
      });
    });
  }

  async setCookie(data: any) {
    const targetFile = __dirname + "/../config/cookie.json";
    return new Promise((resolve, reject) => {
      // Try saving the file.
      fs.writeFile(targetFile, JSON.stringify(data), { flag: "w+" }, (err) => {
        if (err) reject(err);
        else {
          resolve(targetFile);
        }
      });
    });
  }

  async getAuthCode(): Promise<boolean> {
    console.log("\n***** getAuthCode *****");
    const query = queryString.stringify(
      {
        client_id: config.bullhornClientID,
        response_type: "code",
        action: "Login",
        username: config.bullhornApiUsername,
        password: config.bullhornApiPassword,
      },
      { encode: false }
    );
    const url = `${this.oauth_url}/authorize?${query}`;
    console.log("url =", url);
    const res = await axios.get(url);
    if (res.status === 200) {
      const path = res.request.path;
      console.log("path =", path);
      this.auth_code = path
        .slice(7, path.indexOf("&client"))
        .replace("%25", "%");
      console.log("Auth Code: ", this.auth_code);
      return true;
    }
    return false;
  }

  async getAccessToken(): Promise<boolean> {
    console.log("\n***** getAccessToken *****");
    const query = queryString.stringify(
      {
        grant_type: "authorization_code",
        client_id: config.bullhornClientID,
        client_secret: config.bullhornClientSecret,
        code: this.auth_code,
      },
      { encode: false }
    );
    const url = `${this.oauth_url}/token?${query}`;
    console.log(url);
    const res = await axios.post(url);
    console.log(res.status);
    console.log(res);
    console.log("============================ \n");
    if (res.status === 200) {
      const { access_token, refresh_token } = res.data;
      this.access_token = access_token;
      this.refresh_token = refresh_token;
      console.log("Access Token: ", this.access_token);
      console.log("Refresh Token: ", this.refresh_token);
      return true;
    }
    return await this.getNewAccessToken();
  }

  async getNewAccessToken(): Promise<boolean> {
    console.log("\n***** getNewAccessToken *****");
    try {
      const query = queryString.stringify(
        {
          grant_type: "refresh_token",
          client_id: config.bullhornClientID,
          client_secret: config.bullhornClientSecret,
          refresh_token: this.refresh_token,
        },
        { encode: false }
      );
      const url = `${this.oauth_url}/token?${query}`;
      console.log("access token url: ", url);
      const res = await axios.post(url);
      console.log(res.status);
      if (res.status === 200) {
        const { access_token, refresh_token } = res.data;
        this.access_token = access_token;
        this.refresh_token = refresh_token;
        return await this.login();
      }
      return await this.init();
    } catch (error: any) {
      console.log("Error on getNewAccessToken", error.message);
      return await this.init();
    }
  }

  async login(): Promise<boolean> {
    console.log("\n***** login *****");
    let retryNo = 0;
    while (retryNo < 3) {
      try {
        const query = queryString.stringify(
          {
            version: "*",
            access_token: this.access_token,
          },
          { encode: false }
        );
        const url = `${this.api_base_url}/login?${query}`;
        const res = await axios.post(url);
        if (res.status === 200) {
          const { BhRestToken, restUrl } = res.data;
          this.BhRestToken = BhRestToken;
          this.restUrl = restUrl;
          this.corpToken = restUrl.split("/")[4];
          console.log("BhRestToken: ", this.BhRestToken);
          console.log("restUrl: ", this.restUrl);
          console.log("corpToken: ", this.corpToken);

          await this.setCookie({
            auth_code: this.auth_code,
            access_token: this.access_token,
            refresh_token: this.refresh_token,
            BhRestToken: this.BhRestToken,
            restUrl: this.restUrl,
          });
          return true;
        } else if (res.status === 400) {
          await this.getNewAccessToken();
        }
      } catch (error: any) {
        console.log(error.message);
        await sleep(1000);
        retryNo++;
        console.log("\nxxxxx login failed: retrying now");
      }
    }
    return false;
  }

  async getCompanies(
    testMode = false,
    count = 50,
    sort = "-dateAdded"
  ): Promise<any> {
    console.log("\n***** getAllCompanies *****");
    let offset = 0;
    let total = 100000;
    let repeatErr = 0;

    while (repeatErr < 3) {
      console.log(`\nBullhorn_GET_COMPANY: ${total} / ${offset}`);
      try {
        const query = queryString.stringify({
          BhRestToken: this.BhRestToken,
          fields: [
            "id",
            "address",
            "annualRevenue",
            "billingAddress",
            "billingContact",
            "billingFrequency",
            "billingPhone",
            "businessSectorList",
            "companyDescription",
            "companyURL",
            "competitors",
            "culture",
            "dateAdded",
            "dateFounded",
            "dateLastModified",
            "externalID",
            "feeArrangement",
            "funding",
            "industryList",
            "name",
            "notes",
            "numEmployees",
            "numOffices",
            "phone",
            "revenue",
            "status",
            "taxRate",
            "tickerSymbol",
            "workWeekStart",
          ].join(","),
          query: "id:[* TO *]  AND NOT status:Archive",
          start: offset,
          count,
          sort,
        });
        const url = `${this.restUrl}search/ClientCorporation?${query}`;
        const res = await axios.get(url, {
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
          },
        });
        if (res.status === 200) {
          const { data, count } = res.data;
          total = res.data.total;
          const updatedData = data.map((d: any) => ({
            ...d,
            id: `bl-${d.id}`,
            address_address1: d.address?.address1 || null,
            address_address2: d.address?.address2 || null,
            address_city: d.address?.city || null,
            address_state: d.address?.state || null,
            address_zip: d.address?.zip || null,
            address_country_id: d.address?.countryID || null,
            billingAddress_address1: d.bllingAddress?.address1 || null,
            billingAddress_address2: d.bllingAddress?.address2 || null,
            billingAddress_city: d.bllingAddress?.city || null,
            billingAddress_state: d.bllingAddress?.state || null,
            billingAddress_zip: d.bllingAddress?.zip || null,
          }));
          if (!testMode) {
            const res = await saveCompanies(updatedData);
            if (res === -1) return -1;
          }
          offset += count;
          repeatErr = 0;
          if (total <= offset) break;
        } else if (res.status === 404) {
          break;
        } else {
          console.log(url);
          throw "error";
        }
      } catch (error: any) {
        console.log(error, "\nrepeatNumber =", repeatErr);
        repeatErr++;
        await this.getNewAccessToken();
      }
    }
  }

  async insertCompany(company: any): Promise<any> {
    console.log("\n***** insertCompany *****");
    try {
      const query = queryString.stringify({
        BhRestToken: this.BhRestToken,
      });
      const url = `${this.restUrl}entity/ClientCorporation?${query}`;
      console.log(url);
      const res = await axios.put(url, JSON.stringify(company), {
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          Accept: "*/*",
        },
      });
      if (res.status === 200) {
        console.log("insertCompany success");
        const bullhornId = res.data.changedEntityId;
        const newDbCompany = {
          ...company,
          id: `bl-${bullhornId}`,
          address_address1: company.address?.address1 || null,
          address_address2: company.address?.address2 || null,
          address_city: company.address?.city || null,
          address_state: company.address?.state || null,
          address_zip: company.address?.zip || null,
          address_country_id: company.address?.countryID || null,
          billingAddress_address1: company.bllingAddress?.address1 || null,
          billingAddress_address2: company.bllingAddress?.address2 || null,
          billingAddress_city: company.bllingAddress?.city || null,
          billingAddress_state: company.bllingAddress?.state || null,
          billingAddress_zip: company.bllingAddress?.zip || null,
        };
        await saveCompanies([newDbCompany]);
        return {
          result: true,
          newDbCompany,
        };
      } else {
        console.log("insertCompany failed");
        return {
          result: false,
          error: res.data.error,
        };
      }
    } catch (err) {
      console.log(err);
      return {
        result: false,
        message: err,
      };
    }
  }

  async getJobs(
    testMode = false,
    count = 1000,
    sort = "-dateAdded"
  ): Promise<any> {
    console.log("\n***** getJobs *****");
    let offset = 0;
    let total = 100000;
    let repeatErr = 0;

    while (repeatErr < 3) {
      console.log(`\nBullhorn_GET_JOBS: ${total} / ${offset}`);
      try {
        const query = queryString.stringify({
          BhRestToken: this.BhRestToken,
          fields: [
            "id",
            "address",
            "benefits",
            "billRateCategoryID",
            "bonusPackage",
            "certificationList",
            "clientBillRate",
            "clientContact",
            "clientCorporation",
            // 'dateAdded',
            // 'dateClosed',
            // 'dateEnd',
            // 'dateLastExported',
            // 'dateLastModified',
            // 'dateLastPublished',
            "degreeList",
            "description",
            "durationWeeks",
            "educationDegree",
            "employmentType",
            "externalID",
            "feeArrangement",
            "hoursOfOperation",
            "hoursPerWeek",
            "interviews",
            "isClientEditable",
            "isDeleted",
            "isInterviewRequired",
            "isJobcastPublished",
            "isOpen",
            "isPublic",
            "location",
            "markUpPercentage",
            "numOpenings",
            "onSite",
            "owner",
            "payRate",
            "publicDescription",
            "publishedZip",
            "reasonClosed",
            "reportTo",
            "reportToClientContact",
            "salary",
            "salaryUnit",
            "skillList",
            "source",
            "startDate",
            "status",
            "taxRate",
            "taxStatus",
            "title",
            "travelRequirements",
            "type",
            "willRelocate",
            "yearsRequired",
          ].join(","),
          query: "isDeleted: 0",
          start: offset,
          count,
          sort,
        });
        const url = `${this.restUrl}search/JobOrder?${query}`;
        const res = await axios.get(url, {
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            Accept: "*/*",
          },
        });
        console.log(url);

        const makeListArray = (val: string | undefined) => {
          if (!val) return [];
          return val?.toString().replace(", ", ",").split(",");
        };
        if (res.status === 200) {
          const { data } = res.data;
          total = res.data.total;
          const updatedData: Job[] = data.map((d: any) => {
            const {
              owner,
              isClientEditable,
              feeArrangement,
              externalID,
              clientContact,
              id,
              ...otherData
            } = d;

            return {
              ...otherData,
              skillList: makeListArray(d.skillList),
              certificationList: makeListArray(d.certificationList),
              degreeList: makeListArray(d.degreeList),
              isPublic: Boolean(d.isPublic),
              externalId: `bl-${d.id}`,
              country_id: d.address?.countryID?.toString() || null,
              address1: d.location?.address?.address1 || null,
              address2: d.location?.address?.address2 || null,
              city: d.location?.address?.city || null,
              state: d.location?.address?.state || null,
              zip: d.location?.address?.zip || null,
              clientContactID: d.clientContact?.id.toString(),
              clientCorporationID: d.clientCorporation?.id.toString(),
              interviews: d.interviews?.total || 0,
              ownerID: d.owner?.id?.toString(),
              dateAdded: d.dateAdded,
              dateClosed: d.dateClosed,
              dateEnd: d.date_end,
              dateLastExported: d.dateLastExported,
              dateLastModified: d.dateLastModified,
              dateLastPublished: d.dateLastPublished,
              datasource: "bullhorn",
            };
          });
          if (!testMode) {
            for (const job of updatedData) {
              console.log("\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
              const res = await saveJobs([job]);
              if (res === -1) {
                return;
              }
            }
          }
          if (total <= offset) break;
          offset += count;
          repeatErr = 0;
        } else if (res.status === 404) {
          break;
        } else {
          console.log(url);
          throw "error";
        }
      } catch (error: any) {
        console.log(error.message, "\nrepeatNumber =", repeatErr);
        await this.getNewAccessToken();
        repeatErr++;
      }
    }
  }

  async getClientContacts(
    testMode = false,
    count = 50,
    sort = "-dateAdded"
  ): Promise<any> {
    console.log("\n***** getClientContacts *****");
    let offset = 0;
    let total = 100000;
    let repeatErr = 0;

    while (repeatErr < 3) {
      console.log(`\nBullhorn_GET_CLIENTCONTACTS: ${total} / ${offset}`);
      try {
        const query = queryString.stringify({
          BhRestToken: this.BhRestToken,
          fields: [
            "id",
            "address",
            "category",
            "certifications",
            "clientCorporation",
            "comments",
            "dateAdded",
            "dateLastModified",
            "dateLastVisit",
            "description",
            "desiredCategories",
            "desiredSkills",
            "desiredSpecialties",
            "division",
            "email",
            "email2",
            "email3",
            "externalID",
            "fax",
            "fax2",
            "fax3",
            "firstName",
            "isAnonymized",
            "isDayLightSavings",
            "isDeleted",
            "lastName",
            "leads",
            "middleName",
            "mobile",
            "name",
            "namePrefix",
            "nameSuffix",
            "nickName",
            "numEmployees",
            "occupation",
            "office",
            "owner",
            "pager",
            "password",
            "phone",
            "phone2",
            "phone3",
            "preferredContact",
            "skills",
            "source",
          ].join(","),
          query:
            "isDeleted:0  AND NOT status:Archive NOT clientCorporation.status:Archive",
          start: offset,
          count,
          sort,
        });
        const url = `${this.restUrl}search/ClientContact?${query}`;
        const res = await axios.get(url, {
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            Accept: "*/*",
          },
        });
        if (res.status === 200) {
          const { data } = res.data;
          total = res.data.total;
          const updatedData = data.map((d: any) => ({
            ...d,
            id: `bl-${d.id}`,
            address_address1: d.address?.address1 || null,
            address_address2: d.address?.address2 || null,
            address_city: d.address?.city || null,
            address_state: d.address?.state || null,
            address_zip: d.address?.zip || null,
            address_country_id: d.address?.countryID || null,
            category: `${d.category?.id}-${d.category?.name}`,
            clientCorporation: `${d.clientCorporation?.id}`,
            leads: d.leads?.data.map((lead: any) => lead.id).join(" | "),
            owner: `${d.owner?.id}`,
            skills: d.skills?.data.map((skill: any) => skill.id).join(" | "),
          }));
          if (!testMode) {
            console.log("\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            const res = await saveClientContacts(updatedData);
            if (res === -1) return;
          }
          offset += count;
          repeatErr = 0;
          if (total <= offset) break;
        } else if (res.status === 404) {
          return [];
        } else {
          console.log(url);
          throw "error";
        }
      } catch (error: any) {
        console.log(error.message, "\nrepeatNumber =", repeatErr);
        await this.getNewAccessToken();
        repeatErr++;
      }
    }
  }

  async getCandidates(
    testMode = false,
    count = 150,
    sort = "-dateAdded"
  ): Promise<any> {
    console.log("\n***** getCandidates *****");
    let offset = 0;
    let total = 100000;
    let repeatErr = 0;

    while (repeatErr < 3) {
      console.log(`\nBullhorn_GET_CANDIDATES: ${total} / ${offset}`);
      try {
        const query = queryString.stringify({
          BhRestToken: this.BhRestToken,
          fields: [
            "id",
            "address",
            "certifications",
            "comments",
            "companyName",
            "companyURL",
            "customInt6",
            "dateAdded",
            "dateAvailable",
            "dateAvailableEnd",
            "dateI9Expiration",
            "dateLastComment",
            "dateLastModified",
            "dateNextCall",
            "dateOfBirth",
            "dayRate",
            "dayRateLow",
            "degreeList",
            "description",
            "desiredLocations",
            "disability",
            "educationDegree",
            "email",
            "email2",
            "email3",
            "employeeType",
            "employmentPreference",
            "ethnicity",
            "experience",
            "externalID",
            "fax",
            "fax2",
            "fax3",
            "firstName",
            "gender",
            "hourlyRate",
            "hourlyRateLow",
            "i9OnFile",
            "isAnonymized",
            "isDeleted",
            "isEditable",
            "isExempt",
            "lastName",
            "leads",
            "maritalStatus",
            "massMailOptOut",
            "middleName",
            "mobile",
            "name",
            "namePrefix",
            "nameSuffix",
            "nickName",
            "numCategories",
            "numOwners",
            "occupation",
            "otherDeductionsAmount",
            "otherIncomeAmount",
            "pager",
            "paperWorkOnFile",
            "password",
            "payrollClientStartDate",
            "payrollStatus",
            "phone",
            "phone2",
            "phone3",
            "preferredContact",
            "primarySkills",
            "recentClientList",
            "referredBy",
            "salary",
            "salaryLow",
            "secondarySkills",
            "skillSet",
            "smsOptIn",
            "source",
            "specialties",
            "ssn",
            "stateAddtionalWitholdingsAmount",
            "stateExemptions",
            "stateFilingStatus",
            "status",
            "taxID",
            "taxState",
            "timeZoneOffsetEST",
            "tobaccoUser",
            "totalDependentClaimAmount",
            "travelLimit",
            "travelMethod",
            "twoJobs",
            "type",
            "userDateAdded",
            "username",
            "veteran",
            "willRelocate",
            "workAuthorized",
          ].join(","),
          query: "isDeleted:0  AND NOT status:Archive",
          start: offset,
          count,
          sort,
        });
        const url = `${this.restUrl}search/Candidate?${query}`;
        const res = await axios.get(url, {
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            Accept: "*/*",
          },
        });
        if (res.status === 200) {
          const { data } = res.data;
          total = res.data.total;
          const updatedData = data.map((d: any) => ({
            ...d,
            id: `bl-${d.id}`,
            address_address1: d.address?.address1 || null,
            address_address2: d.address?.address2 || null,
            address_city: d.address?.city || null,
            address_state: d.address?.state || null,
            address_zip: d.address?.zip || null,
            address_country_id: d.address?.countryID || null,
            leads: d.leads?.data.map((lead: any) => lead.id).join(" | "),
            primarySkills: d.primarySkills?.data
              .map((skill: any) => skill.name)
              .join(" | "),
            secondarySkills: d.secondarySkills?.data
              .map((skill: any) => skill.name)
              .join(" | "),
            specialties: d.specialties?.data
              .map((specialty: any) => specialty.name)
              .join(" | "),
          }));
          if (!testMode) {
            console.log("\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            const res = await saveCandidates(updatedData);
            // if (res === -1) return;
          }
          offset += count;
          repeatErr = 0;
          if (total <= offset) break;
        } else if (res.status === 404) {
          return [];
        } else {
          console.log(url);
          throw "error";
        }
      } catch (error: any) {
        console.log(error.message, "\nrepeatNumber =", repeatErr);
        await this.getNewAccessToken();
        repeatErr++;
      }
    }
  }

  async getLeads(
    testMode = false,
    count = 150,
    sort = "-dateAdded"
  ): Promise<any> {
    console.log("\n***** getLeads *****");
    let offset = 0;
    let total = 100000;
    let repeatErr = 0;

    while (repeatErr < 3) {
      console.log(`\nBullhorn_GET_LEADS: ${total} / ${offset}`);
      try {
        const query = queryString.stringify({
          BhRestToken: this.BhRestToken,
          fields: [
            "id",
            "address",
            "campaignSource",
            "candidates",
            "category",
            "clientContacts",
            "clientCorporation",
            "comments",
            "companyName",
            "companyURL",
            "dateAdded",
            "dateLastComment",
            "dateLastModified",
            "description",
            "division",
            "email",
            "email2",
            "email3",
            "fax",
            "fax2",
            "fax3",
            "firstName",
            "isAnonymized",
            "isDeleted",
            "lastName",
            "leadSource",
            "massMailOptOut",
            "middleName",
            "mobile",
            "name",
            "namePrefix",
            "nameSuffix",
            "nickName",
            "notes",
            "numEmployees",
            "occupation",
            "owner",
            "pager",
            "phone",
            "phone2",
            "phone3",
            "preferredContact",
            "primarySkills",
            "priority",
            "referredByPerson",
            "reportToPerson",
            "role",
            "salary",
            "salaryLow",
            "secondarySkills",
            "skillSet",
            "smsOptIn",
            "specialties",
            "status",
            "timeZoneOffsetEST",
            "type",
            "willRelocate",
          ].join(","),
          query: "isDeleted:0  AND NOT status:Archive",
          start: offset,
          count,
          sort,
        });
        const url = `${this.restUrl}search/Lead?${query}`;
        console.log(url);
        const res = await axios.get(url, {
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            Accept: "*/*",
          },
        });
        if (res.status === 200) {
          const { data } = res.data;
          total = res.data.total;
          const updatedData = data.map((d: any) => ({
            ...d,
            id: `bl-${d.id}`,
            address_address1: d.address?.address1 || null,
            address_address2: d.address?.address2 || null,
            address_city: d.address?.city || null,
            address_state: d.address?.state || null,
            address_zip: d.address?.zip || null,
            address_country_id: d.address?.countryID || null,
            candidates: d.candidates?.data
              .map((candidate: any) => candidate.id)
              .join(" | "),
            clientContacts: d.clientContacts?.data
              .map((clientContact: any) => clientContact.id)
              .join(" | "),
            primarySkills: d.primarySkills?.data
              .map((skill: any) => skill.name)
              .join(" | "),
            secondarySkills: d.secondarySkills?.data
              .map((skill: any) => skill.name)
              .join(" | "),
            specialties: d.specialties?.data
              .map((specialty: any) => specialty.name)
              .join(" | "),
          }));
          if (!testMode) {
            console.log("\n\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
            const res = await saveLeads(updatedData);
            if (res === -1) return;
          }
          offset += count;
          repeatErr = 0;
          if (total <= offset) break;
        } else if (res.status === 404) {
          return [];
        } else {
          console.log(url);
          throw "error";
        }
      } catch (error: any) {
        console.log(error.message, "\nrepeatNumber =", repeatErr);
        await this.getNewAccessToken();
        repeatErr++;
      }
    }
  }

  async syncUserTppToBullhorn(user: User) {
    console.log("\n***** Adding user on bullhorn *****");
    try {
      const query = queryString.stringify({
        BhRestToken: this.BhRestToken,
        executeFormTriggers: false,
        highLevelCallStack: "/content/fast-add/Candidate",
      });
      const data = {
        description: null,
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
        name: `${user.firstname} ${user.lastname}`,
        owner: null,
        source: "Other",
        status: "New Lead",
        address: {
          countryID: 1,
          countryName: "United States",
        },
        employmentPreference: user.employmentPreference,
      };
      const url = `${this.restUrl}entity/Candidate?${query}`;
      console.log(url);
      const res = await axios.put(url, data, {
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          Accept: "*/*",
        },
      });
      return res.data;
    } catch (error: any) {
      console.log(error.message);
      return null;
    }
  }
}
