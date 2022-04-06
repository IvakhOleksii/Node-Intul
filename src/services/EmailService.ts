import path from 'path';
import ejs from 'ejs';
import sendgrid from '@sendgrid/mail';
import config from '../config';

export const sendEmail = async (to: string, subject: string, template: string, data: any) => {
  sendgrid.setApiKey(config.sendgridSecret || '');
  const from = config.mailSenderEmail || "donnie@aerovision.io";
  const html = await ejs.renderFile<string>(path.join(__dirname, `../templates/${template}.ejs`), data);
  let message = { from, to, subject, html };
  const msg = { ...message, text: 'iDENTIFY'};

  try {
      await sendgrid.send(msg);
  } catch (error) {
      console.log(error);
      throw error;
  }
};

export const sendVerification = async (to: string, name: string) => {
  try {
    const base_url = config.frontendUrl || 'http://localhost:3000';
    await sendEmail(to, 'Welcome to inTulsa!', 'register-verification', {
      url: `${base_url}/verify`,
      firstName: name,
    });
    return true;
  } catch (error: any) {
    console.log('Error during sending invitation');
    console.log(error);
    console.log(JSON.stringify(error.response.body));
    throw error;
  }
}

export const sendResetPassword = async (to: string, name: string, token: string) => {
  try {
    const base_url = process.env.FRONTEND_URL || 'http://localhost:3000';
    await sendEmail(to, 'Reset your password!', 'reset-password', {
      url: `${base_url}/reset-password?token=${token}`,
      name: name,
    });
    return true;
  } catch (error: any) {
    console.log('Error during sending invitation');
    console.log(error);
    console.log(JSON.stringify(error.response.body));
    throw error;
  }
}