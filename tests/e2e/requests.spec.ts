import { test, expect } from "@playwright/test";

const STUDENT = { email: "fatma@etudiant.tn", password: "Etudiant123!" };

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse email").fill(STUDENT.email);
  await page.getByLabel("Mot de passe").fill(STUDENT.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("demandes d'aide", () => {
  test("créer, voir dans la liste et retrouver via filtre", async ({ page }) => {
    await login(page);
    const titre = `Test e2e ${Date.now()}`;

    // Création
    await page.goto("/requests/new");
    await page.getByLabel("Titre").fill(titre);
    await page.getByLabel("Description").fill("Description de test end-to-end suffisamment longue.");
    await page.getByLabel("Matière").fill("Probabilités");
    await page.getByLabel("Niveau requis").selectOption("3");
    await page.getByLabel("Disponibilités").fill("Le week-end");
    await page.getByRole("button", { name: "Publier ma demande" }).click();

    // Redirection vers le détail de la demande
    await expect(page).toHaveURL(/\/requests\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(titre);

    // Filtre par matière
    await page.goto("/requests?subject=Probabilités&status=OPEN");
    await expect(page.getByText(titre)).toBeVisible();
  });
});
