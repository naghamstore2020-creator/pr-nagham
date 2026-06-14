import { createClient } from "@supabase/supabase-js"
import type { User, Job, AiMatch } from "@prisma/client"

let _supabase: ReturnType<typeof createClient> | null = null

function getSupabase(): any {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    }
    _supabase = createClient(supabaseUrl, supabaseKey)
  }
  return _supabase
}

function selectStr(sel?: Record<string, boolean | any>): string {
  if (!sel) return "*"
  return Object.entries(sel)
    .filter(([, v]) => v === true)
    .map(([k]) => k)
    .join(", ")
}

function buildQueryStr(include?: any, sel?: Record<string, boolean | any>): string {
  if (include?.user) {
    const inner = include.user.select
      ? Object.keys(include.user.select).join(", ")
      : "*"
    if (sel) {
      const outer = Object.keys(sel).filter((k) => sel[k]).join(", ")
      return `${outer}, user:userId(${inner})`
    }
    return `*, user:userId(${inner})`
  }
  if (sel) return selectStr(sel)
  return "*"
}

function applyWhere(q: any, where?: Record<string, any>) {
  if (!where) return q
  for (const [key, value] of Object.entries(where)) {
    if (key === "NOT") {
      for (const [nk, nv] of Object.entries(value as Record<string, any>)) {
        if (nv === null) q = q.is(nk, null).not()
        else q = q.neq(nk, nv)
      }
    } else if (value === null) {
      q = q.is(key, null)
    } else if (typeof value === "object" && !Array.isArray(value)) {
      for (const [op, opVal] of Object.entries(value)) {
        if (op === "gte") q = q.gte(key, opVal)
        else if (op === "lte") q = q.lte(key, opVal)
        else if (op === "gt") q = q.gt(key, opVal)
        else if (op === "lt") q = q.lt(key, opVal)
        else if (op === "in") q = q.in(key, opVal as any[])
        else if (op === "notIn") q = q.not().in(key, opVal as any[])
        else if (op === "contains") q = q.ilike(key, `%${opVal}%`)
        else if (op === "startsWith") q = q.ilike(key, `${opVal}%`)
        else if (op === "not") q = q.neq(key, opVal)
      }
    } else if (Array.isArray(value)) {
      q = q.in(key, value)
    } else {
      q = q.eq(key, value)
    }
  }
  return q
}

/** Split an array into chunks of at most `size` items */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

const BATCH_CHUNK_SIZE = 500

function applyOrder(q: any, orderBy?: Record<string, "asc" | "desc">) {
  if (!orderBy) return q
  const [field, dir] = Object.entries(orderBy)[0]
  return q.order(field, { ascending: dir === "asc" })
}

