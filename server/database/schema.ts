import {
  pgTable,
  serial,
  text,
  doublePrecision,
  integer,
  jsonb,
  timestamp,
  date,
  boolean,
  pgEnum
} from 'drizzle-orm/pg-core'
import { user } from './auth-schema'

// Re-export auth schema
export * from './auth-schema'

// Enums for rate types
export const rateTypeEnum = pgEnum('rate_type', ['variable', 'fixed', 'mixed'])
export const euriborPeriodEnum = pgEnum('euribor_period', ['3m', '6m', '12m'])

// Euribor rates historical table
export const euriborRates = pgTable('euribor_rates', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  rate3m: doublePrecision('rate_3m'), // Euribor 3 months rate
  rate6m: doublePrecision('rate_6m'), // Euribor 6 months rate
  rate12m: doublePrecision('rate_12m'), // Euribor 12 months rate
  isOfficial: boolean('is_official').default(false), // True if it's the official monthly average
  createdAt: timestamp('created_at').defaultNow()
})

export type EuriborRate = typeof euriborRates.$inferSelect
export type NewEuriborRate = typeof euriborRates.$inferInsert

export const simulations = pgTable('simulations', {
  id: serial('id').primaryKey(),
  publicId: text('public_id').notNull().unique(), // UUID for shareable links
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }), // Optional: anonymous simulations allowed
  name: text('name'), // User-defined name for the simulation
  loanAmount: doublePrecision('loan_amount').notNull(),
  interestRate: doublePrecision('interest_rate').notNull(), // TAN (Euribor + Spread)
  euribor: doublePrecision('euribor'),
  spread: doublePrecision('spread'),
  termMonths: integer('term_months').notNull(),
  stampDutyRate: doublePrecision('stamp_duty_rate').default(0.04),
  insuranceRate: doublePrecision('insurance_rate').default(0),
  // New fields for rate intelligence
  rateType: rateTypeEnum('rate_type').default('variable'), // Type of interest rate
  euriborPeriod: euriborPeriodEnum('euribor_period'), // Euribor revision period (3m, 6m, 12m)
  contractStartDate: date('contract_start_date'), // When the contract started (useful for mixed rates)
  nextRevisionDate: date('next_revision_date'), // When the next rate revision happens
  amortizationTable: jsonb('amortization_table'), // Cached calculated table
  summary: jsonb('summary'), // Cached summary (monthlyPayment, totalInterest, etc.)
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
})

export type Simulation = typeof simulations.$inferSelect
export type NewSimulation = typeof simulations.$inferInsert
