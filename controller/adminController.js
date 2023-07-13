
const jwt = require('jsonwebtoken')

const bcrypt = require('bcrypt')

const Admin = require('../model/adminModel')

const User = require('../model/userModel')


const securePassword = require('../middleware/bcrypt')



const RegisterAdmin = async (req, res) => {
    try {

        const sPassword = await securePassword(req.body.password);

        const admin = new Admin({
            email: req.body.email,
            password: sPassword,
        });

        const adminData = await admin.save();

        if (adminData) {
            res.json({ status: 'ok' })
        } else {
            res.json({ status: 'error' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const VerifyAdmin = async (req, res) => {
    try {
        const password = req.body.password;
        const admin = await Admin.findOne({ email: req.body.email });
        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                const token = jwt.sign({
                    id: admin._id
                }, process.env.ADMINSECRET)
                res.json({ status: 'ok', admin: true, token })
            } else {
                res.json({ status: 'Email or password wrong' })

            }
        } else {
            res.json({ status: 'Email or Password wrong' })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const AdminHome = async (req, res) => {
    try {
        if (req.admin) {
            const verified = req.query.verified;
            const users = await User.find({ isVerified: verified })
            res.json({ status: 'ok', users })
        } else {
            res.json({ status: 'unauthorised' })
        }
    } catch (error) {
        console.log(error.message);
    }
}


const BlockUser = async (req, res) => {
    try {
        if (req.admin) {
            const id = req.body.value;
            if (req.body.deleted) {
                const deleted = await User.findByIdAndDelete(id)
                if (deleted) {
                    res.json({ status: 'ok' })
                }
            } else {

                if (req.body.block) {
                    const blocked = await User.findByIdAndUpdate(id, { $set: { isBlocked: true } },{new:true})
                    if (blocked) {
                        res.json({ status: 'ok' })
                    }
                } else {
                    const unblocked = await User.findByIdAndUpdate(id, { $set: { isBlocked: false } },{new:true})
                    if (unblocked) {
                        res.json({ status: 'ok' })
                    }
                }
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    RegisterAdmin,
    VerifyAdmin,
    AdminHome,
    BlockUser
}