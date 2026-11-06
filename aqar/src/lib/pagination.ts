import { z } from "zod";

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export const paginationQueryFields = {
  page: z.coerce.number().int().min(1).max(100000).default(1),

  // 100 is allowed for existing internal selectors.
  // The management UI offers 10, 20, and 50.
  limit: z.coerce
    .number()
    .int()
    .refine(
      (value) => [10, 20, 50, 100].includes(value),
      "عدد العناصر غير مدعوم",
    )
    .default(20),
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function createPagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
