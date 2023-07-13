const express = require('express');
const userRoute = express();

const upload = require('../middleware/multer')

const userAuth = require('../middleware/userJwt')


const userController = require('../controller/userController');

userRoute.post('/signUp',userController.userRegister);

userRoute.post('/otp',userController.otpVerify);

userRoute.post('/resend',userController.ResendOTP);

userRoute.post('/profileAdd',upload.single('image'),userController.ProfileAdd);

userRoute.post('/interest',userController.InterestAdd);

userRoute.post('/login',userController.VerifyUser)

userRoute.get('/refresh',userAuth,userController.RefreshToken)

userRoute.get('/home',userAuth,userController.UserHome);

userRoute.get('/profile',userAuth,userController.UserProfile);

userRoute.post('/profile',userAuth,upload.single('image'),userController.EditProfile);

userRoute.post('/images',userAuth,upload.array('images[]'),userController.MultipleImages);

userRoute.patch('/images',userAuth,upload.single('image'),userController.EditImage);

userRoute.get('/discover',userAuth,userController.DiscoverUsers);

userRoute.get('/location',userController.SuggestLoaction);

userRoute.patch('/profileLike',userAuth,userController.HandleLike);

userRoute.get('/likes',userAuth,userController.ListingLiked);

userRoute.get('/matches',userAuth,userController.HandleMatches);

userRoute.patch('/deleteMatch',userAuth,userController.HandleDeleteMatches);

userRoute.get('/newsField',userAuth,userController.GetPosts)

userRoute.post('/newsField',userAuth,upload.single('image'),userController.CreatePost)


module.exports = userRoute;