import { redirect } from "next/navigation";
import { ElderHeader } from "@/components/elder-header";
import { getElderHome } from "@/lib/data";
import { getElderSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ElderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getElderSession();
  if (!session) redirect("/");
  const data = await getElderHome(session.elderId);
  if (!data) redirect("/");

  return (
    <div className="elder-shell bg-[#fbfaf5]">
      <ElderHeader
        name={data.elder.nickname ?? data.elder.name}
        initialLanguage={data.elder.language}
      />
      {children}
    </div>
  );
}

