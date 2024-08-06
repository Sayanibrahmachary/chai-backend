class ApiResponse
{
    constructor(
        statusCode,
        message= "Success",
        errors= [],
        statck = "",
        data,
    ){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success= statusCode < 400
    }
}