function parsePagination(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 10);
  if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
    const err = new Error('page and limit must be positive integers');
    err.status = 400;
    err.body = { error: 'page and limit must be positive integers' };
    throw err;
  }
  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { parsePagination };
