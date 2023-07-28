
const config = require('../config/config');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const mongoose = require('mongoose');
const moment = require('moment')
const Razorpay = require('razorpay')


const User = require('../model/userModel');

const NewsFeed = require('../model/newsFeedModel');

const Chat = require('../model/chatModel');

const Message = require('../model/messageModel')

const ReportedUser = require('../model/reportedUsers')

const securePassword = require('../middleware/bcrypt')


//otp create
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

const otp = generateOTP();


// for send mail
const sendVerifyMail = async (email) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: (config.emailUser),
                pass: (config.emailPassword)
            }
        });




        const mailOptions = {
            from: config.emailUser,
            to: email,
            subject: 'For Verification mail',
            html: '<p>Hii ,Here is your OTP from HeartBeat ' + otp + /*  Please click here to <a href="http://localhost:3000/otpverify?id='+ user_id + '"> Verify </a> your mail.*/'</p> '
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent:-", info.response);

            }
        })
    } catch (error) {
        console.log(error.message);
    }
}


const userRegister = async (req, res) => {
    try {

        const sPassword = await securePassword(req.body.password);
        const checkEmail = await User.findOne({ email: req.body.email })
        if (!checkEmail) {
            const user = new User({
                email: req.body.email,
                password: sPassword,
                token: otp
            });

            const userData = await user.save();
            if (userData) {
                sendVerifyMail(req.body.email);
                res.json({ status: 'ok', user_id: userData._id })
            }
        } else {

            res.json({ status: 'Email already used' })
        }

    } catch (error) {
        console.log(error.message);
    }
}


const otpVerify = async (req, res) => {
    try {
        const { otp, id } = req.body;
        const user = await User.findOne({ _id: id });
        console.log('hy');
        if (user) {
            if (user.token == otp) {
                await User.findByIdAndUpdate({ _id: id }, { $set: { isVerified: true, token: '' } });
                res.json({ status: 'ok' })
            } else {
                res.json({ status: 'Wrong OTP' })
            }

        } else {
            res.json({ status: 'Something Wrong' })

        }
    } catch (error) {
        console.log(error.message);
    }
}

