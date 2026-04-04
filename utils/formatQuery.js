export const formatQuery = (req,res)  => {
    try {
        let queryObj = { ...req.query };

        // MongoDB operator conversion
        queryObj = JSON.stringify(queryObj);

        queryObj = queryObj.replace(
            /\b(gt|gte|lt|lte|ne|in|nin|regex|options|exists)\b/g,
            match => `$${match}`
        );

       return queryObj = JSON.parse(queryObj);
    } catch (error) {
        console.log(error.message);
    }
}