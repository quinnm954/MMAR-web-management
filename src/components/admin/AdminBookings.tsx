import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Calendar } from "lucide-react";
import AdminBookingRequests from "./AdminBookingRequests";
import AdminAppointments from "./AdminAppointments";

const AdminBookings = () => {
  const [tab, setTab] = useState("requests");
  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList>
          <TabsTrigger value="requests" className="gap-2">
            <CalendarCheck className="h-4 w-4" /> Booking Requests
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" /> Appointments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="mt-4">
          <AdminBookingRequests />
        </TabsContent>
        <TabsContent value="appointments" className="mt-4">
          <AdminAppointments />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBookings;
