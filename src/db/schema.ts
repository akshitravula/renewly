import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  time,
  numeric,
  integer,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums
export const gymStatusEnum = pgEnum("gym_status", [
  "DRAFT",
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
]);

export const userRoleEnum = pgEnum("user_role", [
  "SUPERADMIN",
  "GYM_OWNER",
  "GYM_MANAGER",
  "GYM_TRAINER",
  "FRONT_DESK",
  "CUSTOMER",
]);

export const genderEnum = pgEnum("gender", ["MALE", "FEMALE", "OTHER"]);

export const genderPolicyEnum = pgEnum("gender_policy", [
  "UNISEX",
  "WOMEN_ONLY",
  "MEN_ONLY",
  "WOMEN_EXCLUSIVE_SLOTS",
]);

export const planTypeEnum = pgEnum("plan_type", [
  "GYM",
  "YOGA",
  "CROSSFIT",
  "PILATES",
  "PERSONAL_TRAINING",
  "ZUMBA",
  "COMBO",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "ACTIVE",
  "EXPIRING_SOON",
  "EXPIRED",
  "FROZEN",
  "CANCELLED",
]);

export const attendanceMethodEnum = pgEnum("attendance_method", [
  "QR_SCAN",
  "MANUAL_STAFF",
  "BIOMETRIC_WEBHOOK",
]);

export const paymentModeEnum = pgEnum("payment_mode", [
  "UPI_QR",
  "UPI_AUTOPAY",
  "PAYMENT_LINK",
  "CARD",
  "CASH",
  "BANK_TRANSFER",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "ISSUED",
  "PAID",
  "CANCELLED",
  "REFUNDED",
]);

export const leadStageEnum = pgEnum("lead_stage", [
  "NEW_ENQUIRY",
  "TRIAL_SCHEDULED",
  "TRIAL_COMPLETED",
  "TRIAL_NO_SHOW",
  "OFFER_SENT",
  "CONVERTED",
  "LOST",
]);

export const trialStatusEnum = pgEnum("trial_status", [
  "BOOKED",
  "CONFIRMED",
  "CHECKED_IN",
  "NO_SHOW",
  "CANCELLED",
]);

export const riskActionEnum = pgEnum("risk_action", [
  "REMIND_GENTLY",
  "OFFER_PAUSE_BENEFIT",
  "OFFER_RENEWAL_DISCOUNT",
  "CALL_DIRECTLY",
]);

