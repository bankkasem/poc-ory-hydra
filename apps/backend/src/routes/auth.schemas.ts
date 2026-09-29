import { z } from "zod";

export const loginRequestSchema = z.object({
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

export const consentRequestSchema = z.object({
  consentChallenge: z.string().trim().min(1),
});
