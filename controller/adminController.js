
const jwt = require('jsonwebtoken')

const bcrypt = require('bcrypt')

const Admin = require('../model/adminModel')

const User = require('../model/userModel')

const NewsFeed = require('../model/newsFeedModel')


const securePassword = require('../middleware/bcrypt')

function calculateAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

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
            if (users) {
                 const updatedUsers = users.map((user) => {
                    return {
                        ...user,
                        age: calculateAge(user.age),
                    };
                });
                res.json({ status: 'ok', updatedUsers })
            }
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
                    const blocked = await User.findByIdAndUpdate(id, { $set: { isBlocked: true } }, { new: true })
                    if (blocked) {
                        res.json({ status: 'ok' })
                    }
                } else {
                    const unblocked = await User.findByIdAndUpdate(id, { $set: { isBlocked: false } }, { new: true })
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

const GetPosts = async (req, res) => {
    try {
        if (req.admin) {
            const posts = await NewsFeed.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        caption: 1,
                        image: 1,
                        likes: 1,
                        "user.firstName": 1,
                        "user.image": 1
                    }
                }, {
                    $sort: { _id: -1 }
                }
            ])
            if (posts) {
                res.status(200).json({ status: 'ok', posts })
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}


const DeletePost = async (req, res) => {
    try {
        if (req.admin) {
            const { id } = req.body;
            await NewsFeed.findByIdAndDelete({ _id: id }).then(() => {
                res.status(200).json({ status: 'ok' })
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

module.exports = {
    RegisterAdmin,
    VerifyAdmin,
    AdminHome,
    BlockUser,
    GetPosts,
    DeletePost
}