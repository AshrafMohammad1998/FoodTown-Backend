const mongoose = require("mongoose")
const DB_NAME = require("../constants.js")
console.log(DB_NAME, "dbname")
const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(connectionInstance.connection.host)
    } catch (error){
        console.log("MongoDB Error: ", error)
        process.exit(1)
    }
}

module.exports = connectDB;