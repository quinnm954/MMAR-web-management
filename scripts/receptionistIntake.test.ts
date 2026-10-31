import { expect, test } from 'bun:test';
import { missingReceptionistDetails } from '../supabase/functions/_shared/receptionist-intake';
const details = { customer_name: 'Alex Rivera', service_address: '123 Palm Lane, Lehigh Acres FL 33971', vehicle_info: '2017 Hyundai Elantra' };
test('new prospects need an actual name', () => {
  expect(missingReceptionistDetails({ ...details, customer_name: 'Lehigh Acres' })).toEqual(['name']);
});
test('new prospects need a street address rather than just a city and ZIP', () => {
  expect(missingReceptionistDetails({ ...details, service_address: 'Lehigh Acres FL 33971' })).toEqual(['service street address']);
});
test('new prospects need vehicle year make and model', () => {
  expect(missingReceptionistDetails({ ...details, vehicle_info: 'Hyundai' })).toEqual(['vehicle year, make and model']);
});
test('complete contact and vehicle information does not require a known engine size', () => {
  expect(missingReceptionistDetails(details)).toEqual([]);
});