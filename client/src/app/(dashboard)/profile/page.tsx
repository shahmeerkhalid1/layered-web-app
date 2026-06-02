import { redirect } from "next/navigation";

/** @deprecated Use /account */
export default function ProfileRedirectPage() {
  redirect("/account");
}
