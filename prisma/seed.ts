import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { indicators, sources, topics } from "../src/lib/catalogue";
import { counties } from "../src/lib/regions/catalogue";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  }),
});

async function main() {
  await db.$transaction(async (tx) => {
    for (const topic of topics) {
      await tx.topic.upsert({
        where: { id: topic.slug },
        create: {
          id: topic.slug,
          slug: topic.slug,
          nameHr: topic.name,
          nameEn: topic.nameEn,
          description: topic.description,
        },
        update: {
          nameHr: topic.name,
          nameEn: topic.nameEn,
          description: topic.description,
        },
      });
    }
    for (const source of sources) {
      const data = { name: source.name, url: source.url };
      await tx.dataSource.upsert({
        where: { id: source.id },
        create: { id: source.id, ...data },
        update: data,
      });
    }
    for (const indicator of indicators) {
      await tx.indicatorDefinition.upsert({
        where: { id: indicator.slug },
        create: {
          id: indicator.slug,
          slug: indicator.slug,
          topicId: indicator.topic,
          nameHr: indicator.name,
          nameEn: indicator.nameEn,
          definition: indicator.description,
          unit: indicator.unit,
          frequency: indicator.frequency,
          geographicCoverage: ["HR"],
        },
        update: {},
      });
    }
    for (const area of [
      ...counties.map((county) => ({ id: county.id, nameHr: county.name, nameEn: county.name, level: "NUTS3_2024" })),
      { id: "HR", nameHr: "Hrvatska", nameEn: "Croatia", level: "country" },
      {
        id: "EU27_2020",
        nameHr: "Europska unija (27)",
        nameEn: "European Union (27)",
        level: "aggregate",
      },
    ]) {
      await tx.geographicArea.upsert({
        where: { id: area.id },
        create: area,
        update: {},
      });
    }
  });
  console.info(
    `Seeded ${topics.length} topics, ${sources.length} sources and ${indicators.length} planned indicators. No observations created.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
