type PaginationQuery = {
  page?: number
  limit?: number
}

export function getPagination(query: PaginationQuery) {
  const page = Math.max(query.page ?? 1, 1)
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100)
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

export function buildMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}
