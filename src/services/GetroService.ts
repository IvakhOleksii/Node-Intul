import axios from 'axios';
import config from "../config";
import queryString from 'query-string';
import { getCompanies, saveCompanies, saveJobs, saveMembers } from '../utils/GetroCrud';

export class GetroService {
    public static client: GetroService | null = null;
    private email = config.getroEmail || '';
    private password = config.getroPassword || '';
    private api_base_url_v1 = 'https://api.getro.com/api/v1';
    private api_base_url_v2 = 'https://api.getro.com/v2';
    private networkId = null;

    public static async getClient() {
        if (GetroService.client === null) {
            GetroService.client = new GetroService();
            await GetroService.client.getNetworkID();
        }
        return GetroService.client;
    }

    getOptions() {
        return {
            headers: {
                'X-User-Email': this.email,
                'X-User-Token': this.password,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
    };

    async checkAuth(): Promise<boolean> {
        if (this.networkId) return true;
        const authRes = await this.getNetworkID();
        if (authRes) return true;
        throw 'Auth failed';
    }
    async getNetworkID(): Promise<boolean> {
        console.log('\n***** getNetworkID *****');
        const url = `${this.api_base_url_v2}/networks`;
        const res = await axios.get(url, this.getOptions());
        if (res.status === 200) {
            const {items} = res.data;
            if (items.length > 0) {
                this.networkId = items[0].id;
            } else {
                return false;
            }
            console.log('Network ID: ', this.networkId);
            return true;
        }
        return false;
    };
    
    async getCompanies(testMode = false, per_page=30): Promise<any> {
        console.log('\n***** getCompanies *****');
        let page = 1;
        let repeatErr = 0;

        while (repeatErr < 5) {
            try {
                await this.checkAuth();
                const query = queryString.stringify({
                    per_page,
                    page,
                    detailed: true
                });
                const url = `${this.api_base_url_v1}/collections/${this.networkId}/organizations?${query}`;
                const res = await axios.get(url, this.getOptions());
                if (res.status === 200) {
                    const result = [];
                    const { items, meta: { total: total } } = res.data;
                    if (!testMode) {
                        for (const company of items) {
                            const detail = await this.getCompanyDetail(company.slug);
                            if (detail) {
                                result.push(detail);
                            }
                        }
                        await saveCompanies(result);
                    }
                    console.log(`${total} / ${(page-1)*per_page+items.length}`);
                    page++;
                    repeatErr = 0;
                    if (items.length < per_page) break;
                }
            } catch(error) {
                repeatErr++;
            }
        }
    }
    
    async getCompanyDetail(slug: string): Promise<any> {
        console.log(`\n***** getCompanyDetail (${slug}) *****`);
        const query = queryString.stringify({
            collection_id: this.networkId,
            detailed: true
        });
        const url = `${this.api_base_url_v1}/organizations/${slug}?${query}`;
        const res = await axios.get(url, this.getOptions());
        if (res.status === 200) {
            const data = res.data;
            return {
                ...data,
                id: `gt-${data.id}`,
                collections: data.collections?.map((col: any) => col.id).join(',') || null,
                locations: data.locations?.map((loc: any) => loc.name).join(',') || null,
                network_id: this.networkId,
            };
        }
        return null;
    }
    
    /**
     * getMemebers
     */
    async getMembers(testMode = false, per_page=30): Promise<any> {
        console.log('\n***** getMembers *****');
        let page = 1;
        let repeatErr = 0;

        while (repeatErr < 5) {
            try {
                await this.checkAuth();
                const query = queryString.stringify({
                    per_page,
                    page,
                    collection_id: this.networkId,
                    'roles[]': 'none'
                });
                const url = `${this.api_base_url_v1}/members?${query}`;
                const res = await axios.get(url, this.getOptions());
                if (res.status === 200) {
                    const result = [];
                    const { items, meta: { total } } = res.data;
                    if (!testMode) {
                        for (const company of items) {
                            const detail = await this.getMemberDetail(company.id);
                            if (detail) {
                                result.push(detail);
                            }
                        }
                        await saveMembers(result);
                    }
                    console.log(`${total} / ${(page-1)*per_page+items.length}`);
                    page++;
                    repeatErr = 0;
                    if (items.length < per_page) break;
                }
            } catch(error) {
                repeatErr++;
            }
        }
    }
    
    async getMemberDetail(id: string): Promise<any> {
        console.log(`\n***** getMemberDetail (${id}) *****`);
        const query = queryString.stringify({
            collection_id: this.networkId,
        });
        const url = `${this.api_base_url_v1}/members/${id}?${query}`;
        const res = await axios.get(url, this.getOptions());
        if (res.status === 200) {
            const data = res.data;
            return {
                ...data,
                id: `gt-${data.id}`,
                talent_groups: data.talent_groups?.map((talent: any) => talent.id).join(',') || null,
                skills: data.skills?.map((skill: any) => skill.name).join(',') || null,
                locations: data.locations?.map((location: any) => location.name).join(',') || null,
                employment_types: data.employment_types?.map((employment_type: string) => employment_type).join(',') || null,
                current_location: data.current_location?.name || null,
                network_id: this.networkId,
            };
        }
        return null;
    }

    async getJobs(testMode = false, per_page=30): Promise<any> {
        console.log(`\n***** getJobs *****`);
        const companies: any[] = await getCompanies();
        if (companies.length === 0) {
            return {
                error: 'no company on db'
            };
        }
        try {
            await this.checkAuth();
            for (const company of companies[0]) {
                console.log(`\n***** fetching jobs for company ${company.id} *****`);
                const company_id = company.id.slice(3);
                let page = 1;
                let repeatErr = 0;
                while (repeatErr < 5) {
                    const query = queryString.stringify({
                        per_page,
                        page,
                        collection_id: this.networkId,
                        'organization_ids[]': company_id,
                        'status[]': 'active'
                    });
                    const url = `${this.api_base_url_v1}/jobs?${query}`;
                    try {
                        const res = await axios.get(url, this.getOptions());
                        const { items, meta: { total } } = res.data;
                        if (!testMode) {
                            const newItems  =items.map((item:any) => ({
                                ...item,
                                id: `gt-${item.id}`,
                                job_functions: item.job_functions?.map((jf: any) => jf.name).join(','),
                                locations: item.locations?.map((loc: any) => loc.name).join(','),
                                organization_doman: item.organization?.domain,
                                organization_id: item.organization?.id,
                                organization_logo_url: item.organization?.logo_url,
                                organization_name: item.organization?.name,
                                organization_slug: item.organization?.slug,
                            }))
                            for (const job of newItems) {
                                await saveJobs([job]);
                            }
                        }
                        console.log(page);
                        if (per_page === items.length) {
                            console.log(`${total} / ${(page-1)*per_page+items.length}`);
                            page++;
                            repeatErr = -0;
                        } else {
                            break;
                        }
                    } catch (error) {
                        console.log(url);
                        repeatErr++;
                    }
                }
            }
        } catch(error) {
            console.log(error);
        }
    }
}