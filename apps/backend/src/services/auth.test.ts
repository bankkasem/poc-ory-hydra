import { expect, test } from "bun:test";
import { bearerTokenSchema, loginRequestSchema } from "../routes/auth.schemas";

const seedHash =
  "$argon2id$v=19$m=65536,t=2,p=1$B0OUKNzc/dDv9U6C7pdgQerpvC5jkNyWq794cR2a/I8$wzFaVFrCoVTk/5OqLvdbmlpxYGU+NBZhGCsUiImZzmI";

test("validates login credentials and verifies the stored hash", async () => {
  expect(
    loginRequestSchema.parse({
      loginChallenge: "login-challenge",
      phoneNumber: "0812345678",
      verificationCode: "123456",
    }),
  ).toEqual({
    loginChallenge: "login-challenge",
    phoneNumber: "0812345678",
    verificationCode: "123456",
  });
  expect(
    loginRequestSchema.safeParse({
      loginChallenge: "login-challenge",
      phoneNumber: "0812345678",
      verificationCode: "12345",
    }).success,
  ).toBe(false);
  expect(await Bun.password.verify("123456", seedHash)).toBe(true);
  expect(await Bun.password.verify("000000", seedHash)).toBe(false);
});

test("accepts only Bearer token credentials", () => {
  expect(bearerTokenSchema.parse("Bearer access-token")).toBe("access-token");
  expect(bearerTokenSchema.safeParse("Session id").success).toBe(false);
});
