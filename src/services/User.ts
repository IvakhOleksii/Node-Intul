import { User, USERKEYS, USER_TABLE } from "../types/User";
import { BigQueryService } from "./BigQueryService";
import { DATASET_BULLHORN, DATASET_MAIN, Tables } from "../types/Common";
import { COORDINATOR, ROLES } from "../utils/constant";
import { genUUID, isExistByCondition, justifyData } from "../utils";

import db from "../utils/db";

import { User as dbUser, History as dbHistory } from "prisma/prisma-client";
import {
  encryptPassword,
  checkPassword,
  clearPassword,
} from "../utils/password";
import {
  sendUpdateUserNotification,
  sendNewUserNotification,
  sendResetPassword
  } from "./EmailService"
import {CreateJwtToken} from "../utils/jwtUtils"

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
  category,
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
    // if (isNullOrEmpty(category))
    //     return 'category is required';
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
        password: encryptPassword(user.password),
      } as any,
    });

    console.log("success");

    await sendNewUserNotification(user.email, user.firstname || "");

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
        error: `User with id=${id} doesn't exist`,
      };
    }

    if (user.password) {
      user.password = encryptPassword(user.password);
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
    clearPassword(updated.data);

    await sendUpdateUserNotification(updated.data.email, updated.data.firstname);

    return { result: true, data: updated.data };
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
  const batchId = genUUID();

  const historyRecords = Object.keys(updatedUser)
    .filter((key) => {
      const typedKey = key as keyof dbUser;
      const newValue = updatedUser[typedKey];
      const oldValue = existingUser[typedKey];

      return newValue !== oldValue;
    })
    .map((key) => {
      const typedKey = key as keyof dbUser;
      return {
        table: USER_TABLE,
        recordId: existingUser.id,
        column: key,
        oldValue:
          existingUser[typedKey] != null
            ? existingUser[typedKey]?.toString()
            : null,
        newValue:
          updatedUser[typedKey] != null
            ? updatedUser[typedKey]?.toString()
            : null,
        batchId,
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
        password: true,
      },
      where: {
        email,
      },
    });

    if (existingUser && checkPassword(existingUser.password, password)) {
      return {
        result: true,
        ...clearPassword(existingUser),
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

    const totalJobsCountQuery = `SELECT COUNT(*) as count FROM \`${DATASET_BULLHORN}.${Tables.JOBS}\``;

    const savedCompaniesCountQuery = `SELECT COUNT(*) as count FROM \`${DATASET_MAIN}.${Tables.SAVED_COMPANIES}\`
                                        WHERE candidate = '${userId}'`;

    const totalCompaniesCountQuery = `SELECT COUNT(*) as count FROM \`${DATASET_BULLHORN}.${Tables.COMPANIES}\``;


    const applicationCountPromise = BigQueryService.getClient().query({
      query: applicationCountQuery,
      location: "US",
    });

    const savedJobsCountPromise = BigQueryService.getClient().query({
      query: savedJobsCountQuery,
      location: "US",
    });

    const totalJobsCountPromise = BigQueryService.getClient().query({
      query: totalJobsCountQuery,
      location: "US",
    });

    const savedCompaniesCountPromise = BigQueryService.getClient().query({
      query: savedCompaniesCountQuery,
      location: "US",
    });

    const totalCompaniesCountPromise = BigQueryService.getClient().query({
      query: totalCompaniesCountQuery,
      location: "US",
    });

    const [
      [applicationCount],
      [savedJobsCount],
      [totalJobsCount],
      [savedCompaniesCount],
      [totalCompaniesCount]
    ] =
      await Promise.all([
        applicationCountPromise,
        savedJobsCountPromise,
        totalJobsCountPromise,
        savedCompaniesCountPromise,
        totalCompaniesCountPromise
      ]);

    return {
      result: true,
      applicationCount: applicationCount[0].count,
      savedJobsCount: savedJobsCount[0].count,
      totalJobsCount: totalJobsCount[0].count,
      savedCompaniesCount: savedCompaniesCount[0].count,
      totalCompaniesCount: totalCompaniesCount[0].count,
      message: null,
    };
  } catch (error) {
    return {
      result: false,
      applicationCount: null,
      savedJobsCount: null,
      totalJobsCount: null,
      savedCompaniesCount: null,
      totalCompaniesCount: null,
      message: error,
    };
  }
};

export const getLandingPageStats = async () => {
  try {
    
    const totalJobsCountQuery = `SELECT COUNT(*) as count FROM \`${DATASET_BULLHORN}.${Tables.JOBS}\``;
    
    const totalCompaniesCountQuery = `SELECT COUNT(*) as count FROM \`${DATASET_BULLHORN}.${Tables.COMPANIES}\``;
    
    const totalJobsCountPromise = BigQueryService.getClient().query({
      query: totalJobsCountQuery,
      location: "US",
    });
    
    const totalCompaniesCountPromise = BigQueryService.getClient().query({
      query: totalCompaniesCountQuery,
      location: "US",
    });
    
    const [
      [totalJobsCount],
      [totalCompaniesCount]
    ] =
      await Promise.all([
        totalJobsCountPromise,
        totalCompaniesCountPromise
      ]);

    return {
      result: true,
      totalJobsCount: totalJobsCount[0].count,
      totalCompaniesCount: totalCompaniesCount[0].count,
      message: null,
    };
  } catch (error) {
    return {
      result: false,
      totalJobsCount: null,
      totalCompaniesCount: null,
      message: error,
    };
  }
};

export const recovery = async (email: string, name: string) => {
  try {
    if (isNullOrEmpty(name))
      return { result: false, error: 'name is required'};

    const user = await findUserByEmail(email);
    if(!user)
      return { result: false, error: 'User does not exist'};

    const token = CreateJwtToken(user.email, '', '', '', '');

    await sendResetPassword(email, name, token);

    return { result: true };
  } catch (error) {
    console.log(error)
    return { result: false, error };
  }
}