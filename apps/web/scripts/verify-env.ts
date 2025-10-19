import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.url().min(1, "API URL cannot be empty"),
  VITE_APP_NAME: z.string().min(1),
  MODE: z.enum(["development", "production", "test"]),
});

try {
  envSchema.parse(import.meta.env);
  console.log("✅ Environment variables validated successfully");
} catch (error) {
  console.error("❌ Environment validation failed:");
  console.error(error);
  process.exit(1);
}
