import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const frameSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    strategyId: { type: Schema.Types.ObjectId, ref: "Strategy", required: true },
    order: { type: Number, required: true, min: 0 },
    kind: { type: String, enum: ["image", "tactical-scene"], required: true },
    attachmentId: { type: Schema.Types.ObjectId, ref: "StrategyAttachment", required: true },
    name: { type: String, trim: true, maxlength: 100 },
    // Normalized SceneDto for tactical-scene frames (bounded by the importer: <= 8 MiB).
    scene: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

frameSchema.index({ strategyId: 1, order: 1 });

export type FrameDoc = InferSchemaType<typeof frameSchema>;
export const StrategyFrame: Model<FrameDoc> =
  (models.StrategyFrame as Model<FrameDoc>) || model<FrameDoc>("StrategyFrame", frameSchema);
