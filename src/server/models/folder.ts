import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const folderSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    parentFolderId: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    name: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { timestamps: true },
);

// Scoped child listing + sibling-name uniqueness within a parent.
folderSchema.index({ workspaceId: 1, parentFolderId: 1, name: 1 }, { unique: true });

export type FolderDoc = InferSchemaType<typeof folderSchema>;
export const Folder: Model<FolderDoc> =
  (models.Folder as Model<FolderDoc>) || model<FolderDoc>("Folder", folderSchema);
