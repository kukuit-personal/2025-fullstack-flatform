export type QueryState = {
  page: number;
  limit: number;
  name: string;
  tag: string;
  createdFrom: string;
  createdTo: string;
  statusIds: number[];
  customerId: string;
  sortBy: "updatedAt" | "createdAt" | "name" | "price";
  sortDir: "asc" | "desc";
};
