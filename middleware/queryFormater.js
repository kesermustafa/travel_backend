export const formatQuery = (req, res, next) => {

    try {

        if (req.formatedLimit || req.formatedSort || req.formatedSelect) {
            req.formatedQuery = req.formatedQuery ?? {};
            return next();
        }

        let queryObj = { ...req.query };

        // 1) Filtrelemeden hariç tutulacak alanları çıkar
        const excludedFields = ['page', 'limit', 'sort', 'fields', 'populate'];
        excludedFields.forEach(field => delete queryObj[field]);

        // 2) Gelişmiş filtreleme (gte, gt, lte, lt)
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(
            /\b(gt|gte|lt|lte|ne|in|nin|regex|options|exists)\b/g,
            match => `$${match}`
        );
        queryObj = JSON.parse(queryStr);

        // 3) Array ($in, $nin) formatlaması
        for (const field in queryObj) {
            if (queryObj[field]?.$in) queryObj[field].$in = queryObj[field].$in.split(',');
            if (queryObj[field]?.$nin) queryObj[field].$nin = queryObj[field].$nin.split(',');
        }

        // Filtreyi HER ZAMAN set et (alias gelse de gelmese de filtreler çalışmalı)
        req.formatedQuery = queryObj;

        // 4) Pagination (Sadece Alias set etmediyse query'den al veya varsayılanı kullan)
        if (!req.formatedPage) {
            const page = Number(req.query.page);
            req.formatedPage = Number.isFinite(page) && page > 0 ? page : 1;
        }

        if (!req.formatedLimit) {
            const limit = Number(req.query.limit);
            req.formatedLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
        }

        // 5) Sorting
        if (!req.formatedSort) {
            if (req.query.sort) {
                req.formatedSort = {};
                req.query.sort.split(',').forEach(field => {
                    field = field.trim();
                    if (field.startsWith('-')) req.formatedSort[field.substring(1)] = -1;
                    else req.formatedSort[field] = 1;
                });
            } else {
                req.formatedSort = { createdAt: -1 }; // Varsayılan sıralama
            }
        }

        // 6) Field Limiting
        if (!req.formatedSelect) {
            req.formatedSelect = req.query.fields
                ? req.query.fields.split(',').map(f => f.trim()).join(' ')
                : null;
        }

        // 7) Populate
        if (!req.formatedPopulate) {
            req.formatedPopulate = req.query.populate
                ? req.query.populate.split(',').map(f => f.trim()).join(' ')
                : null;
        }

        next();
    } catch (error) {
        next(error);
    }
};