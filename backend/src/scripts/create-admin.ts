/**
 * Create a new staff user or promote an existing user to admin/owner.
 *
 * Usage:
 *   npm run create-admin -- --email you@example.com --password 'your-secure-password'
 *   npm run create-admin -- --email you@example.com --role owner --name "Site Owner"
 *   npm run create-admin -- --promote you@example.com --role admin
 *
 * Password can be passed via env instead of argv (avoids shell history):
 *   ADMIN_PASSWORD='…' npm run create-admin -- --email you@example.com
 */
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema/user.js";
import { hashPassword } from "../services/auth.js";

const roleEnum = z.enum(["admin", "owner"]);

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      out.help = true;
      continue;
    }
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function printHelp(): void {
  console.log(`create-admin - create or promote a staff user (admin / owner)

Create new user:
  npm run create-admin -- --email <email> --password <password> [--name <name>] [--role admin|owner]

Promote existing user:
  npm run create-admin -- --promote --email <email> [--role admin|owner]

Environment:
  ADMIN_PASSWORD   password for create mode (optional alternative to --password)

Defaults: --role admin
`);
}

async function main() {
  const raw = parseArgs(process.argv.slice(2));

  if (raw.help) {
    printHelp();
    process.exit(0);
  }

  const emailRaw = typeof raw.email === "string" ? raw.email.trim() : "";
  const emailParsed = z.string().email().safeParse(emailRaw);
  if (!emailParsed.success) {
    console.error("Error: valid --email is required.");
    printHelp();
    process.exit(1);
  }
  const email = emailParsed.data;

  const promote = raw.promote === true;
  const roleResult = roleEnum.safeParse(typeof raw.role === "string" ? raw.role : "admin");
  if (!roleResult.success) {
    console.error("Error: --role must be admin or owner.");
    process.exit(1);
  }
  const role = roleResult.data;

  if (promote) {
    const [existing] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.email, email)).limit(1);
    if (!existing) {
      console.error(`No user found with email ${email}. Create an account first or use create mode without --promote.`);
      process.exit(1);
    }
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, existing.id));
    console.log(`Updated ${email}: role is now "${role}" (was "${existing.role}").`);
    process.exit(0);
  }

  const password =
    (typeof raw.password === "string" && raw.password.length > 0 ? raw.password : null) ??
    (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0 ? process.env.ADMIN_PASSWORD : null);
  if (!password || password.length < 8) {
    console.error("Error: password required (min 8 characters). Use --password or ADMIN_PASSWORD env.");
    process.exit(1);
  }

  const [duplicate] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (duplicate) {
    console.error(`User ${email} already exists. Use --promote to change their role.`);
    process.exit(1);
  }

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash,
      role,
      emailVerified: false,
    })
    .returning({ id: users.id, email: users.email, role: users.role });

  console.log(`Created staff user ${created.email} with role "${created.role}" (id ${created.id}).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("create-admin failed:", err);
  process.exit(1);
});
