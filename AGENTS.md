
- Fleet prospecting: edge function `prospecting` (search/enrich/pitch, admin-only) + hourly `prospect-email-worker` sending via the `fleet-outreach` transactional template; no automated calls/texts (TCPA).

- Fleet registration: /fleet/register signs up via auth then calls anon-executable `submit_fleet_registration` RPC, guarded by user id+email match within 15 min of account creation.
