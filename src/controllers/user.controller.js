import RefreshToken from "../models/refreshToken.js";
import User from "../models/User.js"
import { handleHttpError } from "../utils/handleError.js";
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from "../utils/handleJwt.js";
import { compare, encrypt } from "../utils/handlePassword.js";
import { generateVerificationCode } from "../utils/handleVerificationCode.js";
import { userValidateSchema } from "../validators/user.validator.js";

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
        handleHttpError(res,"ERROR: No se pudo registrar usuario",500)
    }

}

export async function validateEmail(req, res) {

    try {
        
        const { verificationCode } = req.body;

        const user = req.user

        if (user.status === 'verified') {
            handleHttpError(res, 'Usuario ya verificado', 400)
        }

        if (user.verificationCode !== verificationCode) {

            const attempts = user.verificationAttempts - 1 < 0 ? 0 : user.verificationAttempts - 1;

            if (attempts <= 0) {
                handleHttpError(res, "ERROR: Se han agotado los intentos de validación", 429)
            } else {
                handleHttpError(res,"ERROR: No se pudo validar email",400)
            }
            await User.findByIdAndUpdate(user._id, {verificationAttempts: attempts},{runValidators: true})
            return
        }

        await User.findByIdAndUpdate(user._id, {status: 'verified'}, {runValidators: true})
        res.status(200).json()

    } catch (error) {
        console.log(error)
        handleHttpError(res,"ERROR: No se pudo registrar usuario",500)
    }

}

export async function loginUser(req,res) {

    try {

        const { email, password } = req.body

        const user = await User.findOne({email: email})

        if (!user) {
            return handleHttpError(res,"Usuario no registrado",404)
        }

        const match = await compare(password, user.password)

        if (!match) {
            return handleHttpError(res,"Login Incorrecto",401)
        }

        const access_token = generateAccessToken(user)
        
        const refresh_token_found = await RefreshToken.findOne({user: user._id, revokedAt: null})

        if (refresh_token_found) {
            refresh_token_found.revokedAt = new Date()
            refresh_token_found.revokedByIp = req.ip
            await refresh_token_found.save()
        }
        
        const refresh_token = generateRefreshToken()

        await RefreshToken.create({
            token: refresh_token,
            user: user._id,
            expiresAt: getRefreshTokenExpiry(),
            createdByIp: req.ip
        })

        res.status(200).json({
            user: user, 
            accessToken: access_token,
            refreshToken: refresh_token
        })

    } catch (error) {
        console.log(error)
        handleHttpError(res,"ERROR: No se hacer login",500)
    }

}