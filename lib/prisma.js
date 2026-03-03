/**
 * DATABASE CONNECTION - Prisma Client
 * 
 * This file creates and exports a single database connection
 * that we'll use throughout the app.
 * 
 * IN CODEIGNITER: This is like $this->load->database()
 * But here, we create it once and reuse everywhere.
 * 
 * WHAT IS PRISMA?
 * - It's an ORM (like CodeIgniter's Query Builder)
 * - Provides type-safe database queries
 * - Auto-completes table/column names
 * - Prevents SQL injection automatically
 */

import { PrismaClient } from '@prisma/client'

// Create a global variable to store the Prisma instance
// This prevents creating multiple connections in development
let prisma

if (process.env.NODE_ENV === 'production') {
  // PRODUCTION: Create new instance
  prisma = new PrismaClient()
} else {
  // DEVELOPMENT: Reuse existing instance
  // (Next.js hot-reloads, we don't want multiple connections)
  
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'], // Show SQL queries in console (helpful for learning!)
    })
  }
  prisma = global.prisma
}

export default prisma

/**
 * HOW TO USE THIS:
 * 
 * In any file, import like this:
 * import prisma from '@/lib/prisma'
 * 
 * Then query like this:
 * const users = await prisma.user.findMany()
 * 
 * CODEIGNITER EQUIVALENT:
 * $this->db->get('users')->result()
 * 
 * But Prisma gives you auto-complete and type safety!
 */
