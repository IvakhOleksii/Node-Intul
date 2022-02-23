import jwt from 'jsonwebtoken';
import config from '../config';

export const CreateJwtToken = (email: string) => {
    const token = jwt.sign(
      {email},
      config.authSecret || 'inTulsa',
      { expiresIn: 2 * 3600 }
    );
    return token;
  }
  
  export const VerifyJwtToken = (token: string) => {
    try {
      const decode: any = jwt.decode(token);
      if (decode) {
        return decode;
      }
    } catch (error) {
      throw error;
    }
  }