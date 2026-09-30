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

export const loginChallengeSchema = z.object({
  loginChallenge: z.string().trim().min(1),
});

export const consentRequestSchema = z.object({
  consentChallenge: z.string().trim().min(1),
});

export const oauthSessionSchema = z.object({
  clientId: z.string().trim().min(1),
  code: z.string().trim().min(1),
  codeVerifier: z.string().min(43).max(128),
  redirectUri: z.string().url(),
});

export const sessionAuthorizationSchema = z
  .string()
  .regex(/^Session [0-9a-f-]{36}$/i)
  .transform((value) => value.slice(value.indexOf(" ") + 1));
