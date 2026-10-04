import { Pool } from "pg";
import { PgOrderRepository } from "./pg";
import type { OrderRepository } from "./types";
import { loadConfig } from "../server/config";

let pool: Pool | undefined;
let override: OrderRepository | undefined;

export function getPool(): Pool {
  if (!pool) {
    const { databaseUrl } = loadConfig();
    if (!databaseUrl) throw new Error("DATABASE_URL não configurada");
    pool = new Pool({ connectionString: databaseUrl, max: 5, idleTimeoutMillis: 10_000 });
  }
  return pool;
}

export function getOrderRepository(): OrderRepository {
  return override ?? new PgOrderRepository(getPool());
}

/** Somente para testes. */
export function setOrderRepositoryForTests(repo: OrderRepository | undefined) {
  override = repo;
}

export type { Order, OrderRepository } from "./types";
