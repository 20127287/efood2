const User = require('../models/User')
const Food = require('../models/Food')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, UnauthenticatedError, NotFoundError } = require('../errors')
const moment = require('moment');
const bcrypt = require('bcryptjs')
// {{URL}}/customer
const getUserInfor = async (req, res) => {
    const user = await User.findOne({ _id: req.user.userId });
    res.status(StatusCodes.OK).json({
        id: user._id,
        userName: user.name,
        image: user.image,
        phone: user.phone,
        gender: user.gender,
        birthday: user.birthday,
        email: user.email,
        address: user.address,
        typeOf: user.typeOf,
        orderList: user.orderList,
        orderPrice: user.orderPrice
    })
}

// {{URL}}/customer/updatepassword
const updatePassword = async (req, res) => {
    const user = await User.findOne({ _id: req.user.userId });
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || !currentPassword) {
        throw new BadRequestError("Please enter new password, current password")
    }
    else {
        //compare password
        const isPasswordCorrect = await user.comparePassword(currentPassword)
        if (!isPasswordCorrect) {
            throw new UnauthenticatedError("Invalid password credentials");
        }
        else {
            //Hashing password
            const salt = await bcrypt.genSalt(10);
            const passwordHashed = await bcrypt.hash(newPassword, salt)
            const updatePassword = {
                password: passwordHashed,
            };
            const userUpdate = await User.findByIdAndUpdate(
                {
                    _id: user._id,
                },
                updatePassword,
                { new: true, runValidators: true }
            )
            res.status(StatusCodes.OK).json({
                msg: "Changing password successfully",
                id: userUpdate._id,
                name: userUpdate.name,
                password: userUpdate.password,
                email: userUpdate.email,
                typeOf: userUpdate.typeOf
            });
        }
    }

}
// {{URL}}/customer/profile
const updateUserProfile = async (req, res) => {
    const user = await User.findOne({ _id: req.user.userId });
    const { phone, gender, address, image, birthday } = req.body;
    if (!phone && !gender && !address && !image && !birthday) {
        throw new BadRequestError("Please enter at least 1 fields to update user profile (phone, gender, address)")
    }
    else {
        const dob = moment(birthday, 'DD/MM/YYYY').format('YYYY-MM-DD');
        req.body.birthday = dob;
        const userUpdate = await User.findByIdAndUpdate(
            {
                _id: user._id,
            },
            req.body,
            { new: true, runValidators: true }
        )
        res.status(StatusCodes.OK).json({
            id: userUpdate._id,
            name: userUpdate.name,
            image: userUpdate.image,
            phone: userUpdate.phone,
            gender: userUpdate.gender,
            birthday: userUpdate.birthday,
            email: userUpdate.email,
            address: userUpdate.address,
            typeOf: userUpdate.typeOf
        });
    }

}
// {{URL}}/customer/cart
const getAllItems = async (req, res) => {
    const user = await User.findOne({ _id: req.user.userId }); // l???y ra ????ng user ??ang login
    res.status(StatusCodes.OK).json({ userName: user.name, orderList: user.orderList, orderPrice: user.orderPrice })
}

// {{URL}}/customer/cart/:foodId
const createItem = async (req, res) => {
    const user = await User.findOne({ _id: req.user.userId });

    const { quantity = 1 } = req.body;
    const { foodId } = req.params;
    const food = await Food.findOne({ _id: foodId });
    const checkFoodExist = user.orderList.some((order) => {
        return order.foodId === foodId;
    })
    if (food === null) {
        throw new NotFoundError(`Dont have food with id: ${foodId}`)
    }
    else if (checkFoodExist) {
        throw new BadRequestError(`Already have food with id ${foodId} in cart`)
    }
    else {
        const item = { foodId: foodId, name: food.name, totalPrice: food.price * quantity, image: food.image, quantity: quantity };
        user.orderList.push(item);
        req.body.orderList = user.orderList;
        req.body.orderPrice = req.body.orderList.reduce((total, order) => {
            return total + order.totalPrice;
        }, 0)
        const userUpdate = await User.findByIdAndUpdate(
            {
                _id: user._id,
            },
            req.body,
            { new: true, runValidators: true }
        )
        res.status(StatusCodes.OK).json({ msg: `Add ${foodId} successfully`, name: userUpdate.name, orderList: userUpdate.orderList, orderLength: userUpdate.orderList.length, orderPrice: userUpdate.orderPrice })

    }

}

