const cookieToken = (user, res) => {
    const token = user.getToken();
  
    const options = {
      expires: new Date(
        Date.now() + parseInt(process.env.COOKIE_EXPIRY) * 24 * 60 * 60 * 1000 // Convert days to milliseconds
      ),
      httpOnly: true,
    };
    user.password= undefined
    res.cookie("token", token, options).json({
      success: true,
      token,
      user,
      redirect: '/static/home.html',
    });
  };
  
  module.exports = cookieToken;
  