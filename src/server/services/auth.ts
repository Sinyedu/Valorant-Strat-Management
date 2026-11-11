import "server-only";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/server/db/mongoose";
import { User } from "@/server/models/user";
import { Workspace } from "@/server/models/workspace";
import { signupSchema } from "@/lib/validation/auth";

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown so response time doesn't reveal accounts.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

export class SignupError extends Error {}

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  workspaceId: string;
};

export async function registerUser(input: unknown): Promise<void> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) throw new SignupError(parsed.error.issues[0].message);
  const { email, password, name } = parsed.data;

  await connectToDatabase();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  let userId;
  try {
    const user = await User.create({ email, passwordHash, name });
    userId = user._id;
  } catch (e) {
    if ((e as { code?: number }).code === 11000) {
      throw new SignupError("An account with that email already exists");
    }
    throw e;
  }
  try {
    await Workspace.create({ ownerId: userId, name: "Personal" });
  } catch (e) {
    await User.deleteOne({ _id: userId }); // no orphaned user without a workspace
    throw e;
  }
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  await connectToDatabase();
  const user = await User.findOne({ email }).lean();
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return null;
  const workspace = await Workspace.findOne({ ownerId: user._id })
    .select("_id")
    .lean();
  if (!workspace) return null;
  return {
    id: String(user._id),
    email: user.email,
    name: user.name ?? undefined,
    workspaceId: String(workspace._id),
  };
}
