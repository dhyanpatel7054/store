const BigPromise =require('../middlewares/bigPromise')

exports.home = BigPromise(async(req, res) => {
  //const db = await someething()
  res.status(200).json({
    success: true,
    greeting: 'Hello from API',
  });
});
  