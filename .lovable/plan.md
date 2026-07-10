## Problem

The most recent estimate (`EST-20260710-E483`) is still `sent` with no `estimate_decision_logs` entry, meaning the customer's submission never reached the database.

Root cause: there are **two overloaded versions** of `public.submit_estimate_decision` in the database:

1. Old 5-arg signature: `(_token, _line_items, _status, _signature, _decline_reason)`
2. Current 7-arg signature: `(_token, _line_items, _status, _signature, _decline_reason, _requested_date, _requested_time_window)`

The frontend (`EstimateApproval.tsx`) calls the RPC with all 7 arguments. When PostgREST sees an overloaded function it can't unambiguously resolve, it returns `PGRST203` ("Could not choose the best candidate function") and the request fails. The client toasts "Could not submit. Please contact us." with no other logging, which matches the customer's experience.

## Fix

Single migration that drops the stale 5-arg overload, leaving only the current 7-arg version:

```sql
DROP FUNCTION IF EXISTS public.submit_estimate_decision(
  text, jsonb, text, text, text
);
```

The 7-arg version already has `_requested_date` and `_requested_time_window` defaulting to `NULL`, so any legacy caller (there shouldn't be any) still works.

## Verification

1. Confirm only one `submit_estimate_decision` remains via `pg_proc`.
2. Ask the customer to retry the approval link, or re-open the estimate URL and confirm submission succeeds and a row appears in `estimate_decision_logs`.

No frontend changes needed.
