import { notFound } from "next/navigation";
import { permissionCode } from "@/lib/types";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { getCompanyProfile, listBranches } from "@/lib/settings/queries";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const user = await requirePermission(permissionCode("settings", "VIEW"));

  const [company, branches] = await Promise.all([
    getCompanyProfile(user.companyId),
    listBranches(user.companyId),
  ]);
  if (!company) notFound();

  const canEdit = hasPermission(user, permissionCode("settings", "EDIT"));

  return <SettingsView company={company} branches={branches} canEdit={canEdit} />;
}
