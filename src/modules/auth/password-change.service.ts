import { verifyPassword, hashPassword } from "../../crypto/password";
import { validatePassword } from "./password.policy";
import { findUserById, updatePasswordHash } from "./user.repo";
import { resetFailedAttempts } from "./user.repo";


export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string
) {

  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  
  const isOldPasswordValid = await verifyPassword(
    oldPassword,
    user.password_hash
  );

  if (!isOldPasswordValid) {
    throw new Error("Invalid credentials");
  }

  
  validatePassword(newPassword);

 
  const newPasswordHash = await hashPassword(newPassword);
   await updatePasswordHash(userId, newPasswordHash);
   await resetFailedAttempts(userId);
}


