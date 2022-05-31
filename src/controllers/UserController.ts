import {
  Controller,
  Param,
  Body,
  Get,
  Post,
  Put,
  Delete,
  QueryParam,
  UploadedFile,
  Authorized,
  HeaderParam,
  CurrentUser,
} from "routing-controllers";
import { BullhornService } from "../services/BullhornService";
import { sendVerification } from "../services/EmailService";
import { register, login, update, getStats } from "../services/User";
import { User, USER_TABLE } from "../types/User";
import { CANDIDATE, COMPANY, ROLES } from "../utils/constant";
import { CreateJwtToken } from "../utils/jwtUtils";
import { User as DbUser } from "prisma/prisma-client";
import db from "../utils/db";

@Controller()
export class UserController {
  @Get("/login")
  async login(
    @QueryParam("email") email: string,
    @QueryParam("password") password: string
  ) {
    const { result, error, ...data } = await login(email, password);
    if (result) {
      const { user_id, role, firstname, lastname } = data as DbUser & {
        user_id: string;
      };
      const token = CreateJwtToken(email, user_id, role, firstname, lastname);
      return {
        result,
        token,
      };
    }
    return { result, error };
  }

  @Post("/register")
  async register(@Body() user: User) {
    let data = { ...user };
    console.log({ user });
    try {
      if (user.role === COMPANY)
        await sendVerification(user.email, user.companyName || "");
      else await sendVerification(user.email, user.firstname || "");
    } catch (error) {
      return {
        result: false,
        error: "Please check email, email maybe invalid one",
      };
    }

    if (user.role === "candidate") {
      try {
        const res = await (
          await BullhornService.getClient()
        ).syncUserTppToBullhorn(user);
        if (res && res.changedEntityId) {
          console.log("changedEntityId", res.changedEntityId);
          data = { ...data, externalId: res.changedEntityId };
        }
      } catch (error) {
        console.error("error syncing to BH");
        console.error(error);
      }
    }
    const { result, error } = await register(data);
    return {
      result,
      error,
    };
  }

  @Authorized()
  @Get("/user/history")
  async getHistory(@CurrentUser() authUser: User) {
    try {
      const history = await db.history.findMany({
        where: {
          table: USER_TABLE,
          recordId: authUser.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return history;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  @Authorized()
  @Post("/user/update")
  async update(@Body() user: User, @CurrentUser() authUser: User) {
    return await update(authUser.id!, authUser.role, user);
  }

  @Authorized()
  @Get("/stats")
  async stats(@CurrentUser() authUser: User) {
    return await getStats(authUser.id!);
  }
}
