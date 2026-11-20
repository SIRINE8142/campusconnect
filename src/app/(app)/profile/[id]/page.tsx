import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getPublicProfile } from "@/lib/services/profiles";
import { listReviewsForUser, averageRating } from "@/lib/services/reviews";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { levelLabel, formatDate } from "@/lib/utils";

export const metadata = { title: "Profil étudiant" };

/** Profil public d'un autre étudiant. */
export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  if (id === user.id) redirect("/profile");

  const profile = await getPublicProfile(id).catch(() => null);
  if (!profile) notFound();

  const [reviews, rating] = await Promise.all([
    listReviewsForUser(id),
    averageRating(id),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar
            firstName={profile.firstName}
            lastName={profile.lastName}
            url={profile.avatarUrl}
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-slate-500">
              {profile.specialty ?? "Étudiant"} · {levelLabel(profile.level)} · membre depuis{" "}
              {formatDate(profile.createdAt)}
            </p>
            {profile.bio && <p className="mt-2 text-sm text-slate-600">{profile.bio}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {profile.skills.map((us) => (
                <Badge key={us.skillId} tone="blue">{us.skill.name}</Badge>
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
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-center sm:max-w-xs">
          <div>
            <p className="text-xl font-bold text-blue-800">{profile._count.helpRequests}</p>
            <p className="text-xs text-slate-500">demandes publiées</p>
          </div>
          <div>
            <p className="text-xl font-bold text-blue-800">{profile._count.proposals}</p>
            <p className="text-xs text-slate-500">aides proposées</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title={`Évaluations (${reviews.length})`} />
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
  );
}
