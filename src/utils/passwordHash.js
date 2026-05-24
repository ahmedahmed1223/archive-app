import CryptoJS from "crypto-js";

export function hashPassword(password) {
  return CryptoJS.SHA256(password).toString();
}
