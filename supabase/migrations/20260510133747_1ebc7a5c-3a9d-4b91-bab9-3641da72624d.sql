-- Customers may insert maintenance records for THEIR OWN vehicles, but only
-- as self-reported entries (technician_notes pinned to the canonical marker).
CREATE POLICY "Customers self-report service"
ON public.service_records
FOR INSERT
TO authenticated
WITH CHECK (
  customer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = service_records.vehicle_id
      AND v.owner_id = auth.uid()
  )
  AND technician_notes = 'Self-reported by customer (performed elsewhere)'
);

-- Customers may delete only their own self-reported entries (never shop-logged ones).
CREATE POLICY "Customers delete own self-reported service"
ON public.service_records
FOR DELETE
TO authenticated
USING (
  customer_id = auth.uid()
  AND technician_notes = 'Self-reported by customer (performed elsewhere)'
);