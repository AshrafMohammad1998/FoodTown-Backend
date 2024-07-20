const express = require("express")
const cors = require("cors")
const cookieParser = require('cookie-parser')
const userRouter = require("./routes/user.routes")
const restaurantRouter = require("./routes/restaurant.routes")
const dishRouter = require("./routes/dish.routes")
const bagRouter = require('./routes/bag.routes');
const orderRouter = require("./routes/order.routes")
const contactRouter = require("./routes/contact.routes")

const app = express()
app.use(express.json({limit:"50mb"}))
app.use(cors({origin: process.env.CORS_ORIGIN, credentials: true}))
app.use(express.urlencoded({extended: true, limit: "50mb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use( "/foodtown/api/users", userRouter)
app.use("/foodtown/api/restaurants", restaurantRouter)
app.use("/foodtown/api/dishes", dishRouter)
app.use("/foodtown/api/bags", bagRouter)
app.use("/foodtown/api/orders", orderRouter)
app.use("/foodtown/api/contact", contactRouter)

module.exports = app;                     