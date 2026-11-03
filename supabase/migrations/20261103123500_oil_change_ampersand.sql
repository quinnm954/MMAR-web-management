CREATE OR REPLACE FUNCTION public.is_oil_change_request(_text text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$ SELECT coalesce(_text, '') ~* '(\moil[[:space:]-]*((and|n|&|\+|/)[[:space:]]*filter[[:space:]-]*)?change\M|\moil[[:space:]]*(and|n|&|\+|/)[[:space:]]*filter\M|\mchange[[:space:]]+(the[[:space:]]+|my[[:space:]]+)?oil\M|\mcambio[[:space:]]+de[[:space:]]+aceite\M)' $function$;
