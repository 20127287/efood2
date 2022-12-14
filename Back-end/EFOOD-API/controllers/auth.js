require('dotenv').config();
const User = require('../models/User')
const Contact = require('../models/Contact')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, UnauthenticatedError, NotFoundError } = require('../errors')
const nodemailer = require('nodemailer');
const sendMail = require('../sendMail');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const createContact = async (req, res) => {
    const { title, email, content } = req.body;
    if (!title || !email || !content) {
        throw new BadRequestError('Please provide title, email, content of contact')
    }
    const contact = await Contact.create({ ...req.body });
    res.status(StatusCodes.CREATED).json({ msg: "Create contact successfully", contact })
}
//{{URL}}/auth/updatepassword
const forgotPassword = async (req, res) => {
    const { email, password, repassword, otp, otpVerify } = req.body;
    if (otpVerify) {
        if (!email || !password || !repassword || !otp) {
            throw new BadRequestError('Please provide name,email, password and otp')
        }
        else if (password !== repassword) {
            throw new BadRequestError('Password and Repassword must be same')
        }
        else {
            //Hashing password
            const salt = await bcrypt.genSalt(10);
            const passwordHashed = await bcrypt.hash(password, salt)
            const updatePassword = {
                password: passwordHashed,
            };
            const OTP_verify = jwt.verify(otpVerify, process.env.JWT_SECRET);
            if (OTP_verify.OTP === otp) {
                const user = await User.findOneAndUpdate(
                    { email: email },
                    updatePassword,
                    { new: true, runValidators: true })
                res.status(StatusCodes.ACCEPTED).json({ user });
            }
            else {
                res.status(StatusCodes.OK).json({ msg: "Incorrect OTP" });
            }
        }
    }
    else {
        throw new BadRequestError('OTP does not exist');
    }
}
// {{URL}}/auth/otp
const createOTP = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.status(StatusCodes.BAD_REQUEST).json({ msg: "Please provide an email" });
    }
    else {
        const OTP = await sendMail(7, email);
        if (!OTP) {
            res.status(StatusCodes.BAD_REQUEST).json({ msg: "Sending gmail fail!!!" })
        }
        else {
            OTP_token = jwt.sign({ OTP }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME })
            res.status(StatusCodes.CREATED).json({ otpVerify: OTP_token });
        }
    }
}



// {{URL}}/auth/register
const register = async (req, res) => {
    const { name, email, password, otp, otpVerify } = req.body;
    if (otpVerify) {
        if (!name || !email || !password || !otp) {
            throw new BadRequestError('Please provide name,email, password and otp')
        }
        else {
            const OTP_verify = jwt.verify(otpVerify, process.env.JWT_SECRET);
            if (OTP_verify.OTP === otp) {
                const user = await User.create({ ...req.body });
                // const token = user.createJWT();
                res.status(StatusCodes.CREATED).json({
                    user: { userId: user._id, email: user.email, name: user.name, gender: user.gender, typeOf: user.typeOf }
                });
            }
            else {
                res.status(StatusCodes.OK).json({ msg: "Incorrect OTP" });
            }
        }
    }
    else {
        throw new BadRequestError('OTP does not exist');
    }
}
// {{URL}}/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;
    //check email, password insert
    if (!email || !password) {
        throw new BadRequestError('Please provide email and password')
    }

    const user = await User.findOne({ email })

    //check exists email
    if (!user) {
        throw new UnauthenticatedError("Invalid email credentials");
    }
    //compare password
    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) {
        throw new UnauthenticatedError("Invalid password credentials");
    }
    const token = user.createJWT();
    res.status(StatusCodes.OK).json({
        user: { id: user.id, name: user.name, typeOf: user.typeOf, msg: "Login successfully" },
        token
    });
}
module.exports = {
    createContact,
    forgotPassword,
    createOTP,
    register,
    login,
}


//flow
/* 
B1: t???o t??i kho???n -> req.body s??? y??u c???u t???o t??i kho???n -> t???o ra m???t token ri??ng cho t??i kho???n ????
B2: ????ng nh???p t??i kho???n -> check ng?????i d??ng ???? nh???p t??i kho???n, password -> t??m t??i kho???n c?? email tr??ng v???i email ???? nh???p
    -> check password email ???? nh???p ????ng ch??a -> n???u ????ng nh???p th??nh c??ng s??? t???o token ri??ng ????? qu???n l?? t??i kho???n ????ng nh???p l??c ????

    */

/*flow
B1: t???o t??i kho???n -> t???o m?? OTP -> nh???p th??ng tin c???n thi???t , th??ng tin OTP.
B2: ????ng nh???p t??i kho???n -> check ng?????i d??ng ???? nh???p t??i kho???n, password -> t??m t??i kho???n c?? email tr??ng v???i email ???? nh???p
    -> check password email ???? nh???p ????ng ch??a -> n???u ????ng nh???p th??nh c??ng s??? t???o token ri??ng ????? qu???n l?? t??i kho???n ????ng nh???p l??c ????
B3: N???u qu??n m???t kh???u th?? s??? ph???i updatePassword. Nh???p email c???n thi???t v?? b???m g???i OTP -> nh???p OTP sau ???? nh???p password, repassword
    N???u email t???n t???i th?? s??? update l???i password c???a t??i kho???n ????. N???u kh??ng t???n t???i th?? n?? s??? b??o l???i.
*/