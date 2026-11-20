import { requireUser } from "@/lib/auth/session";
import { listReviewsForUser, averageRating } from "@/lib/services/reviews";
import { ProfileForm } from "@/components/profile/profile-form";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { levelLabel, formatDate } from "@/lib/utils";

export const metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [reviews, rating] = await Promise.all([
    listReviewsForUser(user.id),
    averageRating(user.id),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar firstName={user.firstName} lastName={user.lastName} url={user.avatarUrl} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-slate-500">
              {user.specialty ?? "Étudiant"} · {levelLabel(user.level)} · {user.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {user.skills.map((s) => (
                <Badge key={s} tone="blue">{s}</Badge>
              ))}
              {rating.average !== null && (
                <Badge tone="amber">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  {rating.average.toFixed(1)}/5 ({rating.count} avis)
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Modifier mon profil" description="Ces informations sont visibles par les autres étudiants." />
          <ProfileForm
            defaultValues={{
              firstName: user.firstName,
              lastName: user.lastName,
              specialty: user.specialty ?? "",
              level: user.level ?? 1,
              bio: user.bio ?? "",
              avatarUrl: user.avatarUrl ?? "",
              skills: user.skills,
            }}
          />
        </Card>

        <Card>
          <CardHeader title={`Évaluations reçues (${reviews.length})`} />
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune évaluation pour le moment.</p>
          ) : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="border-b border-slate-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      {r.author.firstName} {r.author.lastName}
                    </span>
                    <span className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={
                            n <= r.rating
                              ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
                              : "h-3.5 w-3.5 text-slate-300"
                          }
                        />
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Séance « {r.session.subject} » · {formatDate(r.createdAt)}
                  </p>
                  {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
