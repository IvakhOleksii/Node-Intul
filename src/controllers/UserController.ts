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
import {
  register,
  login,
  update,
  recovery,
  getStats,
  getLandingPageStats,
  findUserByEmail,
} from "../services/User";

import { User, USER_TABLE } from "../types/User";

import { COORDINATOR, CANDIDATE, COMPANY, ROLES } from "../utils/constant";

import { CreateJwtToken, VerifyJwtToken } from "../utils/jwtUtils";
import { User as DbUser } from "prisma/prisma-client";
import db from "../utils/db";

@Controller()
export class UserController {
  @Post("/login")
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
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

    if (user.role === COORDINATOR) {
      return {
        result: false,
        error:
          "Only coordinators can make registration requests for other coordinators",
      };
    }
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

    if (user.role === CANDIDATE) {
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
      const { result, error } = await register(data);
      return {
        result,
        error,
      };
    }
  }

  @Post("/reset-password")
  async setPassword(@Body() body: { token: string; new_password: string }) {
    const { token, new_password } = body;
    const data = VerifyJwtToken(token);

    if (!data) return { result: false, error: "token is invalid" };

    const user = await findUserByEmail(data.email);
    if (!user) return { result: false, error: "User does not exist" };

    user.password = new_password;

    return await update(user.id, user.role, user);
  }

  @Post("/account-recovery")
  async accountRecovery(@Body() body: { email: string; name: string }) {
    const { email, name } = body;
    return await recovery(email, name);
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
  @Post("/register_coordinator")
  async register_coordinator(
    @Body() user: User,
    @CurrentUser() authUser: User
  ) {
    let data = { ...user };

    if (authUser.role !== COORDINATOR) {
      return {
        result: false,
        error:
          "Only coordinators can make registration requests for other coordinators",
      };
    }

    return await register(data);
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

  @Get("/landing-page-stats")
  async landingPageStats() {
    return await getLandingPageStats();
  }
}
