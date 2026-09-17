/**
 * Minimal ambient type for the `phil-reg-prov-mun-brgy` package - it
 * ships no types of its own. Only the shape actually used
 * (see services/address.service.ts) is declared.
 */
declare module 'phil-reg-prov-mun-brgy' {
  export interface PhilRegion {
    name: string;
    reg_code: string;
  }

  export interface PhilProvince {
    name: string;
    reg_code: string;
    prov_code: string;
  }

  export interface PhilCityMun {
    name: string;
    prov_code: string;
    mun_code: string;
  }

  export interface PhilBarangay {
    name: string;
    mun_code: string;
  }

  const phil: {
    regions: PhilRegion[];
    provinces: PhilProvince[];
    city_mun: PhilCityMun[];
    barangays: PhilBarangay[];
    getProvincesByRegion(regionCode: string): PhilProvince[];
    getCityMunByProvince(provinceCode: string): PhilCityMun[];
    getBarangayByMun(municipalityCode: string): PhilBarangay[];
  };

  export default phil;
}
