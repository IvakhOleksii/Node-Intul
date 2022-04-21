import { Controller, Param, Body, Get, Post, Put, Delete, QueryParam, UploadedFile, Authorized, HeaderParam, CurrentUser } from 'routing-controllers';
import { BullhornService } from '../services/BullhornService';
import { sendVerification } from '../services/EmailService';
import { register, login, update } from '../services/User';
import { User } from '../types/User';
import { CANDIDATE, COMPANY, ROLES } from '../utils/constant';
import { CreateJwtToken } from '../utils/jwtUtils';

@Controller()
export class UserController {
  @Get('/login')
  async login(
    @QueryParam('email') email: string,
    @QueryParam('password') password: string,
  ) {
    const {result, error, user_id, role} = await login(email, password);
    if (result) {
      const token = CreateJwtToken(email, user_id, role);
      return {
        result, token
      };
    }
    return { result, error };
  }
 
  @Post('/register')
  async register(@Body() user: User) {
    let data = { ...user };
    try {
      if (user.role === COMPANY)
        await sendVerification(user.email, user.companyName || '');
      else
        await sendVerification(user.email, user.firstname || '');
    } catch (error) {
      return {
        result: false,
        error: 'Please check email, email maybe invalid one'
      };
    }
    
    if (user.role === 'candidate') {
      const res = await (await BullhornService.getClient()).syncUserTppToBullhorn(user);
      if (res && res.changedEntityId) {
        console.log("changedEntityId", res.changedEntityId);
        data = { ...data, externalId: res.changedEntityId };
      }
    }
    const {result, error} = await register(data);
    return {
      result,
      error
    };
  }

  @Authorized()
  @Post('/user/update')
  async update(
    @Body() user: User,
    @CurrentUser() authUser: User,
  ) {
    return await update(authUser.id!, authUser.role, user);
  }
}