// 1. Gyms & Tenants
export const gyms = pgTable("gyms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  legalEntityName: varchar("legal_entity_name", { length: 255 }),
  gstin: varchar("gstin", { length: 15 }),
  pan: varchar("pan", { length: 10 }),
  stateCode: varchar("state_code", { length: 2 }).notNull().default("29"), // Default 29 = Karnataka (Bengaluru)
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  status: gymStatusEnum("status").notNull().default("ACTIVE"),
  isClaimed: boolean("is_claimed").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Branches
export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  addressLine1: varchar("address_line1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line2", { length: 255 }),
  landmark: varchar("landmark", { length: 255 }),
  locality: varchar("locality", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull().default("Bengaluru"),
  state: varchar("state", { length: 100 }).notNull().default("Karnataka"),
  pincode: varchar("pincode", { length: 6 }).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  phone: varchar("phone", { length: 20 }),
  operatingHours: jsonb("operating_hours").notNull().default({
    monday: { open: "06:00", close: "22:00", isOpen: true },
    tuesday: { open: "06:00", close: "22:00", isOpen: true },
    wednesday: { open: "06:00", close: "22:00", isOpen: true },
    thursday: { open: "06:00", close: "22:00", isOpen: true },
    friday: { open: "06:00", close: "22:00", isOpen: true },
    saturday: { open: "06:00", close: "21:00", isOpen: true },
    sunday: { open: "07:00", close: "13:00", isOpen: true },
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("branch_locality_idx").on(t.locality),
  index("branch_city_idx").on(t.city),
  index("branch_pincode_idx").on(t.pincode),
]);

// 3. Users & Auth
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  role: userRoleEnum("role").notNull().default("CUSTOMER"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Gym Staff
export const gymStaff = pgTable("gym_staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: userRoleEnum("role").notNull().default("FRONT_DESK"),
  permissions: jsonb("permissions").default(["READ", "WRITE_ATTENDANCE", "WRITE_PAYMENTS"]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Verification Documents
export const verificationDocuments = pgTable("verification_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  documentType: varchar("document_type", { length: 50 }).notNull(),
  documentUrl: varchar("document_url", { length: 500 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("PENDING"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Amenities Master & Gym Amenities
export const amenities = pgTable("amenities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 50 }).notNull(), // COMFORT, EQUIPMENT, FACILITY, SAFETY
  icon: varchar("icon", { length: 50 }).notNull().default("check"),
});

export const gymAmenities = pgTable("gym_amenities", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  amenityId: uuid("amenity_id").references(() => amenities.id, { onDelete: "cascade" }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  details: varchar("details", { length: 255 }),
});

// 7. Trainers
export const trainers = pgTable("trainers", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  specializations: jsonb("specializations").default(["Weight Loss", "Strength Training"]),
  certifications: jsonb("certifications").default(["ACE", "K11"]),
  languagesSpoken: jsonb("languages_spoken").default(["English", "Hindi", "Kannada"]),
  bio: text("bio"),
  photoUrl: varchar("photo_url", { length: 500 }),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Plans
export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  planType: planTypeEnum("plan_type").notNull().default("GYM"),
  durationMonths: integer("duration_months").notNull().default(1),
  durationDays: integer("duration_days").notNull().default(30),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  joiningFee: numeric("joining_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  gstRatePercent: numeric("gst_rate_percent", { precision: 4, scale: 2 }).notNull().default("18.00"),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  sessionsLimit: integer("sessions_limit"),
  isPublic: boolean("is_public").notNull().default(true), // Auto-reflected on public listing
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Listings (Public projection)
export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull().unique(),
  branchId: uuid("branch_id").references(() => branches.id, { onDelete: "cascade" }),
  headline: varchar("headline", { length: 255 }).notNull(),
  description: text("description").notNull(),
  genderPolicy: genderPolicyEnum("gender_policy").notNull().default("UNISEX"),
  womenOnlySlots: jsonb("women_only_slots"),
  startingPriceMonthly: numeric("starting_price_monthly", { precision: 10, scale: 2 }),
  isVerified: boolean("is_verified").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  featuredUntil: timestamp("featured_until"),
  listingQualityScore: integer("listing_quality_score").default(80),
  publishedStatus: varchar("published_status", { length: 20 }).notNull().default("PUBLISHED"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 10. Listing Photos
export const listingPhotos = pgTable("listing_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  photoUrl: varchar("photo_url", { length: 500 }).notNull(),
  caption: varchar("caption", { length: 255 }),
  tag: varchar("tag", { length: 50 }).notNull().default("WORKOUT_FLOOR"),
  displayOrder: integer("display_order").notNull().default(0),
  isCover: boolean("is_cover").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 11. Members
export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull().default(""),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  gender: genderEnum("gender").notNull().default("MALE"),
  dob: date("dob"),
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  medicalNotes: text("medical_notes"),
  tags: jsonb("tags").default([]),
  status: membershipStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("member_gym_phone_idx").on(t.gymId, t.phone),
  index("member_phone_idx").on(t.phone),
]);

// 12. Memberships
export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  planId: uuid("plan_id").references(() => plans.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  originalEndDate: date("original_end_date").notNull(),
  status: membershipStatusEnum("status").notNull().default("ACTIVE"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  amountDue: numeric("amount_due", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("membership_end_date_idx").on(t.endDate),
]);

// 13. Membership Pauses / Freezes
export const membershipPauses = pgTable("membership_pauses", {
  id: uuid("id").primaryKey().defaultRandom(),
  membershipId: uuid("membership_id").references(() => memberships.id, { onDelete: "cascade" }).notNull(),
  pauseStartDate: date("pause_start_date").notNull(),
  pauseEndDate: date("pause_end_date").notNull(),
  daysExtended: integer("days_extended").notNull(),
  reason: text("reason").notNull(),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 14. Family Links
export const familyLinks = pgTable("family_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  primaryMemberId: uuid("primary_member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  secondaryMemberId: uuid("secondary_member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  relation: varchar("relation", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 15. Attendance Logs
export const attendanceLogs = pgTable("attendance_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  checkInTime: timestamp("check_in_time").defaultNow().notNull(),
  checkOutTime: timestamp("check_out_time"),
  method: attendanceMethodEnum("method").notNull().default("QR_SCAN"),
  deviceIdentifier: varchar("device_identifier", { length: 100 }),
}, (t) => [
  index("attendance_gym_checkin_idx").on(t.gymId, t.checkInTime),
  index("attendance_member_checkin_idx").on(t.memberId, t.checkInTime),
]);

// 16. Busy Hour Aggregates (Live "Usually busy at" data)
export const busyHourAggregates = pgTable("busy_hour_aggregates", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  hourOfDay: integer("hour_of_day").notNull(), // 0 - 23
  relativeBusynessScore: integer("relative_busyness_score").notNull().default(0), // 0 - 100
  sampleCount: integer("sample_count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("busy_hour_gym_day_hour_idx").on(t.gymId, t.dayOfWeek, t.hourOfDay),
]);

// 17. Invoices (Indian GST Compliance)
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  financialYear: varchar("financial_year", { length: 10 }).notNull().default("26-27"),
  memberId: uuid("member_id").references(() => members.id).notNull(),
  membershipId: uuid("membership_id").references(() => memberships.id),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerGstin: varchar("customer_gstin", { length: 15 }),
  customerStateCode: varchar("customer_state_code", { length: 2 }).notNull().default("29"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  cgstAmount: numeric("cgst_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  sgstAmount: numeric("sgst_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  igstAmount: numeric("igst_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  totalTax: numeric("total_tax", { precision: 10, scale: 2 }).notNull(),
  grandTotal: numeric("grand_total", { precision: 10, scale: 2 }).notNull(),
  hsnSacCode: varchar("hsn_sac_code", { length: 10 }).notNull().default("999723"), // Fitness & Gym Services
  status: invoiceStatusEnum("status").notNull().default("ISSUED"),
  pdfUrl: varchar("pdf_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 18. Payments
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  memberId: uuid("member_id").references(() => members.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMode: paymentModeEnum("payment_mode").notNull().default("UPI_QR"),
  transactionRef: varchar("transaction_ref", { length: 100 }),
  gatewayOrderId: varchar("gateway_order_id", { length: 100 }),
  gatewayPaymentId: varchar("gateway_payment_id", { length: 100 }),
  status: varchar("status", { length: 30 }).notNull().default("SUCCESS"),
  idempotencyKey: varchar("idempotency_key", { length: 100 }).unique(),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
});

// 19. Leads CRM & Free Trials
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  source: varchar("source", { length: 50 }).notNull().default("PUBLIC_SEARCH"),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).default(""),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  stage: leadStageEnum("stage").notNull().default("NEW_ENQUIRY"),
  intent: text("intent"),
  assignedStaffId: uuid("assigned_staff_id").references(() => users.id),
  aiLeadScore: integer("ai_lead_score").default(50),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trials = pgTable("trials", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  bookingDate: date("booking_date").notNull(),
  slotStart: time("slot_start").notNull(),
  slotEnd: time("slot_end").notNull(),
  passQrCode: varchar("pass_qr_code", { length: 255 }).notNull().unique(),
  status: trialStatusEnum("status").notNull().default("BOOKED"),
  checkedInAt: timestamp("checked_in_at"),
  postTrialFeedback: text("post_trial_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 20. Renewals Risk & Retention Engine
export const renewalRiskScores = pgTable("renewal_risk_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
  riskScore: integer("risk_score").notNull(), // 0 (Low risk / loyal) to 100 (Critical churn risk)
  factors: jsonb("factors").notNull().default({}),
  explanation: text("explanation").notNull(),
  recommendedAction: riskActionEnum("recommended_action").notNull().default("REMIND_GENTLY"),
  isHoldoutControl: boolean("is_holdout_control").notNull().default(false),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
}, (t) => [
  index("risk_member_idx").on(t.memberId),
]);

// 21. Communication Logs & Message Templates
export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  channel: varchar("channel", { length: 30 }).notNull().default("WHATSAPP"), // WHATSAPP, SMS
  language: varchar("language", { length: 20 }).notNull().default("en"), // en, hi, hinglish
  body: text("body").notNull(),
  dltTemplateId: varchar("dlt_template_id", { length: 50 }),
  isApproved: boolean("is_approved").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communicationLogs = pgTable("communication_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  memberId: uuid("member_id").references(() => members.id),
  channel: varchar("channel", { length: 30 }).notNull(),
  recipientPhone: varchar("recipient_phone", { length: 20 }).notNull(),
  messageText: text("message_text").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("DELIVERED"),
  responseReceived: text("response_received"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// 22. Verified Reviews
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1 to 5
  reviewText: text("review_text").notNull(),
  verificationProofType: varchar("verification_proof_type", { length: 50 }).notNull().default("MEMBER_CHECKIN"),
  verificationRefId: uuid("verification_ref_id"),
  status: varchar("status", { length: 30 }).notNull().default("PUBLISHED"), // PUBLISHED, FLAGGED_ABUSE, MODERATED
  helpfulCount: integer("helpful_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewResponses = pgTable("review_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id").references(() => reviews.id, { onDelete: "cascade" }).notNull().unique(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  responseText: text("response_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 23. Configurable Platform Fee Ledger
export const platformFeeLedger = pgTable("platform_fee_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  gymId: uuid("gym_id").references(() => gyms.id, { onDelete: "cascade" }).notNull(),
  feeType: varchar("fee_type", { length: 50 }).notNull(), // SAAS_SUBSCRIPTION, VERIFIED_LEAD_FEE, TRIAL_BOOKING_FEE, MEMBERSHIP_COMMISSION, FEATURED_PLACEMENT
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  referenceId: uuid("reference_id"),
  isSettled: boolean("is_settled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 24. DPDP Act Consents
export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  gymId: uuid("gym_id").references(() => gyms.id),
  consentPurpose: varchar("consent_purpose", { length: 100 }).notNull(),
  isGranted: boolean("is_granted").notNull().default(true),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
