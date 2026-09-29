import { findUserByPhone } from "./database/users";

type LoginCredentials = {
  phoneNumber: string;
  verificationCode: string;
};

export async function authenticateUser(input: LoginCredentials) {
  const user = await findUserByPhone(input.phoneNumber);
  if (
    !user ||
    !(await Bun.password.verify(
      input.verificationCode,
      user.verificationCodeHash,
    ))
  )
    return null;

  return { id: user.id, phoneNumber: user.phoneNumber };
}
