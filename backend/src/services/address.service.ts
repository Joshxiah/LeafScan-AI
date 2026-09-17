/**
 * Full Philippine address lookups (Region / Province / City-
 * Municipality / Barangay) for the CAO's Create Account form.
 *
 * Backed by the `phil-reg-prov-mun-brgy` package - a bundled, static
 * PSGC-derived dataset with no runtime dependencies. It only reads
 * local JSON, so it lives on the backend (a browser bundle can't do
 * the file reads it uses under the hood); the frontend just calls
 * these as plain list endpoints, same pattern as the barangay lists
 * in farmer.service.ts.
 */

import phil from 'phil-reg-prov-mun-brgy';

export interface AddressOption {
  code: string;
  name: string;
}

const CONNECTOR_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'of']);

/** "ZAMBOANGA DEL SUR" -> "Zamboanga del Sur"; "PAGADIAN CITY (Capital)" -> "Pagadian City (Capital)". */
function titleCase(raw: string): string {
  return raw
    .toLowerCase()
    .split(' ')
    .map((word, index) =>
      index > 0 && CONNECTOR_WORDS.has(word)
        ? word
        : word.replace(/(^|['-]|\()([a-z])/g, (_match, sep, ch) => sep + ch.toUpperCase())
    )
    .join(' ');
}

/** All 17 regions. */
export function listRegions(): AddressOption[] {
  return [...phil.regions]
    .map((region) => ({ code: region.reg_code, name: region.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Provinces within a region. Empty array for an unknown region code. */
export function listProvinces(regionCode: string): AddressOption[] {
  return phil
    .getProvincesByRegion(regionCode)
    .map((province) => ({ code: province.prov_code, name: titleCase(province.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Cities/municipalities within a province. Empty array for an unknown province code. */
export function listCities(provinceCode: string): AddressOption[] {
  return phil
    .getCityMunByProvince(provinceCode)
    .map((city) => ({ code: city.mun_code, name: titleCase(city.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Barangays within a city/municipality. Empty array for an unknown city code. */
export function listBarangaysForCity(municipalityCode: string): string[] {
  return phil
    .getBarangayByMun(municipalityCode)
    .map((barangay) => barangay.name)
    .sort((a, b) => a.localeCompare(b));
}
