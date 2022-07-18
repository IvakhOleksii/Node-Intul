import path from 'path';
import ejs from 'ejs';
import sendgrid from '@sendgrid/mail';
import config from '../config';

export const sendEmail = async (to: string|string[], subject: string, template: string, data: any) => {
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

export const sendCandidatesToEmployers = async (candidates: string[], employers_emails: string[]) => {
  try {
    await sendEmail(employers_emails, 'List of candidates', 'list-of-candidates', {
      candidates: candidates,
    });
    return true;
  } catch (error: any) {
    console.log('Error during sending candidates list to employers');
    console.log(error);
    console.log(JSON.stringify(error.response.body));
    throw error;
  }
}

export const sendNewUserNotification = async (to: string, name: string) => {
  try {
    const base_url = process.env.FRONTEND_URL || 'http://localhost:3000';
    await sendEmail(to, 'Welcome to inTulsa!', 'new-user-notification', {
      name: name,
      url: `${base_url}/login`
    });
    return true;
  } catch (error: any) {
    console.log('Error during sending new user notification');
    console.log(error);
    console.log(JSON.stringify(error.response.body));
    throw error;
  }
}

export const sendJobsToCandidates = async (jobs: string[], candidates_emails: string[]) => {
  try {
    await sendEmail(candidates_emails, 'List of jobs', 'list-of-jobs', {
      jobs: jobs,
    });
    return true;
  } catch (error: any) {
    console.log('Error during sending jobs list to candidates');
    console.log(error);
    console.log(JSON.stringify(error.response.body));
    throw error;
  }
}

export const sendUpdateUserNotification = async (to: string, name: string) => {
  try {
    const base_url = process.env.FRONTEND_URL || 'http://localhost:3000';
    await sendEmail(to, 'Your account has been updated!', 'update-user-notification', {
      name: name,
      url: `${base_url}/login`
    });
    return true;
  } catch (error: any) {
    console.log('Error during sending update user notification');
    console.log(error);
    console.log(JSON.stringify(error.response.body));
    throw error;
  }
}

export const sendJobApplyNotification = async (to: string, name: string) => {
  try {
    const base_url = process.env.FRONTEND_URL || 'http://localhost:3000';
    await sendEmail(to, 'Job has been applied!', 'apply-job-notification', {
      name: name,
      url: `${base_url}/login`
    });
    return true;
  } catch (error: any) {
    console.log('Error during sending apply job notification');
    console.log(error);
    console.log(JSON.stringify(error.response.body));
    throw error;
  }
};

export const sendEmailJobAlertToUser = async (to: string, name: string, jobs: string[]) => {
  try {
    await sendEmail(to, 'New jobs for you from inTulsa', 'job-alert', {
      name: name,
      jobs: jobs,
    });
    return true;
  } catch (error: any) {
    console.log('Error during sending job alert');
    console.log(error);
    console.log(JSON.stringify(error.response.body));
    throw error;
  }
}

