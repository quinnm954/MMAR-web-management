/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as appointmentConfirmed } from './appointment-confirmed.tsx'
import { template as serviceCompleted } from './service-completed.tsx'
import { template as invoiceIssued } from './invoice-issued.tsx'
import { template as membershipWelcome } from './membership-welcome.tsx'
import { template as estimateReady } from './estimate-ready.tsx'
import { template as inspectionReady } from './inspection-ready.tsx'
import { template as mileageServiceReminder } from './mileage-service-reminder.tsx'
import { template as mileageUpdateRequest } from './mileage-update-request.tsx'
import { template as invoicePaidReceipt } from './invoice-paid-receipt.tsx'
import { template as bookingRequestReceived } from './booking-request-received.tsx'
import { template as adminNewBookingRequest } from './admin-new-booking-request.tsx'
import { template as maintenanceChecklistReminder } from './maintenance-checklist-reminder.tsx'
import { template as adminMessage } from './admin-message.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'admin-message': adminMessage,
  'appointment-confirmed': appointmentConfirmed,
  'service-completed': serviceCompleted,
  'invoice-issued': invoiceIssued,
  'membership-welcome': membershipWelcome,
  'estimate-ready': estimateReady,
  'inspection-ready': inspectionReady,
  'mileage-service-reminder': mileageServiceReminder,
  'mileage-update-request': mileageUpdateRequest,
  'invoice-paid-receipt': invoicePaidReceipt,
  'booking-request-received': bookingRequestReceived,
  'admin-new-booking-request': adminNewBookingRequest,
  'maintenance-checklist-reminder': maintenanceChecklistReminder,
}
