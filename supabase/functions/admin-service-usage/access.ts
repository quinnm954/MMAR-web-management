export function canReadServiceUsage(roles: readonly string[]): boolean {
  return roles.some(role => role === 'admin' || role === 'owner');
}