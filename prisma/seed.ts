import { PrismaClient } from "@prisma/client";
import { runSeed } from "../src/lib/seed/run";
import { generateDemoAudio } from "../scripts/generate-audio";

const db = new PrismaClient();

async function main() {
  await generateDemoAudio();
  const result = await runSeed(db);
  console.log("Seed fertig:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
