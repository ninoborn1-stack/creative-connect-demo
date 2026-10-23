// Sorgt dafür, dass `pnpm dev` ohne weitere Schritte startet: .env anlegen, DB erzeugen und seeden, falls nötig.
import { existsSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";

if (!existsSync(".env")) copyFileSync(".env.example", ".env");
if (!existsSync("prisma/dev.db")) {
  console.log("Demo-Datenbank wird angelegt und befüllt …");
  execSync("pnpm prisma db push --skip-generate && pnpm prisma db seed", { stdio: "inherit" });
}
