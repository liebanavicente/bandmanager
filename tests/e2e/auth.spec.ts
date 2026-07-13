import { test, expect } from "@playwright/test";

test.describe("Autenticación", () => {
  test("inicio de sesión con cuenta demo", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@losvoltios.es");
    await page.getByLabel("Contraseña").fill("demo1234");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Panel" })).toBeVisible();
  });

  test("acceso denegado sin sesión", async ({ page }) => {
    await page.goto("/events");
    await expect(page).toHaveURL(/\/login/);
  });
});