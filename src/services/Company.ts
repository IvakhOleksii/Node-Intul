import db from "../utils/db";

export const saveCompany = async (company: string, candidate: string) => {
  try {
    console.log({ company, candidate });
    const existing = await db.user.findFirst({
      where: {
        id: candidate,
        savedCompanies: {
          some: {
            id: company,
          },
        },
      },
    });

    console.log({ existing });

    if (existing) {
      await db.user.update({
        where: {
          id: candidate,
        },
        data: {
          savedCompanies: {
            disconnect: {
              id: company,
            },
          },
        },
      });
    } else {
      console.log("update");
      await db.user.update({
        where: {
          id: candidate,
        },
        data: {
          savedCompanies: {
            connect: {
              id: company,
            },
          },
        },
      });
    }

    return {
      result: true,
      message: existing ? "unsaved company" : "saved company",
    };
  } catch (e) {
    console.log(e);
    return { result: false, message: e };
  }
};

export const getSavedCompanies = async (candidateId: string) => {
  try {
    const candidate = await db.user.findFirst({
      where: {
        id: candidateId,
      },
      include: {
        savedCompanies: true,
      },
    });
    console.log({ savedCompanies: candidate?.savedCompanies });
    return {
      companies: candidate?.savedCompanies,
      result: true,
    };
  } catch (e) {
    console.log(e);
    return { result: false, message: e };
  }
};
