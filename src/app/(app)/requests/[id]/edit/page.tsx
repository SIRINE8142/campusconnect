import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getRequest } from "@/lib/services/requests";
import { RequestForm } from "@/components/requests/request-form";
import { Card, CardHeader } from "@/components/ui/card";

export const metadata = { title: "Modifier la demande" };

export default async function EditRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const request = await getRequest(id).catch(() => null);
  if (!request) notFound();

  // Protection côté serveur : seul l'auteur accède au formulaire d'édition.
  if (request.authorId !== user.id) redirect(`/requests/${id}`);
  if (request.status === "COMPLETED") redirect(`/requests/${id}`);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader
          title="Modifier ma demande"
          description="Les étudiants verront la version mise à jour."
        />
        <RequestForm
          requestId={request.id}
          defaultValues={{
            title: request.title,
            description: request.description,
            subject: request.subject,
            level: request.level,
            availability: request.availability,
          }}
        />
      </Card>
    </div>
  );
}
