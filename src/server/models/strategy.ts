import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { STRATEGY_SOURCES } from "@/types/strategy";

const strategySchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    folderId: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    source: { type: String, enum: STRATEGY_SOURCES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    mapId: { type: String, trim: true, maxlength: 40 },
    side: { type: String, enum: ["attack", "defense"] },
    tags: {
      type: [{ type: String, trim: true, maxlength: 30 }],
      validate: { validator: (v: string[]) => v.length <= 20, message: "Too many tags" },
      default: [],
    },
    // "processing" strategies are invisible to every query until the import completes.
    status: { type: String, enum: ["processing", "ready"], default: "processing" },
  },
  { timestamps: true },
);

// Scoped folder listing, newest first.
strategySchema.index({ workspaceId: 1, folderId: 1, status: 1, createdAt: -1 });

export type StrategyDoc = InferSchemaType<typeof strategySchema>;
export const Strategy: Model<StrategyDoc> =
  (models.Strategy as Model<StrategyDoc>) || model<StrategyDoc>("Strategy", strategySchema);
