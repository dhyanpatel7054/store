const express = require('express')
const router = express.Router()
exports.router = router
const {signup , login, logout,forgotPassword,passwordReset,getLoggedInUserDetails, changePassword,updateUserDetails,adminAllUser,managerAllUser,adminGetOneUser,adminDeleteOneUserDetails}= require('../controllers/userControlar')
const { isLoggedIn, customRole } = require('../middlewares/user')
router.route('/signup').post(signup)
router.route('/login').post(login)
router.route('/logout').get(logout)
router.route('/forgotPassword').post(forgotPassword)
router.route('/password/reset/:token').post(passwordReset);
router.route('/userdeshbord').get(isLoggedIn,getLoggedInUserDetails)
router.route('/password/update').post(isLoggedIn,changePassword);
router.route('/userdeshbord/update').post(isLoggedIn,updateUserDetails)
// admin routes
router.route('/admin/users').get(isLoggedIn,customRole('admin'),adminAllUser)

router.route('/manager/users').get(isLoggedIn,customRole('manager'),managerAllUser)
router.route('/admin/user/:id').get(isLoggedIn,customRole('admin'),adminGetOneUser)
.delete(isLoggedIn,customRole('admin'),adminDeleteOneUserDetails)
module.exports=router;