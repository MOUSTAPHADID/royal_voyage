import "./load-env.js";
import { createEmployee, getEmployeeByEmail } from "../server/db";

async function main() {
  const email = "admin@royalvoyage.mr";
  const password = "Admin@2026";

  const existing = await getEmployeeByEmail(email);
  if (existing) {
    console.log("Admin already exists:");
    console.log(`  Email: ${existing.email}`);
    console.log(`  Name: ${existing.fullName}`);
    console.log(`  Role: ${existing.role}`);
    return;
  }

  const id = await createEmployee({
    fullName: "مدير النظام",
    email,
    password,
    role: "manager",
    department: "الإدارة",
    notes: "الحساب الافتراضي للمدير",
  });

  console.log(`✅ Admin created successfully!`);
  console.log(`  ID: ${id}`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Role: manager`);
}

main().catch(console.error).finally(() => process.exit(0));
