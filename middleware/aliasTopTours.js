export const aliasTopTours = (req, res, next) => {

    req.formatedQuery = {
        price: { $lte: 1200 }
    };
    req.formatedPage = 1;
    req.formatedLimit = 5;
    req.formatedSort = { price: 1, ratingsAverage: -1 };
    req.formatedSelect = "name price difficulty ratingsAverage";

    next();
};