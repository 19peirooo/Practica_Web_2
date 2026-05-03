import Company from "../models/company.models.js";
import RefreshToken from "../models/refreshtoken.models.js";
import User from "../models/user.models.js"
import ee from "../services/notification.service.js";
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from "../utils/handleJwt.js";
import { compare, encrypt } from "../utils/handlePassword.js";
import { generateVerificationCode } from "../utils/handleVerificationCode.js";
import { AppError } from "../utils/AppError.js";
import { sendSlackNotification } from "../utils/handleLogger.js";
import cloudinaryService from '../services/cloudinary.service.js';
import { sendVerificationEmail } from "../services/mail.service.js";

export async function registerUser(req, res) {
    
    let new_user = req.body
    const new_email = new_user.email;
    
    const foundUser = await User.findOne({email: new_email}).lean()

    if (foundUser) throw AppError.conflict('No se pudo registrar usuario')

    const hashed_pswd = await encrypt(new_user.password)
    new_user.password = hashed_pswd

    const code = generateVerificationCode()

    new_user.verificationCode = code
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

    await sendVerificationEmail(user.email,code)

    res.status(201).json({
        email: user.email,
        status: user.status,
        role: user.role,
        accessToken: access_token,
        refreshToken: refresh_token
    }) 

}

export async function validateEmail(req, res) {

        
    const { verificationCode } = req.body;

    const user = req.user

    if (user.status === 'verified') throw AppError.badRequest('No se pudo validar email')

    if (user.verificationCode !== verificationCode) {

        const attempts = user.verificationAttempts - 1 < 0 ? 0 : user.verificationAttempts - 1;
        await User.findByIdAndUpdate(user._id, {verificationAttempts: attempts},{runValidators: true})
        
        if (attempts <= 0) {
            throw AppError.tooManyRequests('No se pudo validar email')
        } else {
            throw AppError.badRequest('No se pudo validar email')
        }
        
    }

    await User.findByIdAndUpdate(user._id, {status: 'verified'}, {runValidators: true})
    ee.emit('user:verified', user.email)

    res.status(200).json({message: "Email Validado"})

}

export async function loginUser(req, res) {

    const { email, password } = req.body

    const user = await User.findOne({email: email})

    if (!user) throw AppError.notFound('No se pudo hacer login')

    const match = await compare(password, user.password)

    if (!match) throw AppError.unauthorized('No se pudo hacer login')

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

}

export async function loadUserData(req, res) {
     

    const { name, lastName, nif, address } = req.body

    await User.findByIdAndUpdate(
        req.user._id,
        {
            name: name,
            lastName: lastName,
            nif: nif,
            address: address
        },
        {runValidators: true}
    )

    res.status(200).json({message: "Onboarding de Usuario completado"})

}

export async function loadCompanyData(req, res) {

    const user = req.user
    const data = req.body

    if (user.company) throw AppError.badRequest('No se pudo hacer onboarding compañia')

    const cifToSearch = data.isFreelance ? user.nif : data.cif

    const companyStored = await Company.findOne({cif: cifToSearch})

    if (!companyStored) {

        let company

        if (data.isFreelance) {

            if (!user.address) throw AppError.badRequest('No se pudo hacer onboarding compañia')

            company = await Company.create(
                {
                    owner: user._id,
                    name: user.name,
                    cif: user.nif,
                    address: user?.address, 
                    isFreelance: true
                }
            )
        } else {
            company = await Company.create(
                {
                    owner: user._id,
                    name: data.name,
                    cif: data.cif,
                    address: data.address,
                    isFreelance: false
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
}

export async function uploadLogo(req, res) {

    const user = req.user;

    if (!req.file || !user.company) throw AppError.badRequest('No se pudo subir logo de la compañia');

    const result = await cloudinaryService.uploadAvatar(
        req.file.buffer,
        user._id
    );

    const company = await Company.findByIdAndUpdate(
        user.company,
        {
            logo: result.secure_url,
        },
        { new: true }
    );

    res.status(201).json({
        message: 'Avatar actualizado',
        logo: company.logo
    })
}

export async function getUser(req, res) {
    const user = await User.findById(req.user._id).populate('company')
    return res.status(200).json(user)
}

export async function refreshAccessToken(req, res) {
    
    const { refreshToken } = req.body

    if (!refreshToken) throw AppError.badRequest('No se pudo refrescar token')

    const storedToken = await RefreshToken.findOne({token: refreshToken}).populate('user')

    if (!storedToken || !storedToken.isActive()) throw AppError.unauthorized('No se pudo refrescar token')

    const accessToken = generateAccessToken(storedToken.user)

    res.status(200).json({accessToken})

}

export async function logout(req, res) {

    await RefreshToken.updateMany(
        {user: req.user._id, revokedAt: null},
        {revokedAt: new Date(), revokedByIp: req.ip}
    )

    res.status(200).json({message: "Logout Completado"})

}

export async function deleteUser(req, res) {

    const softDelete = req.query.soft === 'true'

    if (softDelete) {
        await User.softDeleteById(req.user._id, req.user._id)
    } else {
        await User.hardDelete(req.user._id)
    }

    ee.emit('user:deleted', req.user.email)

    res.status(200).json({message: "Usuario Borrado con Exito"})

}

export async function changePwd(req, res) {


    const user = req.user
    const { oldPassword, newPassword } = req.body

    const match = await compare(oldPassword, user.password)

    if (!match) throw AppError.badRequest('No se pudo cambiar la contraseña')

    const hashedPwd = await encrypt(newPassword)

    await User.findByIdAndUpdate(
        user._id,
        {password: hashedPwd},
        {runValidators: true}
    )

    res.status(200).json({message: "Contraseña Cambiada Con Exito"})

}

export async function inviteUser(req, res) {


    const user = req.user
    const { email, password } = req.body

    if (!user.company) throw AppError.badRequest('No se pudo invitar a usuario') 

    const existingGuest = await User.findOne({email: email})

    if (existingGuest) throw AppError.conflict('No se pudo invitar a usuario')

    const hashedPwd = await encrypt(password)

    const guest = await User.create({
        email: email,
        password: hashedPwd,
        company: user.company,
        role: 'guest'
    })

    ee.emit('user:invited', email)

    res.status(201).json({message: "Usuario Invitado"})

}