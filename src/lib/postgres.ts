import { Pool, QueryResult, QueryResultRow } from 'pg'  

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error('Please define DATABASE_URL or POSTGRES_URL environment variable')
}

// Create a singleton pool
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
    
    pool.on('error', (err: any) => {
      console.error('Unexpected error on idle PostgreSQL client', err)
    })
  }
  return pool
}

export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T & QueryResultRow>> {
  const pool = getPool()
  return pool.query<T & QueryResultRow>(text, params)
}

export async function getClient() {
  const pool = getPool()
  return pool.connect()
}

// Helper to convert snake_case to camelCase
export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase)
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = toCamelCase(obj[key])
      return result
    }, {} as any)
  }
  return obj
}

// Helper to convert camelCase to snake_case
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      result[snakeKey] = toSnakeCase(obj[key])
      return result
    }, {} as any)
  }
  return obj
}

export default { query, getClient, getPool, toCamelCase, toSnakeCase }


