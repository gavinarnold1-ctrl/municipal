import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Core property table — source: CitySquared (20,404 records)
export const parcels = pgTable("parcels", {
  id: serial("id").primaryKey(),
  parcelId: integer("parcel_id").unique(),
  legalAddress: text("legal_address").notNull(),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  propertyClass: text("property_class"),
  parcelZone: text("parcel_zone"),
  taxesOwed: boolean("taxes_owed").default(false),
  legalCity: text("legal_city"),
  legalZip: text("legal_zip"),
  acreage: numeric("acreage"),
  unitNo: text("unit_no"),
  ownerName: text("owner_name"),
  ownerFirstName: text("owner_first_name"),
  ownerLastName: text("owner_last_name"),
  printKey: text("print_key"),
  normalizedAddress: text("normalized_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Veoci LCI dashboard (3,590 records)
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  complaintNumber: text("complaint_number").unique(),
  status: text("status"),
  type: text("type"),
  inspectorCode: text("inspector_code"),
  sourceSearch: text("source_search"),
  parcelId: integer("parcel_id").references(() => parcels.id),
  // Year derived from complaint number (e.g. C-23-01487 → 2023). Null for
  // pre-2000 legacy rows whose IDs lack the year segment.
  filedYear: integer("filed_year"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Veoci LCI dashboard (2,917 records)
export const licenses = pgTable("licenses", {
  id: serial("id").primaryKey(),
  licenseNumber: text("license_number"),
  status: text("status"),
  licenseType: text("license_type"),
  expirationDate: text("expiration_date"),
  sourceSearch: text("source_search"),
  isExpired: boolean("is_expired").default(false),
  parcelId: integer("parcel_id").references(() => parcels.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Veoci LCI dashboard (1,180 records)
export const antiBlight = pgTable("anti_blight", {
  id: serial("id").primaryKey(),
  caseNumber: text("case_number").unique(),
  status: text("status"),
  sourceSearch: text("source_search"),
  parcelId: integer("parcel_id").references(() => parcels.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Veoci LCI dashboard (1,115 records)
export const housingCodeViolations = pgTable("housing_code_violations", {
  id: serial("id").primaryKey(),
  caseNumber: text("case_number").unique(),
  status: text("status"),
  sourceSearch: text("source_search"),
  parcelId: integer("parcel_id").references(() => parcels.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Deduplicated owners with portfolio-level stats
export const owners = pgTable("owners", {
  id: serial("id").primaryKey(),
  name: text("name").unique(),
  propertyCount: integer("property_count").default(0),
  llcNetwork: text("llc_network"),
  riskScore: integer("risk_score").default(0),
  openComplaints: integer("open_complaints").default(0),
  expiredLicenses: integer("expired_licenses").default(0),
  unresolvedBlight: integer("unresolved_blight").default(0),
  pendingViolations: integer("pending_violations").default(0),
  totalComplaints: integer("total_complaints").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const llcNetworks = pgTable("llc_networks", {
  id: serial("id").primaryKey(),
  name: text("name").unique(),
  entityCount: integer("entity_count").default(0),
  propertyCount: integer("property_count").default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const foiaRequests = pgTable("foia_requests", {
  id: serial("id").primaryKey(),
  requestNumber: text("request_number"),
  title: text("title"),
  department: text("department"),
  dateFiled: date("date_filed"),
  deadline: date("deadline"),
  status: text("status"),
  responseSummary: text("response_summary"),
  filedVia: text("filed_via"),
  contact: text("contact"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Parcel = typeof parcels.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type License = typeof licenses.$inferSelect;
export type AntiBlight = typeof antiBlight.$inferSelect;
export type HousingCodeViolation = typeof housingCodeViolations.$inferSelect;
export type Owner = typeof owners.$inferSelect;
export type LlcNetwork = typeof llcNetworks.$inferSelect;
export type FoiaRequest = typeof foiaRequests.$inferSelect;
