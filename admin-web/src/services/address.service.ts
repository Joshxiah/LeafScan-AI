/**
 * Region / Province / City-Municipality / Barangay lookups for the
 * Create Account form's cascading address picker.
 */

import { api } from './api';

export interface AddressOption {
  code: string;
  name: string;
}

/** GET /api/address/regions */
export async function listRegions(): Promise<AddressOption[]> {
  const result = await api.get<{ regions: AddressOption[] }>('/address/regions');
  return result.regions;
}

/** GET /api/address/provinces?region= */
export async function listProvinces(regionCode: string): Promise<AddressOption[]> {
  const result = await api.get<{ provinces: AddressOption[] }>(
    `/address/provinces?region=${encodeURIComponent(regionCode)}`
  );
  return result.provinces;
}

/** GET /api/address/cities?province= */
export async function listCities(provinceCode: string): Promise<AddressOption[]> {
  const result = await api.get<{ cities: AddressOption[] }>(
    `/address/cities?province=${encodeURIComponent(provinceCode)}`
  );
  return result.cities;
}

/** GET /api/address/barangays?city= */
export async function listBarangaysForCity(cityCode: string): Promise<string[]> {
  const result = await api.get<{ barangays: string[] }>(
    `/address/barangays?city=${encodeURIComponent(cityCode)}`
  );
  return result.barangays;
}
