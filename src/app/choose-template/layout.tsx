import { redirect } from "next/navigation";
import { getUserId } from "@/lib/firebase/auth-server";

export default async function ChooseTemplateLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  return <>{children}</>;
}
