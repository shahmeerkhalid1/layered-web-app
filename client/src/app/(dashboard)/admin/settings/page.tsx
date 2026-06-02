import { redirect } from "next/navigation";

/** Platform settings moved to Account settings for administrators. */
export default function AdminSettingsRedirectPage() {
  redirect("/account#platform-settings");
}
