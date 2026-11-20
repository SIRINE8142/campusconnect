import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Connexion" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <span className="text-xl font-bold text-blue-950">CampusConnect</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Bon retour !</h1>
          <p className="mt-1 text-sm text-slate-500">
            Connecte-toi pour retrouver tes demandes et séances.
          </p>
        </div>
        <Card>
          <LoginForm />
        </Card>
        <p className="mt-4 text-center text-sm text-slate-600">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-blue-700 hover:underline">
            Inscris-toi
          </Link>
        </p>
      </div>
    </div>
  );
}
