import {
  Body,
  Get,
  JsonController,
  Post,
  QueryParam,
} from "routing-controllers";
import { getCategoriesByFilter } from "../services/Category";
import {
  CategoryByIdResponse,
  CategorySearchByFilterResponse,
  FilterBody,
} from "../types/Common";

@JsonController("/api/category")
export class CategoryController {
  @Get("/search")
  async searchByID(
    @QueryParam("id") id: string
  ): Promise<CategoryByIdResponse> {
    try {
      const _filters = [
        {
          key: "id",
          value: id,
        },
      ];

      const category = await getCategoriesByFilter(_filters, undefined, 1);

      return {
        category: category?.[0],
        message: null,
      };
    } catch (error) {
      console.log(error);
      return {
        category: undefined,
        message: error,
      };
    }
  }

  @Post("/search")
  async searchByFilter(
    @Body() body: FilterBody
  ): Promise<CategorySearchByFilterResponse> {
    try {
      const { filters, fields, page, count, operator } = body;

      const categories = await getCategoriesByFilter(
        filters,
        fields || [],
        count,
        operator
      );

      return {
        categories,
        total: categories?.length,
        message: null,
      };
    } catch (error) {
      console.log(error);
      return {
        message: error,
      };
    }
  }
}
