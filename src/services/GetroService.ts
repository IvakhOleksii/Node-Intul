import axios from 'axios';
import config from "../config";
import queryString from 'query-string';
import { saveCompanies, saveMembers } from './GetroCrud';

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
    
    async getCompanies(page=1, per_page=30): Promise<any> {
        console.log('\n***** getCompanies *****');
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
                const { items, meta: { total } } = res.data;
                for (const company of items) {
                    const detail = await this.getCompanyDetail(company.slug);
                    if (detail) {
                        result.push(detail);
                    }
                }
                await saveCompanies(result);
                return {
                    items: result,
                    hasMore: items.length === total
                };
            }
            return { error: 'not found' };
        } catch(error) {
            return {error};
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
    async getMembers(page=1, per_page=30): Promise<any> {
        console.log('\n***** getMembers *****');
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
                for (const company of items) {
                    const detail = await this.getMemberDetail(company.id);
                    if (detail) {
                        result.push(detail);
                    }
                }
                await saveMembers(result);
                return {
                    items: result,
                    hasMore: items.length === total
                };
            }
            return { error: 'not found' };
        } catch(error) {
            return {error};
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
}