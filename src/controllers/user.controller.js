import Company from "../models/Company.js";
import RefreshToken from "../models/refreshToken.js";
import User from "../models/User.js"
import ee from "../services/notification.service.js";
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from "../utils/handleJwt.js";
import { compare, encrypt } from "../utils/handlePassword.js";
import { generateVerificationCode } from "../utils/handleVerificationCode.js";
import { AppError } from "../utils/AppError.js";

export async function registerUser(req, res, next) {
    
    try {
        let new_user = req.body
        const new_email = new_user.email;
        
        const foundUser = await User.findOne({email: new_email}).lean()

        if (foundUser) {
            throw AppError.conflict('Email ya Registrado')
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
        
        ee.emit('user:registered', user.email)

        res.status(201).json({
            email: user.email,
            status: user.status,
            role: user.role,
            accessToken: access_token,
            refreshToken: refresh_token
        })

    } catch (error) {
        next(error)
    }

}

export async function validateEmail(req, res, next) {

    try {
        
        const { verificationCode } = req.body;

        const user = req.user

        if (user.status === 'verified') {
            throw AppError.badRequest('Usuario ya verificado')
        }

        if (user.verificationCode !== verificationCode) {

            const attempts = user.verificationAttempts - 1 < 0 ? 0 : user.verificationAttempts - 1;
            await User.findByIdAndUpdate(user._id, {verificationAttempts: attempts},{runValidators: true})
            
            if (attempts <= 0) {
                throw AppError.tooManyRequests('Numero de Intentos Agotado')
            } else {
                throw AppError.badRequest('Verifación Incorrecta')
            }
            
        }

        await User.findByIdAndUpdate(user._id, {status: 'verified'}, {runValidators: true})
        ee.emit('user:verified', user.email)

        res.status(200).json({message: "Email Validado"})

    } catch (error) {
        next(error)
    }

}

export async function loginUser(req, res, next) {

    try {

        const { email, password } = req.body

        const user = await User.findOne({email: email})

        if (!user) {
            throw AppError.notFound('User')
        }

        const match = await compare(password, user.password)

        if (!match) {
            throw AppError.unauthorized('Login Fallido')
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
        next(error)
    }

}

export async function loadUserData(req, res, next) {
     
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
        next(error)
    }

}

export async function loadCompanyData(req, res, next) {

    try {

        const user = req.user

        if (user.company) {
            throw AppError.badRequest('No se pudo hacer onboarding compañia')
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
        next(error)
    }

}

export async function uploadLogo(req, res, next) {
    try {

        const user = req.user

        if (!user.company) {
            throw AppError.badRequest('No se pudo actualizar logo')
        }

        if (!req.file) {
            throw AppError.badRequest('Falta logo')
        }

        const uploadPath = `${process.env.PUBLIC_URI}/uploads/${req.file.filename}`

        await Company.findByIdAndUpdate(
            user.company,
            {logo: uploadPath},
            {runValidators: true}
        )

        res.status(201).json({message: "Logo Actualizado"})

    } catch (error) {
        next(error)
    }
}

export async function getUser(req, res, next) {

    try {

        const user = await User.findById(req.user._id).populate('company')
        return res.status(200).json(user)

    }  catch (error) {
        next(error)
    }

}

export async function refreshAccessToken(req, res, next) {
    
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            throw AppError.badRequest('No se pudo refrescar token')
        }

        const storedToken = await RefreshToken.findOne({token: refreshToken}).populate('user')

        if (!storedToken || !storedToken.isActive()) {
            throw AppError.unauthorized('Token Invalido o Expirado')
        }

        const accessToken = generateAccessToken(storedToken.user)

        res.status(200).json({accessToken})
    } catch (error) {
        next(error)
    }

}

export async function logout(req, res, next) {

    try {

        await RefreshToken.updateMany(
            {user: req.user._id, revokedAt: null},
            {revokedAt: new Date(), revokedByIp: req.ip}
        )

        res.status(200).json({message: "Logout Completado"})

    } catch (error) {
        next(error)
    }

}

export async function deleteUser(req, res, next) {
    try {

        const softDelete = req.query.soft === 'true'

        if (softDelete) {
            await User.softDeleteById(req.user._id, req.user._id)
        } else {
            await User.findByIdAndDelete(req.user._id)
        }

        ee.emit('user:deleted', req.user.email)

        res.status(200).json({message: "Usuario Borrado con Exito"})

    } catch (error) {
        next(error)
    }
}

export async function changePwd(req, res, next) {

    try {

        const user = req.user
        const { oldPassword, newPassword } = req.body

        const match = await compare(oldPassword, user.password)

        if (!match) {
            throw AppError.badRequest('No se pudo cambiar la contraseña')
        }

        const hashedPwd = await encrypt(newPassword)

        await User.findByIdAndUpdate(
            user._id,
            {password: hashedPwd},
            {runValidators: true}
        )

        res.status(200).json({message: "Contraseña Cambiada Con Exito"})

    } catch (error) {
        next(error)
    }

}

export async function inviteUser(req, res, next) {

    try {

        const user = req.user
        const { email, password } = req.body

        if (!user.company) {
            throw AppError.badRequest('No se pudo invitar a usuario') 
        }

        const existingGuest = await User.findOne({email: email})

        if (existingGuest) {
            throw AppError.conflict('Invitado ya Registrado')
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
        next(error)
    }

}