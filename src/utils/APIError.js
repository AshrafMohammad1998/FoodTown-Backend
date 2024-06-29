class APIError {
    constructor(status, message = "Something went wrong"){
        this.status = status,
        this.message = message,
        this.success = false
    }
}


module.exports = APIError