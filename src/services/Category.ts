import {
  ALLOWED_CATEGORY_FILTER_KEYS,
  Category,
  CATEGORY_NON_STRING_FIELDS,
} from "../types/Category";
import { DATASET_BULLHORN, FilterOption, Tables } from "../types/Common";
import { BigQueryService } from "./BigQueryService";

export const getCategoriesByFilter = async (
  filters: FilterOption[] = [],
  fields?: string[],
  count?: number
) => {
  const _filters = filters.filter((filter) => {
    return ALLOWED_CATEGORY_FILTER_KEYS.has(filter.key as any);
  });

  const _fields = fields?.length ? fields.join(", ") : "*";

  const _conditions = _filters
    .map((filter) => {
      return typeof filter.value === "string" &&
        !CATEGORY_NON_STRING_FIELDS.has(filter.key as any)
        ? `LOWER(${filter.key}) LIKE '%${filter.value.toLowerCase()}%'`
        : `${filter.key} = ${filter.value}`;
    })
    .join(" AND ");

  const _dataset = DATASET_BULLHORN;
  const _table = Tables.CATEGORIES;
  return (await BigQueryService.selectQuery(
    _dataset,
    _table,
    _fields,
    count,
    _conditions
  )) as Category[];
};
