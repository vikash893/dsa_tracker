// ============================================================
// DSATracker API — AuditLog Mongoose Model
// ============================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import { AuditAction } from '@dsa-tracker/types';

export interface IAuditLogDoc extends Document {
  actorId: mongoose.Types.ObjectId;
  action: AuditAction;
  targetType?: string;
  targetId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDoc>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    targetType: { type: String },
    targetId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Index for time-based queries
auditLogSchema.index({ createdAt: -1 });

const AuditLog: Model<IAuditLogDoc> = mongoose.model<IAuditLogDoc>('AuditLog', auditLogSchema);

export default AuditLog;
