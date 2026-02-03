import { redirect } from "next/navigation";

// Tables are preset by seed only; no management UI.
export default function TablesPage() {
  redirect("/");
}
