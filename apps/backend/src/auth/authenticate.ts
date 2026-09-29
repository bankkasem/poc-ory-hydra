import { z } from "zod";
import { findUserByPhone } from "../database/users";

const loginRequestSchema = z.object({
  loginChallenge: z.string().trim().min(1),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\+?\d{9,15}$/),
  verificationCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export function parseLoginRequest(value: unknown) {
  const result = loginRequestSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function verifyCode(code: string, hash: string) {
  return Bun.password.verify(code, hash);
}

export async function authenticateUser(input: LoginRequest) {
  const user = await findUserByPhone(input.phoneNumber);
  if (
    !user ||
    !(await verifyCode(input.verificationCode, user.verificationCodeHash))
  )
    return null;

  return { id: user.id, phoneNumber: user.phoneNumber };
}
