import {
  Body,
  Get,
  Post,
  Put,
  QueryParam,
  JsonController,
  Authorized,
  CurrentUser,
} from "routing-controllers";
import { saveCandidate, getSavedCandidates } from "../services/Candidate";
import { FilterBody } from "../types/Common";
import { User } from "../types/User";
import { COMPANY } from "../utils/constant";
import db from "../utils/db";
import { getSavedJobs } from "../utils/MainCrud";

@JsonController("/api/candidate")
export class JobController {
  @Authorized()
  @Get("/savedJobs")
  async savedJobs(@QueryParam("candidate") candidate: string) {
    return await getSavedJobs(candidate);
  }

  @Authorized()
  @Get("/search")
  async searchById(@QueryParam("id") id: string) {
    try {
      const user = await db.user.findFirst({
        where: {
          id,
        },
        include: {
          candidate: true,
        },
      });

      let candidate;
      if (user) {
        const {
          password,
          candidate: userCandidate,
          ...returnableUserData
        } = user;
        candidate = {
          ...(userCandidate || {}),
          ...returnableUserData,
        };
      } else {
        candidate = await db.candidate.findFirst({
          where: {
            id,
          },
        });
      }

      return {
        candidate,
        message: !candidate ? "No user with given ID" : undefined,
      };
    } catch (error) {
      return { message: error };
    }
  }

  @Authorized()
  @Post("/search")
  async searchByFilters(@Body() body: FilterBody) {
    try {
      const { filters, fields, page, count } = body;

      // TODO: assuming filters and fields format
      const candidates = await db.candidate.findMany({
        where: filters,
        select: fields,
        take: count,
        skip: page * count,
      });

      return {
        candidates: candidates || [],
      };
    } catch (error) {
      console.log(error);
      return { message: error };
    }
  }

  @Authorized()
  @Put("/save")
  async save(
    @Body() body: { candidate: string; company: string },
    @CurrentUser() authUser: User
  ) {
    if (authUser.role === COMPANY) {
      return await saveCandidate(body.candidate, body.company || authUser.id!);
    } else {
      return {
        result: false,
        message: "You are not a company",
      };
    }
  }

  @Authorized()
  @Get("/saved")
  async savedCandidates(
    @CurrentUser() authUser: User,
    @QueryParam("candidate") candidate: string
  ) {
    return await getSavedCandidates(candidate || authUser.id!);
  }
}
