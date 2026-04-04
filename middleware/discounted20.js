export const discounted20 = (req, res, next) => {
    // PriceDiscount olan yani indirimli ürünler
    req.formatedQuery = {
        priceDiscount: { $exists: true, $gte: 20 } // discount varsa ve 0'dan büyükse
    };

    req.formatedPage = 1;
    req.formatedLimit = 10;
    req.formatedSort = {priceDiscount: -1, price: 1 };
    req.formatedSelect = "name price priceDiscount finalPrice difficulty ratingsAverage";

    next();
};