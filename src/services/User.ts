import { User, USERKEYS } from "../types/User";
import { BigQueryService } from "./BigQueryService";
import { DATASET_BULLHORN, DATASET_MAIN, Tables } from "../types/Common";
import { COORDINATOR, ROLES } from "../utils/constant";
import { genUUID, isExistByCondition, justifyData } from "../utils";
import db from "../utils/db";

import { User as dbUser, History as dbHistory } from "prisma/prisma-client";

const isNullOrEmpty = (value: any) => {
  return !value || (value && !`${value}`.trim());
};

const validateUser = ({
  firstname,
  lastname,
  email,
  password,
  role,
  city = "",
  state = "",
  resume,
  linkedin,
  skills,
  expertise,
}: User) => {
  try {
    if (isNullOrEmpty(firstname) || isNullOrEmpty(lastname))
      return "firstname and lastname is required";
    if (isNullOrEmpty(email)) return "email is invalid";
    if (ROLES.find((r) => r === role) === null)
      return `role is invalid, it should be one in [${ROLES.join(", ")}]`;
    if (isNullOrEmpty(password)) return "password is required";
    // if (isNullOrEmpty(resume))
    //     return 'resume is required';
    // if (isNullOrEmpty(linkedin))
    //     return 'linkedin is required';
    // if (isNullOrEmpty(skills))
    //     return 'skill is required';
    // if (isNullOrEmpty(expertise))
    //     return 'expertise is required';
  } catch (error) {
    return "something is wrong, please check params";
  }
  return false;
};

export const register = async (data: User) => {
  try {
    console.log("registering...");
    const validate = validateUser(data);
    if (validate) {
      console.log("failed validation", validate);
      return { result: false, error: validate };
    }

    const user = justifyData(data, USERKEYS);
    const existing = await isExistUser("email", user.email);
    if (existing) {
      console.log("user exists");
      return {
        result: false,
        error: `User with ${user.email} exists`,
      };
    }

    await db.user.create({
      data: {
        ...data,
        expertise: {
          connect: {
            id: Number(data.expertise),
          },
        },
      } as any,
    });

    console.log("success");
    return { result: true };
  } catch (error) {
    console.error(error);
    return { result: false, error };
  }
};

export const update = async (parent_id: string, role: string, data: any) => {
  try {
    const user_id = data.id;
    const id = user_id || parent_id;
    if (user_id && role !== COORDINATOR && parent_id !== user_id) {
      return {
        result: false,
        error: "You should be a coordinator for updating this user",
      };
    }

    const user = justifyData(data, USERKEYS, ["email", "id"]);
    if (user && user.role && !ROLES.find((role) => role === user.role)) {
      return {
        result: false,
        error: `Invalid Role (candidate, coordinator, company)`,
      };
    }

    const existing: dbUser | null = await isExistUserFull("id", id);
    if (!existing) {
      return {
        result: false,
        error: `User with id=${id} exists`,
      };
    }

    if (existing.externalId) {
      try {
        // TODO: add bullhorn api update here
      } catch (error) {
        console.error("Could not update user in bullhorn", error);
      }
    }

    const updated = await db.user.update({
      where: {
        id: existing.id,
      },
      data: user,
    });

    try {
      await addUserHistoryEntries({
        updatedUser: user,
        existingUser: existing,
      });
    } catch (err) {
      console.log("could not add user history:", user);
      console.log(err);
    }

    return { result: true, data: updated };
  } catch (error) {
    return { result: false, error };
  }
};

export const addUserHistoryEntries = async ({
  updatedUser,
  existingUser,
}: {
  updatedUser: Partial<dbUser>;
  existingUser: dbUser;
}) => {
  const batch_id = genUUID();

  const historyRecords = Object.keys(updatedUser).map((key) => {
    const typedKey = key as keyof dbUser;
    return {
      table: "User",
      record_id: existingUser.id,
      column: key,
      oldValue:
        existingUser[typedKey] != null
          ? existingUser[typedKey]?.toString()
          : null,
      newValue:
        updatedUser[typedKey] != null
          ? updatedUser[typedKey]?.toString()
          : null,
      batch_id,
    };
  });

  return await db.history.createMany({
    data: historyRecords,
  });
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findFirst({
      where: {
        id,
      },
    });

    return { result: true, data: user };
  } catch (error) {
    return { result: false, error };
  }
};

export const isExistUser = async (field: string, value: string) => {
  try {
    return (await isExistUserFull(field, value)) != null;
  } catch (error) {
    console.log(error);
    return true;
  }
};

export const isExistUserFull = async (field: string, value: string) => {
  try {
    const user = await db.user.findFirst({
      where: {
        [field]: value,
      },
    });

    return user || null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const existingUser = await db.user.findFirst({
      select: {
        id: true,
        role: true,
        firstname: true,
        lastname: true,
      },
      where: {
        email,
        password,
      },
    });

    if (existingUser) {
      return {
        result: true,
        ...existingUser,
        user_id: existingUser.id,
      };
    } else {
      console.log("no existing user");
      return { result: false, error: "wrong credential" };
    }
  } catch (error) {
    console.log(error);
    return { result: false, error };
  }
};

export const findUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findFirst({
      where: {
        email,
      },
    });

    return user || null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getStats = async (userId: string) => {
  try {
    const applicationCountQuery = `SELECT COUNT(*) as count FROM \`${DATASET_MAIN}.${Tables.APPLICATIONS}\` 
                    INNER JOIN \`${DATASET_MAIN}.${Tables.JOBS}\`
                    ON \`${DATASET_MAIN}.${Tables.JOBS}\`.\`id\` = \`${DATASET_MAIN}.${Tables.APPLICATIONS}\`.\`job\`
                    OR \`${DATASET_MAIN}.${Tables.JOBS}\`.\`externalId\` = \`${DATASET_MAIN}.${Tables.APPLICATIONS}\`.\`job\`
                    WHERE \`${DATASET_MAIN}.${Tables.APPLICATIONS}\`.\`candidate\` = '${userId}'`;

    const savedJobsCountQuery = `SELECT COUNT(*) as count FROM \`${DATASET_MAIN}.${Tables.SAVEDJOBS}\`
                                    WHERE candidate = '${userId}'`;

    const savedCompaniesCountQuery = `SELECT COUNT(*) as count FROM \`${DATASET_MAIN}.${Tables.SAVED_COMPANIES}\`
                                        WHERE candidate = '${userId}'`;

    const applicationCountPromise = BigQueryService.getClient().query({
      query: applicationCountQuery,
      location: "US",
    });

    const savedJobsCountPromise = BigQueryService.getClient().query({
      query: savedJobsCountQuery,
      location: "US",
    });

    const savedCompaniesCountPromise = BigQueryService.getClient().query({
      query: savedCompaniesCountQuery,
      location: "US",
    });

    const [[applicationCount], [savedJobsCount], [savedCompaniesCount]] =
      await Promise.all([
        applicationCountPromise,
        savedJobsCountPromise,
        savedCompaniesCountPromise,
      ]);

    return {
      result: true,
      applicationCount: applicationCount[0].count,
      savedJobsCount: savedJobsCount[0].count,
      savedCompaniesCount: savedCompaniesCount[0].count,
      message: null,
    };
  } catch (error) {
    return {
      result: false,
      applicationCount: null,
      savedJobsCount: null,
      savedCompaniesCount: null,
      message: error,
    };
  }
};
