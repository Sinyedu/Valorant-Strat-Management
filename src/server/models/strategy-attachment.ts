import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// Metadata only: the original bytes live in private object storage under objectKey.
const attachmentSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    strategyId: { type: Schema.Types.ObjectId, ref: "Strategy", required: true, index: true },
    objectKey: { type: String, required: true, unique: true },
    originalName: { type: String, required: true, maxlength: 200 },
    contentType: { type: String, required: true, maxlength: 100 },
    size: { type: Number, required: true, min: 0 },
    sha256: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  },
  { timestamps: true },
);

export type AttachmentDoc = InferSchemaType<typeof attachmentSchema>;
export const StrategyAttachment: Model<AttachmentDoc> =
  (models.StrategyAttachment as Model<AttachmentDoc>) ||
  model<AttachmentDoc>("StrategyAttachment", attachmentSchema);
