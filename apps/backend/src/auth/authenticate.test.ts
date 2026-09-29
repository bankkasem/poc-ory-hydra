import { expect, test } from "bun:test";
import { parseLoginInput, verifyCode } from "./authenticate";

const seedHash =
  "$argon2id$v=19$m=65536,t=2,p=1$B0OUKNzc/dDv9U6C7pdgQerpvC5jkNyWq794cR2a/I8$wzFaVFrCoVTk/5OqLvdbmlpxYGU+NBZhGCsUiImZzmI";

test("validates login credentials and verifies the stored hash", async () => {
  expect(
    parseLoginInput({
      phoneNumber: "0812345678",
      verificationCode: "123456",
    }),
  ).toEqual({
    phoneNumber: "0812345678",
    verificationCode: "123456",
  });
  expect(
    parseLoginInput({ phoneNumber: "0812345678", verificationCode: "12345" }),
  ).toBeNull();
  expect(await verifyCode("123456", seedHash)).toBe(true);
  expect(await verifyCode("000000", seedHash)).toBe(false);
});
