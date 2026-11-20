import { test, expect } from "@playwright/test";

// Comptes issus du seed : npx prisma db seed
const STUDENT = { email: "yasmine@etudiant.tn", password: "Etudiant123!" };
const ADMIN = { email: "admin@campusconnect.tn", password: "Admin123!" };

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test.describe("authentification", () => {
  test("la landing page s'affiche", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("entraide");
  });

  test("connexion étudiant → dashboard", async ({ page }) => {
    await login(page, STUDENT.email, STUDENT.password);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Bonjour");
  });

  test("mauvais mot de passe → message d'erreur", async ({ page }) => {
    await login(page, STUDENT.email, "mauvais-mdp");
    await expect(page.getByRole("alert")).toContainText("incorrect");
  });

  test("page protégée sans session → redirection login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("un étudiant ne peut pas accéder à /admin", async ({ page }) => {
    await login(page, STUDENT.email, STUDENT.password);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("l'admin accède à l'espace admin", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("administrateur");
  });
});
