import { User, USERKEYS } from "../types/User";
import { BigQueryService } from "./BigQueryService";
import { DATASET_BULLHORN, DATASET_MAIN, Tables } from "../types/Common";
import { COORDINATOR, ROLES } from "../utils/constant";
import { genUUID, isExistByCondition, justifyData } from "../utils";

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
    const validate = validateUser(data);
    if (validate) return { result: false, error: validate };

    const user = justifyData(data, USERKEYS);
    const existing = await isExistUser("email", user.email);
    if (existing) {
      return {
        result: false,
        error: `User with ${user.email} exists`,
      };
    }

    const keys = Object.keys(user);
    const values = keys.map((k) => `"""${user[k]}"""`);

    const query = `
            INSERT INTO \`${DATASET_MAIN}.${Tables.USER}\` (id, ${keys.join(
      ", "
    )})
            VALUES ("${genUUID()}", ${values.join(", ")})
        `;
    console.log(query);
    const options = {
      query: query,
      location: "US",
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    await job.getQueryResults();

    return { result: true };
  } catch (error) {
    return { result: false, error };
  }
};

export const update = async (parent_id: string, role: string, data: User) => {
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

    const existing: User | null = await isExistUserFull("id", id);
    if (!existing) {
      return {
        result: false,
        error: `User with id=${id} exists`,
      };
    }

    const keys = Object.keys(user);
    const values = keys.map((k) => `${k}="""${user[k]}"""`);

    const options = {
      location: "US",
    };

    if (existing.externalId) {
      try {
        const bullhornQuery = `
        UPDATE \`${DATASET_BULLHORN}.${Tables.CANDIDATES}\`
        SET ${values.join(", ")}
        WHERE id = '${id}'
      `;
        const [job] = await BigQueryService.getClient().createQueryJob({
          ...options,
          query: bullhornQuery,
        });
        const res = await job.getQueryResults();
      } catch (error) {
        console.error("Could not update user in bullhorn", error);
      }
    }

    const query = `
            UPDATE \`${DATASET_MAIN}.${Tables.USER}\`
            SET ${values.join(", ")}
            WHERE id = '${id}'
        `;

    const [job] = await BigQueryService.getClient().createQueryJob({
      ...options,
      query,
    });
    const res = await job.getQueryResults();

    const updated = await getUserById(id);

    return { result: true, data: updated };
  } catch (error) {
    return { result: false, error };
  }
};

export const getUserById = async (id: string) => {
  try {
    const query = `
            SELECT *
            FROM \`${DATASET_MAIN}.${Tables.USER}\`
            WHERE id = '${id}'
        `;
    const options = {
      query: query,
      location: "US",
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    const res = await job.getQueryResults();

    return { result: true, data: res[0] };
  } catch (error) {
    return { result: false, error };
  }
};

export const isExistUser = async (field: string, value: string) => {
  try {
    const query = `
            SELECT * FROM \`${DATASET_MAIN}.${Tables.USER}\`
            WHERE ${field}='${value}'
        `;
    const options = {
      query: query,
      location: "US",
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    const [res] = await job.getQueryResults();
    if (res && res.length > 0 && res[0][field] === value) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return true;
  }
};

export const isExistUserFull = async (field: string, value: string) => {
  try {
    const query = `
            SELECT * FROM \`${DATASET_MAIN}.${Tables.USER}\`
            WHERE ${field}='${value}'
        `;
    const options = {
      query: query,
      location: "US",
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    const [res] = await job.getQueryResults();
    if (res && res.length > 0 && res[0][field] === value) {
      return res[0];
    }
    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const query = `
            SELECT * FROM \`${DATASET_MAIN}.${Tables.USER}\`
            WHERE email='${email}' AND password='${password}'
        `;
    const options = {
      query: query,
      location: "US",
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    const [res] = await job.getQueryResults();
    if (res && res.length > 0 && res[0].email === email) {
      return {
        result: true,
        user_id: res[0].id,
        role: res[0].role,
        firstname: res[0].firstname,
        lastname: res[0].lastname,
      };
    }
    return { result: false, error: "wrong credential" };
  } catch (error) {
    console.log(error);
    return { result: false, error };
  }
};

export const findUserByEmail = async (email: string) => {
  try {
    const query = `
            SELECT * FROM \`${DATASET_MAIN}.${Tables.USER}\`
            WHERE email='${email}'
        `;
    const options = {
      query: query,
      location: "US",
    };
    const [job] = await BigQueryService.getClient().createQueryJob(options);
    const [res] = await job.getQueryResults();
    if (res && res.length > 0 && res[0].email === email) {
      return res[0];
    }
    return null;
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
