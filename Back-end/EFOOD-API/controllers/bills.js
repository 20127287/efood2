const Bill = require('../models/Bill')
const User = require('../models/User')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError, UnauthenticatedError } = require('../errors')
//{{URL}}/bills?limit
const getAllBills = async (req, res) => {
    const userCheck = await User.findOne({ _id: req.user.userId });
    if (userCheck.typeOf === 'admin') {
        const { limit } = req.query;
        const bills = await Bill.find({}).sort('createdAt')
        let sortedBills = [...bills];
        if (limit) {
            sortedBills = sortedBills.slice(0, Number(limit));
        }
        if (sortedBills.length < 1) {
            return res.status(StatusCodes.OK).json({ msg: "Dont have any bills to show", length: sortedBills.length });
        }
        res.status(StatusCodes.OK).json({ sortedBills, count: sortedBills.length });
    }
    else {
        throw new UnauthenticatedError(`User have no permission`)
    }
}
//get bills by userId (for admin)
//{{URL}}/bills/user/:id
const getBillbyUserId = async (req, res) => {
    const userCheck = await User.findOne({ _id: req.user.userId });
    if (userCheck.typeOf === 'admin') {
        const bills = await Bill.find({ createdBy: req.params.id }).sort('createdAt')
        res.status(StatusCodes.OK).json({ bills, count: bills.length });
    }
    else {
        throw new UnauthenticatedError(`User have no permission`)
    }
}
//get bill by bill id (admin)
//{{URL}}/bills/:id
const getBill = async (req, res) => {
    const userCheck = await User.findOne({ _id: req.user.userId });
    if (userCheck.typeOf === 'admin') {
        const { params: { id: billId } } = req; // req.user.userId, req.params.id

        const bill = await Bill.findOne({
            _id: billId,
        })
        if (!bill) {
            throw new NotFoundError(`No bill with id ${billId}`)
        }
        res.status(StatusCodes.OK).json({ bill })
    }
    else {
        throw new UnauthenticatedError(`User have no permission`)

    }
}
// get bills of account (logged in) (customer or admin)
//{{URL}}/bills/user
const getUserBills = async (req, res) => {
    const bills = await Bill.find({ createdBy: req.user.userId }).sort('createdAt')
    res.status(StatusCodes.OK).json({ bills, count: bills.length });
}
//{{URL}}/bills
const createBill = async (req, res) => {
    const user = await User.findOne({ _id: req.user.userId })

    if (user.orderList.length > 0) {
        req.body.createdBy = req.user.userId;
        req.body.orderList = user.orderList;
        req.body.total = user.orderPrice;
        req.body.orderPrice = 0;
        const bill = await Bill.create({ ...req.body });

        req.body.orderList.splice(0);
        const userCart = await User.findOneAndUpdate(
            {
                _id: user._id,
            },
            req.body,
            { new: true, runValidators: true }
        );

        res.status(StatusCodes.CREATED).json({
            bill
        })
    }
    else {
        throw new NotFoundError(`No food in cart`)
    }
}
//{{URL}}/bills/:id
const updateBill = async (req, res) => {
    const userCheck = await User.findOne({ _id: req.user.userId });
    if (userCheck.typeOf === 'admin') {
        const {
            body: { status },
            user: { userId },
            params: { id: billId },
        } = req;

        if (status === '') {
            throw new BadRequestError('status fields cannot be empty');
        }

        const bill = await Bill.findByIdAndUpdate(
            {
                _id: billId,
                status: status,
                createdBy: userId
            },
            req.body,
            { new: true, runValidators: true }
        )

        if (status === 'delivered') {
            const billFind = await Bill.findOne({ _id: billId });
            req.body.total = Math.round(billFind.total / 10);
            const user = await User.findOneAndUpdate(
                {
                    _id: billFind.createdBy
                },
                { bonus: req.body.total },
                { new: true, runValidators: true }
            )
        }
        if (!bill) {
            throw new NotFoundError(`No bill with id ${billId}`)
        }
        res.status(StatusCodes.OK).json({ bill })
    }
    else {
        throw new UnauthenticatedError(`User have no permission`)

    }
}
//{{URL}}/bills/:id
const deleteBill = async (req, res) => {
    const userCheck = await User.findOne({ _id: req.user.userId });
    if (userCheck.typeOf === 'admin') {
        const {
            user: { userId },
            params: { id: billId },
        } = req;

        const bill = await Bill.findByIdAndRemove({
            _id: billId,
            createdBy: userId,
        })

        if (!bill) {
            throw new NotFoundError(`No bill with id ${billId}`)
        }
        res.status(StatusCodes.OK).json({ msg: `Delete bill ID: ${billId} successfully ` })
    }
    else {
        throw new UnauthenticatedError(`User have no permission`)

    }
}
module.exports = {
    getAllBills,
    getBill,
    getUserBills,
    getBillbyUserId,
    createBill,
    updateBill,
    deleteBill,
}
/* main flow:
Khi createBill th?? s??? check xem ng?????i ???? c?? th??m item trong cart ch??a n???u r???i th?? s??? th??m gi?? v?? orderList v?? model Bill
cu???i c??ng sau khi t???o bill th?? orderList s??? b??? xo??.
Khi getAllBills (ch??? admin) th?? s??? l???y to??n b??? bills ???? ??c t???o
Khi getBill (ch??? admin) l???y bill c?? id bill ???????c nh???p
Khi getUserBills (account ??ang login) l???y bills c???a user
Khi getBillbyUserId (ch??? admin) l???y bills c???a id user ???????c nh???p
Khi updateBill th?? s??? ch???nh s???a tr???ng th??i c???a ????n h??ng th?? s??? c???p nh???t ??i???m th?????ng cho ng?????i d??ng theo gi?? tr??? 1/10
*/