import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
  }

  async sendVerificationEmail(email: string, verificationCode: string, username: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Wavely Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3c70bb; margin: 0;">Wavely</h1>
              <p style="color: #666; margin: 5px 0;">Welcome to the Wave!</p>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Hi ${username}! 👋</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Thanks for signing up! To complete your registration, please verify your email address using the code below:
              </p>

              <div style="background-color: white; border: 2px dashed #3c70bb; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <h1 style="color: #3c70bb; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${verificationCode}
                </h1>
              </div>

              <p style="color: #999; font-size: 14px; margin-top: 20px;">
                This code will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
              </p>
            </div>

            <div style="text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>© 2025 Wavely. All rights reserved.</p>
              <p>Lock it with Locket 🔒</p>
            </div>
          </div>
        `,
      });

      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, username: string): Promise<void> {
    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${resetToken}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your Wavely Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3c70bb; margin: 0;">Wavely</h1>
              <p style="color: #666; margin: 5px 0;">Password Reset Request</p>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Hi ${username},</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="display: inline-block; background-color: #3c70bb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #3c70bb; font-size: 14px; word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
                ${resetLink}
              </p>

              <p style="color: #999; font-size: 14px; margin-top: 20px;">
                This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
              </p>
            </div>

            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Security tip:</strong> Never share your password with anyone. Wavely will never ask for your password via email.
              </p>
            </div>

            <div style="text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>© 2025 Wavely. All rights reserved.</p>
              <p>Lock it with Locket 🔒</p>
            </div>
          </div>
        `,
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to Wavely! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3c70bb; margin: 0;">Wavely</h1>
              <p style="color: #666; margin: 5px 0;">Ride the Wave!</p>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Welcome to Wavely, ${username}! 🎊</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                We're excited to have you on board! Your account is now verified and ready to go.
              </p>

              <h3 style="color: #333; margin-top: 25px;">What's next?</h3>
              <ul style="color: #666; font-size: 15px; line-height: 1.8;">
                <li>Complete your profile and add a profile picture</li>
                <li>Start creating waves and sharing your experiences</li>
                <li>Discover content from other users</li>
                <li>Connect with friends and follow interesting creators</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.frontendUrl}/dashboard" style="display: inline-block; background-color: #3c70bb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Get Started
                </a>
              </div>
            </div>

            <div style="text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee;">
              <p>© 2025 Wavely. All rights reserved.</p>
              <p>Lock it with Locket 🔒</p>
            </div>
          </div>
        `,
      });

      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      // Don't throw error for welcome emails - they're not critical
    }
  }
}
