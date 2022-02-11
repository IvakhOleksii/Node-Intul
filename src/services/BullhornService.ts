import axios from "axios";
import config from "../config";
import queryString from 'query-string';
import { saveClientContacts, saveCompanies, saveJobs } from "./BullhornCrud";
import fs from 'fs';

export class BullhornService {
    public static client: BullhornService | null = null;
    private auth_code = null;
    private access_token = null;
    private refresh_token = null;
    private BhRestToken = null;
    private restUrl = null;
    private corpToken = null;
    private oauth_url = 'https://auth.bullhornstaffing.com/oauth';
    private api_base_url = 'https://rest.bullhornstaffing.com/rest-services';

    public static async getClient() {
        if (BullhornService.client === null) {
            BullhornService.client = new BullhornService();
            await BullhornService.client.init(false);
        }
        return BullhornService.client;
    }

    async init(invalid=true): Promise<boolean> {
        if (!invalid) {
            const cookie: any = await this.getCookie();
            if (cookie !== null) {
                const { auth_code, access_token, refresh_token, BhRestToken, restUrl } = cookie;
                this.auth_code = auth_code;
                this.access_token = access_token;
                this.refresh_token = refresh_token;
                this.BhRestToken = BhRestToken;
                this.restUrl = restUrl;
                if (this.auth_code && this.access_token && this.refresh_token && this.BhRestToken && this.restUrl)
                    return true;
            }
        }
        if (await this.getAuthCode()) {
            if (await this.getAccessToken())
                return await this.login();
        }
        return false;
    }

    async getCookie() {
		const targetFile = __dirname + '/../config/cookie.json';
		return new Promise((resolve) => {
			fs.readFile(targetFile, async function(err, data) {
				if(err) {
					return resolve(null);
				}				
				let cookies = JSON.parse(data.toString());
                return resolve(cookies);
			});
		});
    }

    async setCookie(data: any) {
		const targetFile = __dirname + '/../config/cookie.json';
		return new Promise((resolve, reject) => {
		  // Try saving the file.        
		  fs.writeFile(targetFile, JSON.stringify(data),  {flag: 'w+'}, (err) => {
			if(err)
			  reject(err);
			else {
			  resolve(targetFile);
			}
		  });		  
		});
	}

    async getAuthCode(): Promise<boolean> {
        console.log('\n***** getAuthCode *****');
        const query = queryString.stringify({
            client_id: config.bullhornClientID,
            response_type: 'code',
            action: 'Login',
            username: config.bullhornApiUsername,
            password: config.bullhornApiPassword
        }, {encode: false});
        const url = `${this.oauth_url}/authorize?${query}`;
        const res = await axios.get(url);
        if (res.status === 200) {
            const path = res.request.path;
            this.auth_code = path.slice(7, path.indexOf('&client')).replace('%25', '%');
            console.log('Auth Code: ', this.auth_code);
            return true;
        }
        return false;
    };

    async getAccessToken(): Promise<boolean> {
        console.log('\n***** getAccessToken *****');
        const query = queryString.stringify({
            grant_type: 'authorization_code',
            client_id: config.bullhornClientID,
            client_secret: config.bullhornClientSecret,
            code: this.auth_code
        }, {encode: false});
        const url = `${this.oauth_url}/token?${query}`;
        console.log(url);
        const res = await axios.post(url);
        if (res.status === 200) {
            const {access_token, refresh_token} = res.data;
            this.access_token = access_token;
            this.refresh_token = refresh_token;
            console.log('Access Token: ', this.access_token);
            console.log('Refresh Token: ', this.refresh_token);
            return true;
        } else if (res.status === 400) {
            if (await this.getNewAccessToken())
                return await this.login();
        }
        return false;
    };

    async getNewAccessToken(): Promise<boolean> {
        console.log('\n***** getNewAccessToken *****');
        try {
            const query = queryString.stringify({
                grant_type: 'refresh_token',
                client_id: config.bullhornClientID,
                client_secret: config.bullhornClientSecret,
                refresh_token: this.refresh_token
            }, {encode: false});
            const url = `${this.oauth_url}/token?${query}`;
            const res = await axios.post(url);
            console.log(res.status)
            if (res.status === 200) {
                const {access_token, refresh_token} = res.data;
                this.access_token = access_token;
                this.refresh_token = refresh_token;
                return true;
            }
            return await this.init();
        } catch (error) {
            console.log(error);
            return await this.init();
        }
        return false;
    }

