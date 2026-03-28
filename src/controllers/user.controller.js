import RefreshToken from "../models/refreshToken.js";
import User from "../models/User.js"
import { handleHttpError } from "../utils/handleError.js";
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from "../utils/handleJwt.js";
import { encrypt } from "../utils/handlePassword.js";
import { generateVerificationCode } from "../utils/handleVerificationCode.js";

export async function getUsers(req, res) {

    const users = await User.find().lean()
    res.status(200).json(users)

}

export async function registerUser(req, res) {
    
    try {
        let new_user = req.body
        const new_email = new_user.email;
        
        const foundUser = await User.findOne({email: new_email}).lean()

        if (foundUser) {
            handleHttpError(res,"ERROR: No se pudo registrar usuario",409)
            return
        }

        const hashed_pswd = await encrypt(new_user.password)
        new_user.password = hashed_pswd

        new_user.verificationCode = generateVerificationCode()
        new_user.verificationAttempts = 3

        const user = await User.create(new_user)

        const access_token = generateAccessToken(user)
        const refresh_token = generateRefreshToken()
        
        await RefreshToken.create({
            token: refresh_token,
            user: user._id,
            expiresAt: getRefreshTokenExpiry(),
            createdByIp: req.ip
        })
        
        res.status(201).json({
            email: user.email,
            status: user.status,
            role: user.role,
            accessToken: access_token,
            refreshToken: refresh_token
        })

    } catch (error) {
        console.log(error)
        handleHttpError(res,"ERROR: No se pudo registrar usuario",500)
    }

}