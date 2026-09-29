import { findUserByPhone } from "../database/users";

export type LoginInput = {
  phoneNumber: string;
  verificationCode: string;
};

export function parseLoginInput(value: unknown): LoginInput | null {
  if (typeof value !== "object" || value === null) return null;

  const { phoneNumber, verificationCode } = value as Record<string, unknown>;
  if (typeof phoneNumber !== "string" || typeof verificationCode !== "string")
    return null;

  const input = {
    phoneNumber: phoneNumber.trim(),
    verificationCode: verificationCode.trim(),
  };

  if (
    !/^\+?\d{9,15}$/.test(input.phoneNumber) ||
    !/^\d{6}$/.test(input.verificationCode)
  )
    return null;
  return input;
}

export function verifyCode(code: string, hash: string) {
  return Bun.password.verify(code, hash);
}

export async function authenticateUser(input: LoginInput) {
  const user = await findUserByPhone(input.phoneNumber);
  if (
    !user ||
    !(await verifyCode(input.verificationCode, user.verificationCodeHash))
  )
    return null;

  return { id: user.id, phoneNumber: user.phoneNumber };
}