export const db = {
  user: {
    async findUnique({ where }: { where: { id?: string; username?: string } }): Promise<User | null> {
      const key = Object.keys(where)[0]
      const { data, error } = await getSupabase().from("User").select("*").eq(key, (where as any)[key]).maybeSingle()
      if (error) throw error
      return data as User | null
    },

    async findMany({ orderBy, select }: { orderBy?: any; select?: any } = {}): Promise<any[]> {
      let q = getSupabase().from("User").select(selectStr(select))
      q = applyOrder(q, orderBy)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },

    async create({ data }: { data: any }): Promise<any> {
      const { data: result, error } = await getSupabase().from("User").insert({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data,
      }).select().single()
      if (error) throw error
      return result
    },

    async update({ where, data }: { where: { id: string }; data: any }): Promise<any> {
      const { data: result, error } = await getSupabase().from("User").update({
        ...data,
        updatedAt: new Date().toISOString(),
      }).eq("id", where.id).select().single()
      if (error) throw error
      return result
    },
  },

  job: {
    async findUnique({ where }: { where: { id: string } }): Promise<Job | null> {
      const key = Object.keys(where)[0]
      const { data, error } = await getSupabase().from("Job").select("*").eq(key, (where as any)[key]).maybeSingle()
      if (error) throw error
      return data as Job | null
    },

    async findFirst({ where, orderBy }: { where?: any; orderBy?: any } = {}): Promise<Job | null> {
      let q = getSupabase().from("Job").select("*")
      q = applyWhere(q, where)
      q = applyOrder(q, orderBy)
      const { data, error } = await q.limit(1).maybeSingle()
      if (error) throw error
      return data as Job | null
    },

    async findMany({ where, orderBy, skip, take, include, select, distinct }: {
      where?: any; orderBy?: any; skip?: number; take?: number; include?: any; select?: any; distinct?: string[]
    } = {}): Promise<any[]> {
      let q = getSupabase().from("Job").select(buildQueryStr(include, select))
      q = applyWhere(q, where)
      q = applyOrder(q, orderBy)
      if (skip != null && take != null) {
        q = q.range(skip, skip + take - 1)
      }
      const { data, error } = await q
      if (error) throw error
      let result = data || []
      if (distinct?.length) {
        const field = distinct[0]
        const seen = new Set()
        result = result.filter((item: any) => {
          const val = item[field]
          if (seen.has(val)) return false
          seen.add(val)
          return true
        })
      }
      return result
    },

    async count({ where }: { where?: any } = {}): Promise<number> {
      let q = getSupabase().from("Job").select("*", { count: "exact", head: true })
      q = applyWhere(q, where)
      const { count, error } = await q
      if (error) throw error
      return count ?? 0
    },

    async create({ data }: { data: any }): Promise<any> {
      const { aiMatches, pricingLogs, inventoryLogs, ...jobData } = data
      const now = new Date().toISOString()
      const { data: job, error } = await getSupabase().from("Job").insert({
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        ...jobData,
      }).select().single()
      if (error) throw error
      if (aiMatches?.create?.length) {
        const aiRows = aiMatches.create.map((m: any) => ({
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          ...m,
          jobId: job.id,
        }))
        for (const chunk of chunkArray(aiRows, BATCH_CHUNK_SIZE)) {
          const { error: e2 } = await getSupabase().from("AiMatch").insert(chunk)
          if (e2) throw e2
        }
      }
      if (pricingLogs?.create?.length) {
        const pricingRows = pricingLogs.create.map((m: any) => ({
          id: crypto.randomUUID(),
          createdAt: now,
          ...m,
          jobId: job.id,
        }))
        for (const chunk of chunkArray(pricingRows, BATCH_CHUNK_SIZE)) {
          const { error: e2 } = await getSupabase().from("PricingLog").insert(chunk)
          if (e2) throw e2
        }
      }
      if (inventoryLogs?.create?.length) {
        const inventoryRows = inventoryLogs.create.map((m: any) => ({
          id: crypto.randomUUID(),
          createdAt: now,
          ...m,
          jobId: job.id,
        }))
        for (const chunk of chunkArray(inventoryRows, BATCH_CHUNK_SIZE)) {
          const { error: e2 } = await getSupabase().from("InventoryLog").insert(chunk)
          if (e2) throw e2
        }
      }
      return job
    },

    async aggregate({ _sum, where }: { _sum: any; where?: any }): Promise<any> {
      const field = Object.keys(_sum)[0]
      let q = getSupabase().from("Job").select(`sum:${field}.sum()`)
      q = applyWhere(q, where)
      const { data, error } = await q
      if (error) throw error
      return { _sum: { [field]: (data as any)?.[0]?.sum ?? null } }
    },
  },

  aiMatch: {
    async findFirst({ where }: { where: any }): Promise<AiMatch | null> {
      const key = Object.keys(where)[0]
      const { data, error } = await getSupabase().from("AiMatch").select("*").eq(key, (where as any)[key]).maybeSingle()
      if (error) throw error
      return data as AiMatch | null
    },

    async findMany({ where, select }: { where?: any; select?: any } = {}): Promise<any[]> {
      let q = getSupabase().from("AiMatch").select(selectStr(select))
      q = applyWhere(q, where)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },

    async update({ where, data }: { where: { id: string }; data: any }): Promise<any> {
      const { data: result, error } = await getSupabase().from("AiMatch").update({
        ...data,
        updatedAt: new Date().toISOString(),
      }).eq("id", where.id).select().single()
      if (error) throw error
      return result
    },

    async create({ data }: { data: any }): Promise<any> {
      const now = new Date().toISOString()
      const { data: result, error } = await getSupabase().from("AiMatch").insert({
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        ...data,
      }).select().single()
      if (error) throw error
      return result
    },
  },

  auditLog: {
    async create({ data }: { data: any }): Promise<any> {
      const { data: result, error } = await getSupabase().from("AuditLog").insert({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...data,
      }).select().single()
      if (error) throw error
      return result
    },
  },
}