const ResendOTP = async (req, res) => {
    try {
        const id = req.body.id
        const user = await User.findByIdAndUpdate({ _id: id }, { $set: { token: otp } })
        if (user) {
            sendVerifyMail(user.email);
            res.json({ status: 'ok' })
        } else {
            res.json({ status: 'error' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const ProfileAdd = async (req, res) => {
    try {
        const { id, firstName, lastName, location, age, gender, mobile, about } = req.body;
        const image = req.file

        //location setting
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;

        const response = await axios.get(geocodeUrl);

        if (response.data && response.data.length > 0) {

            const { display_name, lat, lon } = response.data[0];

            const user = await User.findByIdAndUpdate({ _id: id }, {
                $set: {
                    firstName: firstName,
                    lastName: lastName,
                    age: age,
                    mobile: mobile,
                    about: about,
                    gender: gender,
                    image: image.filename,
                    location: {
                        placeName: display_name,
                        coordinates: [lat, lon]
                    }
                }
            })
            if (user) {
                res.json({ status: 'ok' });
            } else {
                res.json({ status: 'error' })
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const InterestAdd = async (req, res) => {
    try {
        const { id, interests } = req.body;
        if (id) {
            const user = await User.findByIdAndUpdate({ _id: id }, { $set: { interests: interests } })
            if (user) {
                res.json({ status: 'ok' })
            } else {
                res.json({ status: 'error' })
            }
        } else {
            res.json({ status: 'error' })

        }

    } catch (error) {
        console.log(error.message);
    }
}

const VerifyUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (user.isVerified) {
                if (user.isBlocked) {
                    res.json({ status: 'You are currently under a temporary block' });
                } else {

                    if (passwordMatch) {
                        const accessToken = jwt.sign({
                            id: user._id
                        }, process.env.SECRETKEY, { expiresIn: '7h' });

                        const refreshToken = jwt.sign({
                            id: user._id
                        }, process.env.REFRESHSECRETKEY)

                        res.json({ status: 'ok', user: true, accessToken, refreshToken })
                    } else {
                        res.json({ status: 'Email or Password wrong' });
                    }
                }
            } else {
                sendVerifyMail(user.email)
                res.json({ status: 'Verification failed complete your registration',user:user._id });
            }
        } else {
            res.json({ status: 'Email or Password wrong' });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const RefreshToken = async (req, res) => {
    try {
        if (req.user) {
            const accessToken = jwt.sign({
                id: req.user._id
            }, process.env.SECRETKEY, { expiresIn: '7h' });

            const refreshToken = jwt.sign({
                id: req.user._id
            }, process.env.REFRESHSECRETKEY);

            if (accessToken) {
                res.json({ status: 'ok', accessToken, refreshToken })
            }
        } else {
            res.json({ status: 'error' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const UserHome = async (req, res) => {
    try {
        if (req.user) {
            res.json({ status: 'ok', user: req.user })
        } else {
            res.json({ status: 'unauthorised' })
        }
    } catch (error) {
        console.log(error.message);
    }
}


const UserProfile = async (req, res) => {
    try {
        const id = req.query.id
        if (req.user) {
            const user = await User.findOne({ _id: id ? id : req.user._id });
            if (user) {
                const age = calculateAge(user.age);
                res.json({ status: 'ok', user: user, interests: user.interests, image: user.image, images: user.images, age: age })
            }
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

        } else {
            req.json({ status: 'unauthorised' })
        }
    } catch (error) {
        console.log(error.message)

    }
}

const EditProfile = async (req, res) => {
    try {
        if (req.user) {
            const image = req.file;
            const { firstName, lastName, about, age, mobile, gender, interests, location } = req.body;

            //location setting
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;

            const response = await axios.get(geocodeUrl);

            if (response.data && response.data.length > 0) {

                const { display_name, lat, lon } = response.data[0];

                if (image) {
                    const update = await User.findByIdAndUpdate({ _id: req.user._id }, {
                        $set: {
                            firstName, lastName, about, age, mobile, gender, interests, image: image.filename,
                            location: {
                                placeName: display_name,
                                coordinates: [lat, lon]
                            }
                        }
                    });
                    if (update) {
                        res.json({ status: 'ok' })
                    }
                } else {
                    const update = await User.findByIdAndUpdate({ _id: req.user._id }, {
                        $set: {
                            firstName, lastName, about, age, mobile, gender, interests,
                            location: {
                                placeName: display_name,
                                coordinates: [lat, lon]
                            }
                        }
                    });
                    if (update) {
                        res.json({ status: 'ok' })
                    }
                }
            }
        } else {
            res.json({ status: 'unauthorised' })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const MultipleImages = async (req, res) => {
    try {
        if (req.user) {
            const { edit, index, deleted } = req.body
            const images = req.files.map((file) => {

                return file.filename
            });
            if (edit) {
                const newImage = images[0];
                const updated = await User.findByIdAndUpdate({ _id: req.user._id }, { $set: { [`images.${index}`]: newImage } })
                if (updated) {
                    res.json({ status: 'ok' })
                } else {
                    res.json({ status: 'error' })
                }
            } else if (deleted) {
                const updated = await User.updateOne({ _id: req.user._id }, { $unset: { [`images.${index}`]: 1 } });
                if (updated) {
                    res.json({ status: 'ok' })
                } else {
                    res.json({ status: 'error' })
                }
            } else {


                const updated = await User.findByIdAndUpdate({ _id: req.user._id }, { $set: { images: images } })
                if (updated) {
                    res.json({ status: 'ok' })
                } else {
                    res.json({ status: 'error' })
                }
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

const EditImage = async (req, res) => {
    try {
        const image = req.file;
        console.log(image);
        res.json({ status: 'ok' })
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

const DiscoverUsers = async (req, res) => {
    try {
        if (req.user) {
            const usersLiked = req.user.liked
            const usersLikes = req.user.likesYou
            const usersMatched = req.user.matches
            // console.log(req.user.location.coordinates);
            const targetCoordinates = req.user.location.coordinates; // The target coordinates to search for

            const referenceLocation = {
                type: 'Point',
                coordinates: [req.user.location.coordinates[0], req.user.location.coordinates[1]]
            };
            const maxDistanceInMeters = 50000; // Maximum distance in meters
            const { ageTo, ageFrom, gender, nearBy } = req.query;
            const maxAgeInt = parseInt(ageTo, 10);
            const minAgeInt = parseInt(ageFrom, 10);

            const currentDate = moment();
            const ageFromNumber = currentDate.clone().subtract(maxAgeInt, 'years');
            const ageToNumber = currentDate.clone().subtract(minAgeInt, 'years');

            if (ageTo && ageFrom) {
                if (nearBy == 'true') {
                    const users = await User.aggregate([
                        {
                            $geoNear: {
                                near: referenceLocation,
                                distanceField: 'distance',
                                maxDistance: maxDistanceInMeters,
                                spherical: true,
                                query: {
                                    $or: [
                                        { 'location.coordinates': { $geoWithin: { $centerSphere: [targetCoordinates, 0] } } },
                                        {
                                            $and: [
                                                {
                                                    _id: {
                                                        $nin: usersLiked.map(id => new mongoose.Types.ObjectId(id))
                                                    }
                                                },
                                                {
                                                    _id: {
                                                        $nin: usersLikes.map(id => new mongoose.Types.ObjectId(id))
                                                    }
                                                },
                                                {
                                                    _id: {
                                                        $nin: usersMatched.map(id => id)
                                                    }
                                                },
                                                { isBlocked: false },
                                                { isVerified: true },
                                                { age: { $gte: ageFromNumber.toDate(), $lte: ageToNumber.toDate() } },
                                                { gender: gender == 'both' ? { $exists: true } : gender }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $sample: { size: 48 } }
                    ]);


                    if (users) {
                        res.json({ status: 'ok', users })
                    }
                } else {
                    const users = await User.aggregate([{
                        $match: {
                            $and: [
                                {
                                    _id: {
                                        $nin: usersLiked.map(id => new mongoose.Types.ObjectId(id))
                                    }
                                },
                                {
                                    _id: {
                                        $nin: usersLikes.map(id => id)
                                    }
                                },
                                {
                                    _id: {
                                        $nin: usersMatched.map(id => id)
                                    }
                                },
                                { isBlocked: false },
                                { isVerified: true },
                                { age: { $gte: ageFromNumber.toDate(), $lte: ageToNumber.toDate() } },
                                { gender: gender == 'both' ? { $exists: true } : gender }
                            ]
                        }
                    },
                    { $sample: { size: 48 } }
                    ]);
                    if (users) {
                        res.json({ status: 'ok', users })
                    }
                }

            } else {
                const users = await User.aggregate([
                    {
                        $match: {
                            $and: [
                                {
                                    _id: {
                                        $nin: usersLiked.map(id => new mongoose.Types.ObjectId(id))
                                    }
                                },
                                {
                                    _id: {
                                        $nin: usersLikes.map(id => id)
                                    }
                                },
                                {
                                    _id: {
                                        $nin: usersMatched.map(id => id)
                                    }
                                },
                                { isVerified: true },
                                { isBlocked: false }]
                        }
                    },
                    { $sample: { size: 48 } }]);
                if (users) {
                    res.json({ status: 'ok', users, id: req.user._id })
                }
            }
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}


const SuggestLoaction = async (req, res) => {
    try {
        const { query } = req.query;

        const suggestUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

        const response = await axios.get(suggestUrl);

        if (response.data && response.data.length > 0) {
            const suggestions = response.data.map((location) => {
                return {
                    placeName: location.display_name,
                    latitude: location.lat,
                    longitude: location.lon,
                };
            });

            res.status(200).json(suggestions);
        } else {
            res.status(404).json([]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

const HandleLike = (req, res) => {
    try {
        if (req.user) {

            const { id, liked, match } = req.body;

            if (liked) {
                if (match) {
                    User.updateOne({ _id: id }, { $push: { matches: req.user._id } }).then(() => {
                        // console.log('ID added to the array successfully');
                    });

                    User.updateOne({ _id: req.user._id }, { $push: { matches: new mongoose.Types.ObjectId(id) } }).then(() => {
                        // console.log('ID added to the array successfully');
                    });

                    User.updateOne({ _id: req.user._id }, { $pull: { likesYou: new mongoose.Types.ObjectId(id) } }).then(() => {
                        // console.log('removed');
                    });
                    User.updateOne({ _id: id }, { $pull: { liked: req.user._id } }).then(() => {
                        // console.log('removed');
                        res.json({ status: 'ok' })

                    })

                } else {

                    User.updateOne({ _id: id }, { $push: { likesYou: req.user._id } }).then(() => {
                        // console.log('Added to user db');
                    })
                    User.updateOne({ _id: req.user._id }, { $push: { liked: new mongoose.Types.ObjectId(id) } })
                        .then(() => {
                            // console.log('ID added to the array successfully');
                            res.json({ status: 'ok' })
                        })
                }
            } else {
                User.updateOne({ _id: id }, { $pull: { likesYou: req.user._id } }).then(() => {
                    // console.log('Removed from user db');
                })
                User.updateOne({ _id: req.user._id }, { $pull: { liked: new mongoose.Types.ObjectId(id) } })
                    .then(() => {
                        // console.log('ID removed to the array successfully');
                        res.json({ status: 'ok' })
                    })
            }

        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}


const ListingLiked = (req, res) => {
    try {
        if (req.user) {
            const selectedOption = req.query.SelectedOption ? req.query.SelectedOption : req.query.selectedOption
            const usersLiked = selectedOption === 'peopleYouLiked' ? req.user.liked : req.user.likesYou;
            User.find({ _id: { $in: usersLiked } })
                .then((users) => {
                    res.json({ status: 'ok', users: users })
                })
        } else {
            res.status(404).json({ status: 'error', message: 'You are not authenticated' });

        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

const HandleMatches = (req, res) => {
    try {
        if (req.user) {
            usersMatched = req.user.matches
            User.find({ _id: { $in: usersMatched } })
                .then((users) => {
                    res.json({ status: 'ok', users: users })
                })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

const HandleDeleteMatches = (req, res) => {
    try {
        const { id } = req.body;
        console.log(id);
        if (req.user) {
            User.updateOne({ _id: req.user._id }, { $pull: { matches: new mongoose.Types.ObjectId(id) } }).then(() => {
                // console.log('deleted');
            })
            User.updateOne({ _id: id }, { $pull: { matches: new mongoose.Types.ObjectId(req.user._id) } }).then(() => {
                // console.log('deleted');
                res.json({ status: 'ok' })
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

const CreatePost = async (req, res) => {
    try {
        if (req.user) {
            // console.log(req.file);
            const image = req.file.filename;
            const { caption } = req.body;
            const user_id = req.user._id

            const posts = new NewsFeed({
                caption: caption,
                image: image,
                userId: user_id
            })
            const created = await posts.save();
            if (created) {
                res.json({ status: 'ok' });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

const GetPosts = async (req, res) => {
    try {
        if (req.user) {
            const userMatched = [...req.user.matches, req.user._id]
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
                    $match: {
                        userId: {
                            $in: userMatched.map((id) => id)
                        }
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
                res.json({ status: 'ok', posts: posts })
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

const HandleLikeCount = async (req, res) => {
    try {
        if (req.user) {
            const { id, likes } = req.body;
            if (likes) {
                await NewsFeed.updateOne({ _id: id }, { $inc: { likes: 1 } })
                    .then(() => {
                        res.status(200).json({ status: 'ok' })
                    })
            } else {
                await NewsFeed.updateOne({ _id: id }, { $inc: { likes: -1 } })
                    .then(() => {
                        res.status(200).json({ status: 'ok' })
                    })
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

const accessChat = async (req, res) => {
    if (req.user) {

        const { userId } = req.body;

        if (!userId) {
            console.log("UserId param not sent with request");
            return res.sendStatus(400);
        }

        var isChat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        })
            .populate("users", "-password")
            .populate("latestMessage");

        isChat = await User.populate(isChat, {
            path: "latestMessage.sender",
            select: "firstName image email",
        });

        if (isChat.length > 0) {
            res.send(isChat[0]);
        } else {
            var chatData = {
                chatName: "sender",
                isGroupChat: false,
                users: [req.user._id, userId],
            };

            try {
                const createdChat = await Chat.create(chatData);
                const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
                    "users",
                    "-password"
                );
                res.status(200).json(FullChat);
            } catch (error) {
                res.status(400);
                throw new Error(error.message);
            }
        }
    }
};

const fetchChats = async (req, res) => {
    try {
        if (req.user) {

            Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
                .populate("users", "-password")
                .populate("groupAdmin", "-password")
                .populate("latestMessage")
                .sort({ updatedAt: -1 })
                .then(async (results) => {
                    results = await User.populate(results, {
                        path: "latestMessage.sender",
                        select: "fisrtName image email",
                    });
                    res.status(200).send(results);
                });
        }
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

const AllMessage = async (req, res) => {

    if (req.user) {
        try {
            const messages = await Message.find({ chat: req.query.chatId })
                .populate("sender", "firstName image email")
                .populate("chat");
            res.json({ messages: messages });
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    }
};


const SendMessage = async (req, res) => {
    try {
        if (req.user) {
            const { content, chatId } = req.body;

            if (!content || !chatId) {
                console.log("Invalid data passed into request");
                return res.sendStatus(400);
            }

            var newMessage = {
                sender: req.user._id,
                content: content,
                chat: chatId,
            };


            var message = await Message.create(newMessage);

            message = await message.populate("sender", "firstName image")
            message = await message.populate("chat")
            message = await User.populate(message, {
                path: "chat.users",
                select: "firstName image email",
            });

            await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

            res.json(message);

        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}
const createOrder = async (req, res) => {
    try {
        if (req.user) {

            let razorpay = new Razorpay(
                {
                    key_id: "rzp_test_UWN9YHKEBFWQUS",
                    key_secret: "JovSRUtrFwTD16AbrEtgD0Pk"
                })

            const options = {
                amount: req.body.amount, // Amount in paise (100 paise = 1 INR)
                currency: 'INR',
                receipt: 'order_receipt',
            };
            razorpay.orders.create(options, (err, order) => {
                if (err) {
                    console.error('Error creating order:', err);
                    return res.status(500).json({ error: 'Something went wrong' });
                }

                return res.json(order);
            });

        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

const PremiumPurchase = async (req, res) => {
    try {
        if (req.user) {
            User.findByIdAndUpdate({ _id: req.user._id }, { $set: { PremiumPurchased: true } }).then(() => {
                res.status(200).json({ status: 'ok' });
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

const HandleDelete = async (req, res) => {
    try {
        if (req.user) {
            const { id } = req.body
            // console.log(id);
            const deleted = await Chat.deleteOne({ _id: id })
            const messageDeleted = await Message.deleteMany({ chat: id });

            // console.log(deleted);
            if (messageDeleted) {
                res.status(200).json({ status: 'ok' })
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

const HandleReport = async (req, res) => {
    try {
        if (req.user) {
            const User = await ReportedUser.updateOne({ userId: req.body.id }, { $inc: { count: 1 } })
            // console.log(User);
            if (User.modifiedCount == 0) {
                const user = new ReportedUser({
                    userId: req.body.id
                })
                await user.save();
            }
            res.status(200).json({ status: "ok" })

        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
}

module.exports = {
    userRegister,
    otpVerify,
    ResendOTP,
    ProfileAdd,
    InterestAdd,
    VerifyUser,
    UserHome,
    UserProfile,
    EditProfile,
    MultipleImages,
    DiscoverUsers,
    RefreshToken,
    SuggestLoaction,
    HandleLike,
    ListingLiked,
    HandleMatches,
    HandleDeleteMatches,
    EditImage,
    CreatePost,
    GetPosts,
    HandleLikeCount,
    accessChat,
    fetchChats,
    AllMessage,
    SendMessage,
    createOrder,
    PremiumPurchase,
    HandleDelete,
    HandleReport
}