    async login(): Promise<boolean> {
        console.log('\n***** login *****');
        const query = queryString.stringify({
            version: '*',
            access_token: this.access_token,

        }, {encode: false})
        const url = `${this.api_base_url}/login?${query}`
        const res = await axios.post(url);
        if (res.status === 200) {
            const {BhRestToken, restUrl} = res.data;
            this.BhRestToken = BhRestToken;
            this.restUrl = restUrl;
            this.corpToken = restUrl.split('/')[4];
            console.log('BhRestToken: ', this.BhRestToken);
            console.log('restUrl: ', this.restUrl);
            console.log('corpToken: ', this.corpToken);

            await this.setCookie({
                auth_code: this.auth_code,
                access_token: this.access_token,
                refresh_token: this.refresh_token,
                BhRestToken: this.BhRestToken,
                restUrl: this.restUrl,
            });
            return true;
        }
        else if (res.status === 400) {
            if (await this.getNewAccessToken())
                return await this.login();
        }
        return false;
    }

    async getCompanies(start=0, count=50, sort='id'): Promise<any> {
        console.log('\n***** getAllCompanies *****');
        try {
            const query = queryString.stringify({
                BhRestToken: this.BhRestToken,
                fields: [
                    'id',
                    'address',
                    'annualRevenue',
                    'billingAddress',
                    'billingContact',
                    'billingFrequency',
                    'billingPhone',
                    'businessSectorList',
                    'companyDescription',
                    'companyURL',
                    'competitors',
                    'culture',
                    'dateAdded',
                    'dateFounded',
                    'dateLastModified',
                    'externalID',
                    'feeArrangement',
                    'funding',
                    'industryList',
                    'name',
                    'notes',
                    'numEmployees',
                    'numOffices',
                    'phone',
                    'revenue',
                    'status',
                    'taxRate',
                    'tickerSymbol',
                    'workWeekStart',  
                ].join(','),
                query: 'id:[* TO *]  AND NOT status:Archive',
                start,
                count,
                sort
            });
            const url = `${this.restUrl}search/ClientCorporation?${query}`;
            console.log(`url: ${url}`);
            const res = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Accept': '*/*'
                }
            });
            if (res.status === 200) {
                const {total, data} = res.data;
                const updatedData = data.map((d: any) => ({
                    ...d,
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
                await saveCompanies(updatedData);
                return {
                    total,
                    data: updatedData
                };
            } else if (res.status === 404) {
                return [];
            } else {
                throw "error";
            }
        } catch (error) {
            await this.getNewAccessToken();
            return await this.getCompanies(start, count, sort);
        }
        return [];
    }
    async getJobs(start=0, count=50, sort='id'): Promise<any> {
        console.log('\n***** getJobs *****');
        try {
            const query = queryString.stringify({
                BhRestToken: this.BhRestToken,
                fields: [
                    'id',
                    'address',
                    'benefits',
                    'billRateCategoryID',
                    'bonusPackage',
                    'certificationList',
                    'clientBillRate',
                    'clientContact',
                    'clientCorporation',
                    // 'dateAdded',
                    // 'dateClosed',
                    // 'dateEnd',
                    // 'dateLastExported',
                    // 'dateLastModified',
                    // 'dateLastPublished',
                    'degreeList',
                    'description',
                    'durationWeeks',
                    'educationDegree',
                    'employmentType',
                    'externalID',
                    'feeArrangement',
                    'hoursOfOperation',
                    'hoursPerWeek',
                    'interviews',
                    'isClientEditable',
                    'isDeleted',
                    'isInterviewRequired',
                    'isJobcastPublished',
                    'isOpen',
                    'isPublic',
                    'location',
                    'markUpPercentage',
                    'numOpenings',
                    'onSite',
                    'owner',
                    'payRate',
                    'publicDescription',
                    'publishedZip',
                    'reasonClosed',
                    'reportTo',
                    'reportToClientContact',
                    'salary',
                    'salaryUnit',
                    'skillList',
                    'source',
                    'startDate',
                    'status',
                    'taxRate',
                    'taxStatus',
                    'title',
                    'travelRequirements',
                    'type',
                    'willRelocate',
                    'yearsRequired',
                ].join(','),
                query: 'isDeleted: 0 AND NOT status:Archive',
                start,
                count,
                sort
            });
            const url = `${this.restUrl}search/JobOrder?${query}`;
            console.log(`url: ${url}`);
            const res = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Accept': '*/*'
                }
            });
            if (res.status === 200) {
                const {total, data} = res.data;
                const updatedData = data.map((d: any) => ({
                    ...d,
                    address_address1: d.address?.address1 || null,
                    address_address2: d.address?.address2 || null,
                    address_city: d.address?.city || null,
                    address_state: d.address?.state || null,
                    address_zip: d.address?.zip || null,
                    address_country_id: d.address?.countryID || null,
                    location_address1: d.location?.address?.address1 || null,
                    location_address2: d.location?.address?.address2 || null,
                    location_city: d.location?.address?.city || null,
                    location_state: d.location?.address?.state || null,
                    location_state_id: d.location?.address?.stateID || null,
                    location_state_name: d.location?.address?.stateName || null,
                    location_zip: d.location?.address?.zip || null,
                    location_country_id: d.location?.address?.countryID || null,
                    location_country_name: d.location?.address?.countryName || null,
                    location_country_code: d.location?.address?.countryCode || null,
                    clientContact: d.clientContat?.id,
                    // clientCorporationID: d.clientCorporation?.id,
                    interviews: d.interviews?.total || 0,
                    owner: d.owner?.id,
                    date_added: d.dateAdded,
                    date_closed: d.dateClosed,
                    date_end: d.date_end,
                    date_last_exported: d.dateLastExported,
                    date_last_modified: d.dateLastModified,
                    date_last_published: d.dateLastPublished,
                }));
                await saveJobs(updatedData);
                return {
                    total,
                    data
                };
            } else if (res.status === 404) {
                return [];
            } else {
                throw "error";
            }
         } catch (error) {
            await this.getNewAccessToken();
            return await this.getJobs(start, count, sort);
        }
    }


    async getClientContacts(start=0, count=50, sort='-dateAdded'): Promise<any> {
        console.log('\n***** getClientContacts *****');
        try {
            const query = queryString.stringify({
                BhRestToken: this.BhRestToken,
                fields: [
                    'id',
                    'address',
                    'category',
                    'certifications',
                    'clientCorporation',
                    'comments',
                    'dateAdded',
                    'dateLastModified',
                    'dateLastVisit',
                    'description',
                    'desiredCategories',
                    'desiredSkills',
                    'desiredSpecialties',
                    'division',
                    'email',
                    'email2',
                    'email3',
                    'externalID',
                    'fax',
                    'fax2',
                    'fax3',
                    'firstName',
                    'isAnonymized',
                    'isDayLightSavings',
                    'isDeleted',
                    'lastName',
                    'leads',
                    'middleName',
                    'mobile',
                    'name',
                    'namePrefix',
                    'nameSuffix',
                    'nickName',
                    'numEmployees',
                    'occupation',
                    'office',
                    'owner',
                    'pager',
                    'password',
                    'phone',
                    'phone2',
                    'phone3',
                    'preferredContact',
                    'skills',
                    'source',
                ].join(','),
                query: 'isDeleted:0  AND NOT status:Archive NOT clientCorporation.status:Archive',
                start,
                count,
                sort
            });
            const url = `${this.restUrl}search/ClientContact?${query}`;
            console.log(`url: ${url}`);
            const res = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Accept': '*/*'
                }
            });
            if (res.status === 200) {
                const {total, data} = res.data;
                const updatedData = data.map((d: any) => ({
                    ...d,
                    address_address1: d.address?.address1 || null,
                    address_address2: d.address?.address2 || null,
                    address_city: d.address?.city || null,
                    address_state: d.address?.state || null,
                    address_zip: d.address?.zip || null,
                    address_country_id: d.address?.countryID || null,
                    category: `${d.category?.id}-${d.category?.name}`,
                    clientCorporation: `${d.clientCorporation?.id}`,
                    leads: d.leads?.data.map((lead: any) => lead.id).join(', '),
                    owner: `${d.owner?.id}`,
                    skills: d.skills?.data.map((skill: any) => skill.id).join(', ')
                }));
                await saveClientContacts(updatedData);
                return {
                    total,
                    data
                };
            } else if (res.status === 404) {
                return [];
            } else {
                throw "error";
            }
         } catch (error) {
            await this.getNewAccessToken();
            return await this.getClientContacts(start, count, sort);
        }
        return [];
    }
}