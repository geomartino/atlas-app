import Dexie, { type Table } from 'dexie'
import type { Etape } from '../types'

class AtlasDB extends Dexie {
  etapes!: Table<Etape, string>

  constructor() {
    super('atlas-db')
    this.version(1).stores({
      etapes: 'id, numero',
    })
  }
}

export const db = new AtlasDB()

export async function seedDB(etapes: Etape[]): Promise<void> {
  const count = await db.etapes.count()
  if (count === 0) {
    await db.etapes.bulkPut(etapes)
  }
}

export async function getAllEtapes(): Promise<Etape[]> {
  return db.etapes.orderBy('numero').toArray()
}
