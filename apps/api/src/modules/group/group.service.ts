// ============================================================
// DSATracker API — Group Service
// ============================================================

import Group, { IGroupDoc } from '../../models/Group.js';
import GroupMember from '../../models/GroupMember.js';
import AuditLog from '../../models/AuditLog.js';
import { AppError } from '../../utils/AppError.js';
import { AuditAction, GroupRole, Role } from '@dsa-tracker/types';
import { PAGINATION } from '../../config/constants.js';
import type { CreateGroupInput, UpdateGroupInput } from './group.validation.js';
import type { IUserDoc } from '../../models/User.js';

export class GroupService {
  async create(data: CreateGroupInput, user: IUserDoc): Promise<IGroupDoc> {
    const group = await Group.create({
      ...data,
      createdBy: user._id,
    });

    // Creator is auto-added as ADMIN member
    await GroupMember.create({
      groupId: group._id,
      userId: user._id,
      role: GroupRole.ADMIN,
    });

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.GROUP_CREATED,
      targetType: 'Group',
      targetId: group._id,
      metadata: { name: group.name, code: group.code },
    });

    return group;
  }

  async list(userId: string, userRole: string, page = 1, limit = PAGINATION.DEFAULT_LIMIT) {
    const skip = (page - 1) * limit;

    // Super admins see all groups; others see only their groups
    let groupIds: string[] | undefined;
    if (userRole !== Role.SUPER_ADMIN) {
      const memberships = await GroupMember.find({ userId }).select('groupId');
      groupIds = memberships.map((m) => m.groupId.toString());
    }

    const filter: Record<string, unknown> = {};
    if (groupIds) filter._id = { $in: groupIds };

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Group.countDocuments(filter),
    ]);

    // Attach member counts
    const enriched = await Promise.all(
      groups.map(async (g) => {
        const memberCount = await GroupMember.countDocuments({ groupId: g._id });
        return { ...g.toJSON(), memberCount };
      }),
    );

    return {
      data: enriched,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async getById(groupId: string, userId: string, userRole: string) {
    const group = await Group.findById(groupId).populate('createdBy', 'firstName lastName email');
    if (!group) throw AppError.notFound('Group not found');

    // Check membership unless super admin
    if (userRole !== Role.SUPER_ADMIN) {
      const membership = await GroupMember.findOne({ groupId, userId });
      if (!membership) throw AppError.forbidden('You are not a member of this group');
    }

    const members = await GroupMember.find({ groupId })
      .populate('userId', 'firstName lastName email avatar role xp level currentStreak');

    const memberCount = members.length;

    return { ...group.toJSON(), members, memberCount };
  }

  async update(groupId: string, data: UpdateGroupInput, user: IUserDoc) {
    const group = await Group.findById(groupId);
    if (!group) throw AppError.notFound('Group not found');

    await this.verifyGroupAdmin(groupId, user);

    const updated = await Group.findByIdAndUpdate(groupId, data, { new: true, runValidators: true });

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.GROUP_UPDATED,
      targetType: 'Group',
      targetId: groupId,
      metadata: data,
    });

    return updated;
  }

  async delete(groupId: string, user: IUserDoc) {
    const group = await Group.findById(groupId);
    if (!group) throw AppError.notFound('Group not found');

    await this.verifyGroupAdmin(groupId, user);

    group.isActive = false;
    await group.save();

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.GROUP_DELETED,
      targetType: 'Group',
      targetId: groupId,
    });
  }

  async addMember(groupId: string, targetUserId: string, role: GroupRole, user: IUserDoc) {
    const group = await Group.findById(groupId);
    if (!group) throw AppError.notFound('Group not found');

    await this.verifyGroupAdmin(groupId, user);

    const memberCount = await GroupMember.countDocuments({ groupId });
    if (memberCount >= group.maxMembers) {
      throw AppError.badRequest('Group has reached maximum member capacity');
    }

    const existing = await GroupMember.findOne({ groupId, userId: targetUserId });
    if (existing) throw AppError.conflict('User is already a member of this group');

    const member = await GroupMember.create({
      groupId,
      userId: targetUserId,
      role: role || GroupRole.MEMBER,
    });

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.MEMBER_ADDED,
      targetType: 'GroupMember',
      targetId: member._id,
      metadata: { groupId, userId: targetUserId, role },
    });

    return member;
  }

  async removeMember(groupId: string, targetUserId: string, user: IUserDoc) {
    await this.verifyGroupAdmin(groupId, user);

    // Cannot remove yourself if you're the only admin
    if (targetUserId === user._id.toString()) {
      const adminCount = await GroupMember.countDocuments({ groupId, role: GroupRole.ADMIN });
      if (adminCount <= 1) {
        throw AppError.badRequest('Cannot remove the last admin from the group');
      }
    }

    const member = await GroupMember.findOneAndDelete({ groupId, userId: targetUserId });
    if (!member) throw AppError.notFound('Member not found in this group');

    await AuditLog.create({
      actorId: user._id,
      action: AuditAction.MEMBER_REMOVED,
      targetType: 'GroupMember',
      targetId: member._id,
      metadata: { groupId, userId: targetUserId },
    });
  }

  private async verifyGroupAdmin(groupId: string, user: IUserDoc) {
    if (user.role === Role.SUPER_ADMIN) return;

    const membership = await GroupMember.findOne({ groupId, userId: user._id });
    if (!membership || membership.role !== GroupRole.ADMIN) {
      throw AppError.forbidden('You must be a group admin to perform this action');
    }
  }
}

export const groupService = new GroupService();
