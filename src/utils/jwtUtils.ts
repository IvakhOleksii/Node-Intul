import jwt from 'jsonwebtoken';
import config from '../config';

export const CreateJwtToken = (email: string, user_id: string, role: string) => {
  const token = jwt.sign(
    {email, user_id, role},
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
    return null;
  } catch (error) {
    throw error;
  }
}