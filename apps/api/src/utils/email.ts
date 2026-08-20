// ============================================================
// DSATracker API — Email Utility
// Sends emails via SMTP or logs to console in development.
// ============================================================

import { env } from '../config/env.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email. In development without SMTP config, logs to console.
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  // For now, log to console. Replace with nodemailer/SendGrid in production.
  console.log(`\n📧 EMAIL SENT (${env.NODE_ENV}):`);
  console.log(`   To:      ${options.to}`);
  console.log(`   Subject: ${options.subject}`);
  console.log(`   Body:    ${options.html.substring(0, 200)}...`);
  console.log('');
}

/**
 * Build invitation email HTML.
 */
export function buildInvitationEmail(params: {
  name?: string;
  groupName: string;
  role: string;
  inviterName: string;
  inviteLink: string;
  expiresAt: Date;
}): { subject: string; html: string } {
  const subject = `You're invited to join ${params.groupName} on DSATracker`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#6366f1;">🏆 DSATracker Invitation</h2>
      <p>Hi ${params.name || 'there'},</p>
      <p><strong>${params.inviterName}</strong> has invited you to join
         <strong>${params.groupName}</strong> as a <strong>${params.role}</strong>.</p>
      <div style="margin:24px 0;">
        <a href="${params.inviteLink}"
           style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Accept Invitation
        </a>
      </div>
      <p style="color:#666;font-size:14px;">
        This invitation expires on ${params.expiresAt.toLocaleDateString()}.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#999;font-size:12px;">DSATracker — Competitive Programming Tracker</p>
    </div>
  `;
  return { subject, html };
}

/**
 * Build password reset email HTML.
 */
export function buildPasswordResetEmail(params: {
  name: string;
  resetLink: string;
}): { subject: string; html: string } {
  const subject = 'Reset your DSATracker password';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#6366f1;">🔐 Password Reset</h2>
      <p>Hi ${params.name},</p>
      <p>You requested a password reset. Click below to set a new password:</p>
      <div style="margin:24px 0;">
        <a href="${params.resetLink}"
           style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
      </div>
      <p style="color:#666;font-size:14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `;
  return { subject, html };
}
