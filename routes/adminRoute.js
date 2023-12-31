const express = require('express');
const adminRoute = express();

const adminAuth = require('../middleware/adminJwt')

const adminController = require('../controller/adminController')

adminRoute.post('/signup', adminController.RegisterAdmin);

adminRoute.post('/login', adminController.VerifyAdmin)

adminRoute.get('/home', adminAuth, adminController.AdminHome);

adminRoute.patch('/home', adminAuth, adminController.BlockUser);

adminRoute.get('/newsFeed',adminAuth,adminController.GetPosts);

adminRoute.put('/newsFeed',adminAuth,adminController.DeletePost);

adminRoute.get('/report',adminAuth,adminController.HandleReport);

adminRoute.get('/dashboard',adminAuth,adminController.HandleDashboard)

module.exports = adminRoute;