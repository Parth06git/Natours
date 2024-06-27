// API Features

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryStr = queryString;
  }

  filter() {
    // 1A) Filtering
    const queryObj = { ...this.queryStr };
    const excludeFields = [
      "page",
      "sort",
      "limit",
      "fields",
    ];
    excludeFields.forEach((el) => delete queryObj[el]);

    // 1B) Advance Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    // console.log(JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // 2) Sorting
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort
        .split(",")
        .join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    // 3) Limiting Fields
    if (this.queryStr.fields) {
      let fields = this.queryStr.fields
        .split(",")
        .join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  pagination() {
    // 4) Pagination
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 25;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
