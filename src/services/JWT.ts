import jwt from 'jsonwebtoken';

export const CreateJwtToken = (email: string) => {
    const token = jwt.sign(
      {email},
      process.env.AUTH_SECRET || 'inTulsa',
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