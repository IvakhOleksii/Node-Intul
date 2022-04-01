import { Controller, Param, Body, Get, Post, Put, Delete, QueryParam, UploadedFile } from 'routing-controllers';
import { sendVerification } from '../services/EmailService';
import { register, login } from '../services/User';
import { User } from '../types/User';
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
    const {result, error} = await register(user);
    if (result) {
      await sendVerification(user.email, user.firstname);
    }
    return {
      result,
      error
    };
  }
}