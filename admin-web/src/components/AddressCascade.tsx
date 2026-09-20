/**
 * Region -> Province -> City/Municipality -> Barangay picker, backed
 * by the full Philippine PSGC dataset (see address.service.ts).
 *
 * Shared by the Create Account and Edit Account forms so the two
 * never drift apart the way they did before this component existed -
 * Create had the full cascade, Edit only had a bare barangay field.
 *
 * The picker only stores/exchanges NAMES (not PSGC codes) with its
 * parent, since that is what the database stores. Internally it still
 * needs codes to ask for the next level's options, so when editing an
 * existing account it resolves `initial`'s names back to codes once,
 * top-down, stopping at the first level that does not match any
 * option (stale/dirty legacy data, e.g. a typo'd province name) -
 * whatever matched still gets pre-selected, the rest is just left
 * blank for the CAO to (re)pick.
 *
 * `onChange` fires ONLY for a change the CAO actually made - never
 * during that initial resolution - so a parent can use "did onChange
 * ever fire" as a safe, unambiguous "the address was touched" flag
 * instead of trying to diff values that went through name matching.
 */

import { useEffect, useRef, useState } from 'react';

import * as addressService from '../services/address.service';
import type { AddressOption } from '../services/address.service';

export interface AddressNames {
  region: string;
  province: string;
  municipality: string;
  barangay: string;
}

export const EMPTY_ADDRESS: AddressNames = {
  region: '',
  province: '',
  municipality: '',
  barangay: '',
};

function namesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function AddressCascade({
  initial,
  onChange,
}: {
  /** The account's current saved address - all empty strings for a brand-new account. */
  initial: AddressNames;
  /** Fires with the newly-picked address whenever the CAO changes a level - not during initial resolution. */
  onChange: (value: AddressNames) => void;
}) {
  const [regions, setRegions] = useState<AddressOption[]>([]);
  const [provinces, setProvinces] = useState<AddressOption[]>([]);
  const [cities, setCities] = useState<AddressOption[]>([]);
  const [barangayOptions, setBarangayOptions] = useState<string[]>([]);

  const [regionCode, setRegionCode] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [barangay, setBarangay] = useState('');

  const [isSeeded, setIsSeeded] = useState(false);
  const initialRef = useRef(initial);

  // Resolve `initial`'s names -> PSGC codes once, top-down. Runs once
  // regardless of later prop changes - `initial` is only a seed.
  useEffect(() => {
    let cancelled = false;

    async function seed() {
      const seedValue = initialRef.current;
      const regionList = await addressService.listRegions().catch(() => []);
      if (cancelled) return;
      setRegions(regionList);

      const regionMatch = seedValue.region
        ? regionList.find((r) => namesMatch(r.name, seedValue.region))
        : undefined;
      if (!regionMatch) {
        setIsSeeded(true);
        return;
      }
      setRegionCode(regionMatch.code);

      const provinceList = await addressService.listProvinces(regionMatch.code).catch(() => []);
      if (cancelled) return;
      setProvinces(provinceList);

      const provinceMatch = seedValue.province
        ? provinceList.find((p) => namesMatch(p.name, seedValue.province))
        : undefined;
      if (!provinceMatch) {
        setIsSeeded(true);
        return;
      }
      setProvinceCode(provinceMatch.code);

      const cityList = await addressService.listCities(provinceMatch.code).catch(() => []);
      if (cancelled) return;
      setCities(cityList);

      const cityMatch = seedValue.municipality
        ? cityList.find((c) => namesMatch(c.name, seedValue.municipality))
        : undefined;
      if (!cityMatch) {
        setIsSeeded(true);
        return;
      }
      setCityCode(cityMatch.code);

      const brgyList = await addressService.listBarangaysForCity(cityMatch.code).catch(() => []);
      if (cancelled) return;
      setBarangayOptions(brgyList);

      const barangayMatch = seedValue.barangay
        ? brgyList.find((b) => namesMatch(b, seedValue.barangay))
        : undefined;
      if (barangayMatch) setBarangay(barangayMatch);

      setIsSeeded(true);
    }

    void seed();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reactive re-fetches for levels the CAO changes by hand, once the
  // initial seed has settled (avoids a duplicate fetch racing the seed).
  useEffect(() => {
    if (!isSeeded || !regionCode) return;
    addressService
      .listProvinces(regionCode)
      .then(setProvinces)
      .catch(() => setProvinces([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeeded, regionCode]);

  useEffect(() => {
    if (!isSeeded || !provinceCode) return;
    addressService
      .listCities(provinceCode)
      .then(setCities)
      .catch(() => setCities([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeeded, provinceCode]);

  useEffect(() => {
    if (!isSeeded || !cityCode) return;
    addressService
      .listBarangaysForCity(cityCode)
      .then(setBarangayOptions)
      .catch(() => setBarangayOptions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeeded, cityCode]);

  function pick(next: {
    regionCode?: string;
    provinceCode?: string;
    cityCode?: string;
    barangay?: string;
  }) {
    const nextRegionCode = next.regionCode ?? regionCode;
    const nextProvinceCode = next.provinceCode ?? provinceCode;
    const nextCityCode = next.cityCode ?? cityCode;
    const nextBarangay = next.barangay ?? barangay;

    onChange({
      region: regions.find((r) => r.code === nextRegionCode)?.name ?? '',
      province: provinces.find((p) => p.code === nextProvinceCode)?.name ?? '',
      municipality: cities.find((c) => c.code === nextCityCode)?.name ?? '',
      barangay: nextBarangay,
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <SelectField
        label="Region"
        value={regionCode}
        onChange={(v) => {
          setRegionCode(v);
          setProvinceCode('');
          setCityCode('');
          setBarangay('');
          setProvinces([]);
          setCities([]);
          setBarangayOptions([]);
          pick({ regionCode: v, provinceCode: '', cityCode: '', barangay: '' });
        }}
        options={regions.map((r) => ({ value: r.code, label: r.name }))}
        placeholder="Select region"
      />
      <SelectField
        label="Province"
        value={provinceCode}
        onChange={(v) => {
          setProvinceCode(v);
          setCityCode('');
          setBarangay('');
          setCities([]);
          setBarangayOptions([]);
          pick({ provinceCode: v, cityCode: '', barangay: '' });
        }}
        options={provinces.map((p) => ({ value: p.code, label: p.name }))}
        placeholder="Select province"
        disabled={!regionCode}
      />
      <SelectField
        label="City / Municipality"
        value={cityCode}
        onChange={(v) => {
          setCityCode(v);
          setBarangay('');
          setBarangayOptions([]);
          pick({ cityCode: v, barangay: '' });
        }}
        options={cities.map((c) => ({ value: c.code, label: c.name }))}
        placeholder="Select city / municipality"
        disabled={!provinceCode}
      />
      <SelectField
        label="Barangay"
        value={barangay}
        onChange={(v) => {
          setBarangay(v);
          pick({ barangay: v });
        }}
        options={barangayOptions.map((b) => ({ value: b, label: b }))}
        placeholder="Select barangay"
        disabled={!cityCode}
      />
    </div>
  );
}

/** A `<select>` with a leading placeholder option. */
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-leaf-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
