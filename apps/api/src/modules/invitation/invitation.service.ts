// ============================================================
// DSATracker API — Invitation Service
// ============================================================

import crypto from 'crypto';
import Invitation from '../../models/Invitation.js';
import Group from '../../models/Group.js';
import GroupMember from '../../models/GroupMember.js';
import User from '../../models/User.js';
import AuditLog from '../../models/AuditLog.js';
import { AppError } from '../../utils/AppError.js';
import { hashPassword } from '../../utils/password.js';
import { sendEmail, buildInvitationEmail } from '../../utils/email.js';
import { env } from '../../config/env.js';
import { TOKEN_CONFIG } from '../../config/constants.js';
import { AuditAction, InvitationStatus, GroupRole, Role } from '@dsa-tracker/types';
import type { CreateInvitationInput, AcceptInvitationInput } from './invitation.validation.js';
import type { IUserDoc } from '../../models/User.js';
import { PAGINATION } from '../../config/constants.js';

export class InvitationService {
  async create(data: CreateInvitationInput, user: IUserDoc) {
    // Verify group exists
    const group = await Group.findById(data.groupId);
    if (!group) throw AppError.notFound('Group not found');

    // Check for existing pending invitation
    const existing = await Invitation.findOne({
      email: data.email,
      groupId: data.groupId,
      status: InvitationStatus.PENDING,
    });
    if (existing) throw AppError.conflict('A pending invitation already exists for this email in this group');

    // Check if user is already a member
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      const isMember = await GroupMember.findOne({ groupId: data.groupId, userId: existingUser._id });
      if (isMember) throw AppError.conflict('User is already a member of this group');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_CONFIG.INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await Invitation.create({
      email: data.email,
      name: data.name,
      role: data.role === 'ADMIN' ? Role.ADMIN : Role.USER,
      groupId: data.groupId,
      invitedBy: user._id,
      token,
      profileUrls: data.profileUrls,
      expiresAt,
    });

    // Send invitation email
    const inviteLink = `${env.FRONTEND_URL}/invite/${token}`;
    const { subject, html } = buildInvitationEmail({
      name: data.name,
      groupName: group.name,
      role: data.role || 'USER',
      inviterName: `${user.firstName} ${user.lastName}`,
      inviteLink,
      expiresAt,
    });
    await sendEmail({ to: data.email, subject, html });

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.INVITATION_CREATED,
      targetType: 'Invitation',
      targetId: invitation._id,
      metadata: { email: data.email, groupId: data.groupId, role: data.role },
    });

    return invitation;
  }

  async list(user: IUserDoc, page = 1, limit = PAGINATION.DEFAULT_LIMIT, groupId?: string) {
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};

    if (groupId) filter.groupId = groupId;
    // Non-super-admins see only their own invitations
    if (user.role !== Role.SUPER_ADMIN) filter.invitedBy = user._id;

    const [invitations, total] = await Promise.all([
      Invitation.find(filter)
        .populate('groupId', 'name code')
        .populate('invitedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invitation.countDocuments(filter),
    ]);

    return {
      data: invitations,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async getByToken(token: string) {
    const invitation = await Invitation.findOne({ token })
      .populate('groupId', 'name description')
      .populate('invitedBy', 'firstName lastName');

    if (!invitation) throw AppError.notFound('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw AppError.badRequest(`Invitation has already been ${invitation.status.toLowerCase()}`);
    }
    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await invitation.save();
      throw AppError.badRequest('Invitation has expired');
    }

    return invitation;
  }

  async accept(token: string, data: AcceptInvitationInput) {
    const invitation = await this.getByToken(token);

    // Check if user already exists
    let user = await User.findOne({ email: invitation.email });

    if (user) {
      // Existing user — just add to group
      const isMember = await GroupMember.findOne({ groupId: invitation.groupId, userId: user._id });
      if (isMember) throw AppError.conflict('You are already a member of this group');
    } else {
      // New user — create account
      const passwordHash = await hashPassword(data.password);
      user = await User.create({
        email: invitation.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: `${data.firstName} ${data.lastName}`,
        role: invitation.role,
        isEmailVerified: true, // Invited users are pre-verified
      });
    }

    // Add to group
    await GroupMember.create({
      groupId: invitation.groupId,
      userId: user._id,
      role: invitation.role === Role.ADMIN ? GroupRole.ADMIN : GroupRole.MEMBER,
    });

    // Update invitation status
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    await invitation.save();

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.INVITATION_ACCEPTED,
      targetType: 'Invitation',
      targetId: invitation._id,
      metadata: { groupId: invitation.groupId.toString() },
    });

    return { user, invitation };
  }

  async revoke(invitationId: string, user: IUserDoc) {
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) throw AppError.notFound('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw AppError.badRequest('Only pending invitations can be revoked');
    }

    invitation.status = InvitationStatus.REVOKED;
    await invitation.save();

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.INVITATION_REVOKED,
      targetType: 'Invitation',
      targetId: invitation._id,
    });
  }
}

export const invitationService = new InvitationService();
