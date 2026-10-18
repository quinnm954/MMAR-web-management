import { describe, expect, test } from 'bun:test';
import { buildPartsTechAuth, PartsTechSetupError } from '../supabase/functions/partstech-gateway/auth';

// Deliberately synthetic fixtures, never loaded from the secret store.
const fixture = {
  userId: 'fixture-shop', userKey: 'fixture-shop-key',
  partnerId: 'fixture-software', partnerKey: 'fixture-software-key',
};

describe('PartsTech documented punchout authentication', () => {
  test('requests user access with separate shop and partner credentials', () => {
    expect(buildPartsTechAuth(fixture)).toEqual({
      accessType: 'user',
      credentials: {
        user: { id: 'fixture-shop', key: 'fixture-shop-key' },
        partner: { id: 'fixture-software', key: 'fixture-software-key' },
      },
    });
  });
  test('never treats shop credentials as partner credentials', () => {
    expect(() => buildPartsTechAuth({ userId: fixture.userId, userKey: fixture.userKey })).toThrow(PartsTechSetupError);
  });
  test('never substitutes the shop key for a missing partner key', () => {
    expect(() => buildPartsTechAuth({ ...fixture, partnerKey: undefined })).toThrow(PartsTechSetupError);
  });
  test('requires shop credentials even when partner credentials exist', () => {
    expect(() => buildPartsTechAuth({ partnerId: fixture.partnerId, partnerKey: fixture.partnerKey })).toThrow(PartsTechSetupError);
  });
});