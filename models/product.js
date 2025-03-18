const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please provide product name'],
        trim: true,
        maxLength: [120, 'product name should not be more than 120 characters']
    },
    price: {
        type: Number,
        required: [true, 'please provide product price'],
    },
    description: {
        type: String,
        required: [true, 'please provide product description'],
    },
    photos: [
        {
            id: {
                type: String,
                required: true
            },
            secure_url: {
                type: String,
                required: true
            }
        }
    ],
    category: {
        type: String,
        required: [true, 'please select a category'],
        enum: [
            "TShirts", "PoloShirts", "CasualShirts", "FormalShirts", "TankTops",
            "SweatshirtsHoodies", "Jeans", "Chinos", "Trousers", "JoggersSweatpants",
            "Shorts", "Jackets", "Blazers", "Coats", "Sweaters", "GymTShirts",
            "WorkoutShorts", "TrackPants", "CompressionWear", "BriefsBoxers",
            "Vests", "Nightwear", "Thermals", "CapsHats", "Belts", "Wallets", "Socks",
            "Sneakers", "Loafers", "FormalShoes", "SandalsFlipFlops", "Kurtas",
            "Sherwanis", "NehruJackets", "Sarees", "SalwarSuits", "Lehengas"
        ]
    },
    stock: {
        type: Number,
        required: [true, "please add stock"],
        min: [0, "Stock cannot be negative"]
    }
    ,
    brand: {
        type: String,
        required: [true, 'please add a brand of clothing']
    },
    ratings: {
        type: Number,
        default: 0
    },
    numberOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String, // ✅ Fixed: Changed from Number to String
                required: true
            }
        }
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Product", productSchema);
