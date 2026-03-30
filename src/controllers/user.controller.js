import Company from "../models/Company.js";
import RefreshToken from "../models/refreshToken.js";
import User from "../models/User.js"
import ee from "../services/notification.service.js";
import { handleHttpError } from "../utils/handleError.js";
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from "../utils/handleJwt.js";
import { compare, encrypt } from "../utils/handlePassword.js";
import { generateVerificationCode } from "../utils/handleVerificationCode.js";

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
        console.error(error)
        handleHttpError(res,"ERROR: No se pudo registrar usuario",500)
    }

}

export async function validateEmail(req, res) {

    try {
        
        const { verificationCode } = req.body;

        const user = req.user

        if (user.status === 'verified') {
            return handleHttpError(res, 'Usuario ya verificado', 400)
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
        res.status(200).json({message: "Email Validado"})

    } catch (error) {
        console.error(error)
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
        console.error(error)
        handleHttpError(res,"ERROR: No se hacer login",500)
    }

}

export async function loadUserData(req, res) {
     
    try {

        const { name, lastName, nif } = req.body

        await User.findByIdAndUpdate(
            req.user._id,
            {
                name: name,
                lastName: lastName,
                nif: nif
            },
            {runValidators: true}
        )

        res.status(200).json({message: "Onboarding de Usuario completado"})

    } catch (error) {
        console.error(error)
        handleHttpError(res,"ERROR: No se hacer login",500)
    }

}

export async function loadCompanyData(req, res) {

    try {

        const user = req.user

        if (user.company) {
            return handleHttpError(res, "No se pudo crear compañia", 400)
        }

        const {name, cif, address, isFreelance} = req.body

        const companyStored = await Company.findOne({cif: cif})

        if (!companyStored) {

            let company = null

            if (isFreelance) {
                company = await Company.create(
                    {
                        owner: user._id,
                        name: user.name,
                        cif: user.nif,
                        address: user?.address || address 
                    }
                )
            } else {
                company = await Company.create(
                    {
                        owner: user._id,
                        name: name,
                        cif: cif,
                        address: address
                    }
                )
            }

            await User.findByIdAndUpdate(
                user._id,
                {company: company._id, role: 'admin'},
                {runValidators: true}
            )

        } else {
            await User.findByIdAndUpdate(
                user._id,
                { company: companyStored._id, role: 'guest' },
                { runValidators: true }
            )
        }

        res.status(200).json({message: "Onboarding de la compañia completado"})

    } catch (error) {
        console.error(error)
        handleHttpError(res,"ERROR: No se hacer login",500)
    }

}

export async function uploadLogo(req, res) {
    try {

        const user = req.user

        if (!user.company) {
            return handleHttpError(res, 'Usuario noo tiene compañia', 400)
        }

        if (!req.file) {
            return handleHttpError(res, 'No se ha subido ningun archivo', 400)
        }

        const uploadPath = `${process.env.PUBLIC_URI}/uploads/${req.file.filename}`

        await Company.findByIdAndUpdate(
            user.company,
            {logo: uploadPath},
            {runValidators: true}
        )

        res.status(201).json({message: "Logo Actualizado"})

    } catch (error) {
        console.error(error)
        handleHttpError(res,"ERROR: No se hacer login",500)
    }
}

export async function getUser(req, res) {

    try {

        const user = await User.findById(req.user._id).populate('company')
        return res.status(200).json(user)

    }  catch (error) {
        console.error(error)
        handleHttpError(res,"ERROR: No se hacer login",500)
    }

}

export async function refreshAccessToken(req, res) {
    
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return handleHttpError(res, "Falta refreshToken", 400)
        }

        const storedToken = await RefreshToken.findOne({token: refreshToken}).populate('user')

        if (!storedToken || !storedToken.isActive()) {
            return handleHttpError(res,"Refresh Token Expirado o Invalido", 401)
        }

        const accessToken = generateAccessToken(storedToken.user)

        res.status(200).json({accessToken})
    } catch (error) {
        console.error(error)
        handleHttpError(res,"ERROR: No se hacer login",500)
    }

}

export async function logout(req, res) {

    try {

        await RefreshToken.updateMany(
            {user: req.user._id, revokedAt: null},
            {revokedAt: new Date(), revokedByIp: req.ip}
        )

        res.status(200).json({message: "Logout Completado"})

    } catch (error) {
        console.error(error)
        handleHttpError(res,"ERROR: No se hacer login",500)
    }

}

export async function deleteUser(req, res) {
    try {

        const softDelete = req.query.soft === 'true'

        if (softDelete) {
            await User.softDeleteById(req.user._id, req.user._id)
        } else {
            await User.findByIdAndDelete(req.user._id)
        }

        res.status(200).json({message: "Usuario Borrado con Exito"})

    } catch (error) {
        console.error(error)
        handleHttpError(res,"ERROR: No se hacer login",500)
    }
}

export async function changePwd(req, res) {

    try {

        const user = req.user
        const { oldPassword, newPassword } = req.body

        const match = await compare(oldPassword, user.password)

        if (!match) {
            return handleHttpError(res, 'La contraseña actual no es correcta', 400)
        }

        const hashedPwd = await encrypt(newPassword)

        await User.findByIdAndUpdate(
            user._id,
            {password: hashedPwd},
            {runValidators: true}
        )

        res.status(200).json({message: "Contraseña Cambiada Con Exito"})

    } catch (error) {
        console.error(error)
        handleHttpError(res,"ERROR: No se hacer login",500)
    }

}

export async function inviteUser(req, res) {

    try {

        const user = req.user
        const { email, password } = req.body

        if (!user.company) {
            return handleHttpError(res,'El usuario no tiene una compañia asignada', 400) 
        }

        const existingGuest = await User.findOne({email: email})

        if (existingGuest) {
            return handleHttpError(res, 'Invitado ya Registrado', 409)
        }

        const hashedPwd = await encrypt(password)

        const guest = await User.create({
            email: email,
            password: hashedPwd,
            company: user.company,
            role: 'guest'
        })

        ee.emit('user:invited', email)

        res.status(201).json({message: "Usuario Invitado"})

    } catch (error) {
        console.error(error)
        handleHttpError(res,"ERROR: No se pudo invitar usuario",500)
    }

}