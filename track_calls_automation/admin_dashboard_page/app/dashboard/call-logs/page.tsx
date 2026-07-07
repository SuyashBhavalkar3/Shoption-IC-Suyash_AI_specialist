import { redirect } from "next/navigation";

export default function CallLogsRedirect() {
  redirect("/?view=call-logs");
}
