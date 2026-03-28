import crypto from "node:crypto"

export const generateVerificationCode = () => {
    const code = crypto.randomInt(0,999999)
    return code.toString().padStart(6,'0')
}