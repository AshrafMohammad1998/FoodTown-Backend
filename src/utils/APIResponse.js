class APIResponse {
    constructor(status, data, message = "Successfull"){
        this.status = status,
        this.data = data,
        this.message = message,
        this.success = status < 400
    }
}


module.exports = APIResponse