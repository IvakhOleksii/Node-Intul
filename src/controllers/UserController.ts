import { Controller, Param, Body, Get, Post, Put, Delete, QueryParam, UploadedFile } from 'routing-controllers';
import { register, login } from '../services/User';
import { fileUploadOptions } from '../utils';
import { CreateJwtToken } from '../utils/jwt';

@Controller()
export class UserController {
  @Get('/login')
  async login(
    @QueryParam('email') email: string,
    @QueryParam('password') password: string,
  ) {
    const {result, error} = await login(email, password);
    if (result) {
      const token = CreateJwtToken(email);
      return {
        result, token
      };
    }
    return { result, error };
  }
 
  @Post('/register')
  async register(@Body() user: any) {
    const {result, error} = await register(user);
    return {
      result,
      error
    };
  }
}