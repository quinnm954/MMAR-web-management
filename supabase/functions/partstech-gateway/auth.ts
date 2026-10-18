export type PartsTechCredentials = {
  userId?: string;
  userKey?: string;
  partnerId?: string;
  partnerKey?: string;
};

export class PartsTechSetupError extends Error {
  readonly status = 503;
}

// Punchout requires UserCredentials: separate shop and software-partner identities.
export function buildPartsTechAuth(credentials: PartsTechCredentials) {
  const { userId, userKey, partnerId, partnerKey } = credentials;
  if (!userId || !userKey) {
    throw new PartsTechSetupError('PartsTech shop credentials are not configured.');
  }
  if (!partnerId || !partnerKey) {
    throw new PartsTechSetupError(
      'Your PartsTech shop credentials are saved. Garage Ace still needs its own PartsTech-issued partner ID and partner key before the integration can connect.',
    );
  }
  return {
    accessType: 'user' as const,
    credentials: {
      user: { id: userId, key: userKey },
      partner: { id: partnerId, key: partnerKey },
    },
  };
}