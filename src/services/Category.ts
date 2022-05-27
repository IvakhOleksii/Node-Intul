import { Operator } from "../types/Common";
import db from "../utils/db";

export const getCategoriesByFilter = async (
  filters: any,
  fields?: any,
  count?: number,
  operator: Operator = "OR"
) => {
  // TODO: assumes format for fields and filters
  console.log({ filters, fields });
  const categories = await db.category.findMany({
    where: filters?.length ? filters : undefined,
    take: count,
  });

  return categories as any;
};