// {{URL}}/customer/cart/delete/:foodId
const deleteItem = async (req, res) => {
    const user = await User.findOne({ _id: req.user.userId });
    const { foodId } = req.params;
    const food = await Food.findOne({ _id: foodId });
    const checkFoodExist = user.orderList.some((order) => {
        return order.foodId === foodId;
    })
    if (!checkFoodExist) {
        throw new BadRequestError(`Dont exist food with id ${foodId} in cart`)
    }
    const indexDelete = user.orderList.map((order, index) => {
        if (order.foodId === foodId) {
            return index;
        }
    })
    for (let i = 0; i < indexDelete.length; i++) {
        if (indexDelete[i] || indexDelete[i] === 0) {
            let index = indexDelete[i];
            user.orderList.splice(index, 1);
        }
    }

    req.body.orderList = user.orderList;
    req.body.orderPrice = req.body.orderList.reduce((total, order) => {
        return total + order.totalPrice;
    }, 0)
    const userUpdate = await User.findByIdAndUpdate(
        {
            _id: user._id,
        },
        req.body,
        { new: true, runValidators: true }
    )
    res.status(StatusCodes.OK).json({ msg: `Delete food: ${foodId} successfully`, name: userUpdate.name, orderList: userUpdate.orderList, orderLength: userUpdate.orderList.length, orderPrice: userUpdate.orderPrice })

}

// {{URL}}/customer/cart/:foodId
const updateItem = async (req, res) => {
    const user = await User.findOne({ _id: req.user.userId });
    const { quantity } = req.body;
    const { foodId } = req.params;
    const food = await Food.findOne({ _id: foodId });
    const checkFoodExist = user.orderList.some((order) => {
        return order.foodId === foodId;
    })
    if (!quantity) {
        throw new BadRequestError(`Quantity field can not be empty`)
    }
    else if (!checkFoodExist) {
        throw new BadRequestError(`Dont exist food with id ${foodId} in cart`)
    }
    else {
        newOrderList = user.orderList.map((order) => {
            if (order.foodId === foodId) {
                order.quantity = quantity;
                order.totalPrice = order.quantity * food.price;
            }
            return order;
        })
        req.body.orderList = newOrderList;
        req.body.orderPrice = newOrderList.reduce((total, order) => {
            return total + order.totalPrice;
        }, 0)
        const userUpdate = await User.findByIdAndUpdate(
            {
                _id: user._id,
            },
            req.body,
            { new: true, runValidators: true }
        )

        res.status(StatusCodes.OK).json({ msg: `Update quantity ${foodId} successfully`, name: userUpdate.name, orderList: userUpdate.orderList, orderLength: userUpdate.orderList.length, orderPrice: userUpdate.orderPrice })
    }
}
module.exports = {
    updatePassword,
    updateUserProfile,
    getUserInfor,
    getAllItems,
    updateItem,
    deleteItem,
    createItem,
}
/*main flow:
Khi create m???t item v??o trong cart th?? n?? s??? ki???m tra food c?? t???n t???i ch??a -> ki???m tra food item ???? c?? n???m trong cart ch??a
Khi getAllItems s??? l???y to??n b??? item trong user's cart,
Khi updateItem s??? update quantity c???a s???n ph???m v?? t??? ?????ng update t???ng gi?? c???a s???n ph???m v?? c???a gi??? h??ng
Khi deleteItem s??? update l???i gi??? h??ng m?? xo?? ??i item ???????c ch???n
*/