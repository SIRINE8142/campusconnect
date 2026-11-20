import { requireUser } from "@/lib/auth/session";
import { RequestForm } from "@/components/requests/request-form";
import { Card, CardHeader } from "@/components/ui/card";

export const metadata = { title: "Nouvelle demande" };

export default async function NewRequestPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader
          title="Publier une demande d'aide"
          description="Décris ta difficulté : les étudiants compétents pourront te proposer leur aide."
        />
        <RequestForm />
      </Card>
    </div>
  );
}
