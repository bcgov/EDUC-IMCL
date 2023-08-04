import ApiService from '../common/apiService';
import { type AxiosResponse } from 'axios';

export default {
  getDistricts(): Promise<AxiosResponse> {
    return ApiService.apiAxios.get('/api/v1/institute/district');
  },
  getDistrict(districtId: string): Promise<AxiosResponse> {
    return ApiService.apiAxios.get('/api/v1/institute/district/'+districtId);
  },  
  getSchoolList(): Promise<AxiosResponse> {
    return ApiService.apiAxios.get('/api/v1/institute/school/list');
  },
  getSchool(schoolId: string): Promise<AxiosResponse> {
    return ApiService.apiAxios.get('/api/v1/institute/school/'+schoolId);
  },
  searchSchools(req: any): Promise<AxiosResponse> {
    return ApiService.apiAxios.get('/api/v1/institute/school/paginated?pageSize=3000&searchCriteriaList=' + req.searchCriteriaList);
  },
  getFacilityCodes(): Promise<AxiosResponse> {
    return ApiService.apiAxios.get('/api/v1/institute/facility-codes');
  },
  
}