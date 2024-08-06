const asynHandler = (requestHandler) =>
{
    (req,res,next)=>
    {
        Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
    }
}


export {asynHandler}


//2nd method
// const asynHandler=(fun) => async (req,res,next)=>
// {
//     try{

//         await fun(req,res,next)
//     }
//     catch(error){
//         res.status(error.code || 500).json
//         ({
//             success: false,
//             message: error.message,
//         })
//     }
// }