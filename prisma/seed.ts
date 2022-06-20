import { Datasource } from "@prisma/client";
import db from "../src/utils/db";

async function main() {
  try {
    console.log("Seeding...🌱");
    await Promise.all([
      seedCandidates(),
      seedCompanies().then(seedJobs),
      seedCategories(),
    ]);
    console.log("Done🎉");
  } catch (err) {
    console.error("Error during seed...❌");
    console.error(err);
    throw err;
  }
}

async function seedJobs() {
  await db.job.createMany({
    data: [
      {
        title: "Senior Software Engineer",
        companyId: (await db.company.findFirst())?.id,

        address1: "123 Job St",
        city: "Tulsa",
        state: "OK",
        zip: "74008",
        salary: "160000",
        employmentType: "fulltime",
        onSite: true,
        description: "Come join our rockstar team for good money and team",
        datasource: Datasource.main as any,
        status: "active",
      },
      {
        title: "Junior Software Engineer",
        companyId: (await db.company.findFirst())?.id,

        address1: "123 Job St",
        city: "Tulsa",
        state: "OK",
        zip: "74008",
        salary: "80000",
        employmentType: "fulltime",
        onSite: true,
        description: "Come join our rockstar team for good money and learning",
        datasource: Datasource.bullhorn as any,
        status: "active",
      },
    ],
  });
}

async function seedCandidates() {
  await db.candidate.createMany({
    data: [
      {
        address: "123 Main St",
        address_address1: "123 Main St",
        occupation: "Programmer",
        address_city: "Tulsa",
        address_state: "OK",
        address_zip: "74008",
        description: "Great candidate for everything",
        companyName: "Eddy's Everything",
        companyURL: "eddyseverything.com",
        firstname: "John",
        lastname: "Smith",
        phone: "123-456-7891",
        email: "jsmithers@gmail.com",
        comments: "He does everything!",
      },
      {
        address: "124 Main St",
        address_address1: "124 Main St",
        occupation: "None",
        address_city: "Tulsa",
        address_state: "OK",
        address_zip: "74008",
        description: "Ehh...",
        companyName: "Nowhere",
        companyURL: "nowhere.com",
        firstname: "Bob",
        lastname: "Tester",
        phone: "987-654-3210",
        email: "bobtesting@gmail.com",
        comments: "He does nothing...",
      },
    ],
  });
}

async function seedCategories() {
  await db.category.createMany({
    data: [
      {
        name: "First category",
        enabled: true,
        description: "the first one",
      },
      {
        name: "Second category",
        enabled: true,
        description: "the second one",
      },
    ],
  });
}

async function seedCompanies() {
  await db.company.createMany({
    data: [
      {
        name: "Testing Co",
        annualRevenue: 1000000,
        logo: "https://picsum.photos/200",
        bh_description: "a company",
        getro_description: "a healthcare company",
        description: "Testing a new description",
        city: "Tulsa",
        state: "OK",
        businessSectorList: "Health Care,Virtual Health",
        billingPhone: "946-423-2341",
        companyURL: "testingco@gmail.com",
        companyDescription: "Best at testing",
        numEmployees: 50,
      },
      {
        name: "Pepsoda",
        annualRevenue: 20000,
        logo: "https://picsum.photos/200",
        businessSectorList: "SaaS,Fintech",
        bh_description: "a good company",
        getro_description: "a fintech company",
        description: "testing a new description",
        city: "Tulsa",
        state: "OK",
        billingPhone: "876-567-9876",
        companyURL: "pepsoda@gmail.com",
        companyDescription: "Best at test",
        numEmployees: 50,
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });