import { redirect } from "next/navigation";
import { checkMaintenanceMode } from "../../lib/firebaseAdmin";
import MaintenanceUI from "./MaintenanceUI";

export default async function MaintenancePage() {
  const isActive = await checkMaintenanceMode();

  // If NOT under maintenance, redirect to home
  if (!isActive) {
    redirect("/");
  }

  return <MaintenanceUI />;
}
