import { expect, test } from "bun:test";
import { createCodeChallenge } from ".";

test("creates the RFC 7636 S256 code challenge", async () => {
  expect(
    await createCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
  ).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});
