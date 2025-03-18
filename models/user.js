const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please provide name'],
        maxlength:[40,'Name should be less then 40 characters']
    },
    email:{
        type:String,
        required:[true,'Please provide email'],
        validate: [validator.isEmail,'please enter email formet'],
        unique: true
    },
    password:{
        type:String,
        required:[true,'Please provide password'],
        minlength:[6,'password shoud be atlist then 6'],
        select: false//to net allow to call password all time
    },
    role:{
        type:String,
        default:'user'
    },
    photo:{
        id:{
            type: String,
            required:true
            
        },
        secure_url:{
            type: String,
            required:true
        }
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry:Date,
    createdAt:{
        type:Date,
        default:Date.now,
    }
})
// encrypt password beffore saving -HOOKS
userSchema.pre('save',async function(next){
    if (!this.isModified('password')){ 
        return next();
    }
    this.password= await bcrypt.hash(this.password, 10)
})
// validate the password with passed on password
userSchema.methods.isValidatedPassword = async function (usersendPassword) {
    return await bcrypt.compare(usersendPassword, this.password);
  };  
// create and return jwt tokken 
userSchema.methods.getToken = function(){
    return jwt.sign({id: this._id},process.env.JWT_SECRET,
        {
            expiresIn:process.env.JWT_EXPIRY
        })
}
// generate forgot password token (string)
userSchema.methods.getForgotPasswordToken = function(){
    // generate a long random string
    const forgotToken = crypto.randomBytes(20).toString('hex');

    this.forgotPasswordToken = crypto
      .createHash('sha256')
      .update(forgotToken)
      .digest('hex');
    
    this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000;
    
    return forgotToken;
    
}
module.exports= mongoose.model('User',userSchema)
