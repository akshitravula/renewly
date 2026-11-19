CREATE TYPE "public"."attendance_method" AS ENUM('QR_SCAN', 'MANUAL_STAFF', 'BIOMETRIC_WEBHOOK');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."gender_policy" AS ENUM('UNISEX', 'WOMEN_ONLY', 'MEN_ONLY', 'WOMEN_EXCLUSIVE_SLOTS');--> statement-breakpoint
CREATE TYPE "public"."gym_status" AS ENUM('DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('ISSUED', 'PAID', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."lead_stage" AS ENUM('NEW_ENQUIRY', 'TRIAL_SCHEDULED', 'TRIAL_COMPLETED', 'TRIAL_NO_SHOW', 'OFFER_SENT', 'CONVERTED', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'FROZEN', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('UPI_QR', 'UPI_AUTOPAY', 'PAYMENT_LINK', 'CARD', 'CASH', 'BANK_TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('GYM', 'YOGA', 'CROSSFIT', 'PILATES', 'PERSONAL_TRAINING', 'ZUMBA', 'COMBO');--> statement-breakpoint
CREATE TYPE "public"."risk_action" AS ENUM('REMIND_GENTLY', 'OFFER_PAUSE_BENEFIT', 'OFFER_RENEWAL_DISCOUNT', 'CALL_DIRECTLY');--> statement-breakpoint
CREATE TYPE "public"."trial_status" AS ENUM('BOOKED', 'CONFIRMED', 'CHECKED_IN', 'NO_SHOW', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SUPERADMIN', 'GYM_OWNER', 'GYM_MANAGER', 'GYM_TRAINER', 'FRONT_DESK', 'CUSTOMER');--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"icon" varchar(50) DEFAULT 'check' NOT NULL,
	CONSTRAINT "amenities_name_unique" UNIQUE("name"),
	CONSTRAINT "amenities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"check_in_time" timestamp DEFAULT now() NOT NULL,
	"check_out_time" timestamp,
	"method" "attendance_method" DEFAULT 'QR_SCAN' NOT NULL,
	"device_identifier" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"landmark" varchar(255),
	"locality" varchar(100) NOT NULL,
	"city" varchar(100) DEFAULT 'Bengaluru' NOT NULL,
	"state" varchar(100) DEFAULT 'Karnataka' NOT NULL,
	"pincode" varchar(6) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"phone" varchar(20),
	"operating_hours" jsonb DEFAULT '{"monday":{"open":"06:00","close":"22:00","isOpen":true},"tuesday":{"open":"06:00","close":"22:00","isOpen":true},"wednesday":{"open":"06:00","close":"22:00","isOpen":true},"thursday":{"open":"06:00","close":"22:00","isOpen":true},"friday":{"open":"06:00","close":"22:00","isOpen":true},"saturday":{"open":"06:00","close":"21:00","isOpen":true},"sunday":{"open":"07:00","close":"13:00","isOpen":true}}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "busy_hour_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"hour_of_day" integer NOT NULL,
	"relative_busyness_score" integer DEFAULT 0 NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"member_id" uuid,
	"channel" varchar(30) NOT NULL,
	"recipient_phone" varchar(20) NOT NULL,
	"message_text" text NOT NULL,
	"status" varchar(30) DEFAULT 'DELIVERED' NOT NULL,
	"response_received" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gym_id" uuid,
	"consent_purpose" varchar(100) NOT NULL,
	"is_granted" boolean DEFAULT true NOT NULL,
	"ip_address" varchar(50),
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary_member_id" uuid NOT NULL,
	"secondary_member_id" uuid NOT NULL,
	"relation" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gym_amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"amenity_id" uuid NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"details" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "gym_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "user_role" DEFAULT 'FRONT_DESK' NOT NULL,
	"permissions" jsonb DEFAULT '["READ","WRITE_ATTENDANCE","WRITE_PAYMENTS"]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gyms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"legal_entity_name" varchar(255),
	"gstin" varchar(15),
	"pan" varchar(10),
	"state_code" varchar(2) DEFAULT '29' NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"status" "gym_status" DEFAULT 'ACTIVE' NOT NULL,
	"is_claimed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gyms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"financial_year" varchar(10) DEFAULT '26-27' NOT NULL,
	"member_id" uuid NOT NULL,
	"membership_id" uuid,
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"customer_gstin" varchar(15),
	"customer_state_code" varchar(2) DEFAULT '29' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"cgst_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"sgst_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"igst_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_tax" numeric(10, 2) NOT NULL,
	"grand_total" numeric(10, 2) NOT NULL,
	"hsn_sac_code" varchar(10) DEFAULT '999723' NOT NULL,
	"status" "invoice_status" DEFAULT 'ISSUED' NOT NULL,
	"pdf_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"source" varchar(50) DEFAULT 'PUBLIC_SEARCH' NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) DEFAULT '',
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"stage" "lead_stage" DEFAULT 'NEW_ENQUIRY' NOT NULL,
	"intent" text,
	"assigned_staff_id" uuid,
	"ai_lead_score" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"photo_url" varchar(500) NOT NULL,
	"caption" varchar(255),
	"tag" varchar(50) DEFAULT 'WORKOUT_FLOOR' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"branch_id" uuid,
	"headline" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"gender_policy" "gender_policy" DEFAULT 'UNISEX' NOT NULL,
	"women_only_slots" jsonb,
	"starting_price_monthly" numeric(10, 2),
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_until" timestamp,
	"listing_quality_score" integer DEFAULT 80,
	"published_status" varchar(20) DEFAULT 'PUBLISHED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "listings_gym_id_unique" UNIQUE("gym_id")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) DEFAULT '' NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"gender" "gender" DEFAULT 'MALE' NOT NULL,
	"dob" date,
	"emergency_contact_name" varchar(100),
	"emergency_contact_phone" varchar(20),
	"medical_notes" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"status" "membership_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_pauses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"pause_start_date" date NOT NULL,
	"pause_end_date" date NOT NULL,
	"days_extended" integer NOT NULL,
	"reason" text NOT NULL,
	"approved_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"original_end_date" date NOT NULL,
	"status" "membership_status" DEFAULT 'ACTIVE' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"amount_due" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"channel" varchar(30) DEFAULT 'WHATSAPP' NOT NULL,
	"language" varchar(20) DEFAULT 'en' NOT NULL,
	"body" text NOT NULL,
	"dlt_template_id" varchar(50),
	"is_approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"invoice_id" uuid,
	"member_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_mode" "payment_mode" DEFAULT 'UPI_QR' NOT NULL,
	"transaction_ref" varchar(100),
	"gateway_order_id" varchar(100),
	"gateway_payment_id" varchar(100),
	"status" varchar(30) DEFAULT 'SUCCESS' NOT NULL,
	"idempotency_key" varchar(100),
	"paid_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"plan_type" "plan_type" DEFAULT 'GYM' NOT NULL,
	"duration_months" integer DEFAULT 1 NOT NULL,
	"duration_days" integer DEFAULT 30 NOT NULL,
	"base_price" numeric(10, 2) NOT NULL,
	"joining_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"gst_rate_percent" numeric(4, 2) DEFAULT '18.00' NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"sessions_limit" integer,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_fee_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"fee_type" varchar(50) NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"reference_id" uuid,
	"is_settled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "renewal_risk_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"risk_score" integer NOT NULL,
	"factors" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"explanation" text NOT NULL,
	"recommended_action" "risk_action" DEFAULT 'REMIND_GENTLY' NOT NULL,
	"is_holdout_control" boolean DEFAULT false NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"gym_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"response_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "review_responses_review_id_unique" UNIQUE("review_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"review_text" text NOT NULL,
	"verification_proof_type" varchar(50) DEFAULT 'MEMBER_CHECKIN' NOT NULL,
	"verification_ref_id" uuid,
	"status" varchar(30) DEFAULT 'PUBLISHED' NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"specializations" jsonb DEFAULT '["Weight Loss","Strength Training"]'::jsonb,
	"certifications" jsonb DEFAULT '["ACE","K11"]'::jsonb,
	"languages_spoken" jsonb DEFAULT '["English","Hindi","Kannada"]'::jsonb,
	"bio" text,
	"photo_url" varchar(500),
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"user_id" uuid,
	"booking_date" date NOT NULL,
	"slot_start" time NOT NULL,
	"slot_end" time NOT NULL,
	"pass_qr_code" varchar(255) NOT NULL,
	"status" "trial_status" DEFAULT 'BOOKED' NOT NULL,
	"checked_in_at" timestamp,
	"post_trial_feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trials_pass_qr_code_unique" UNIQUE("pass_qr_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"full_name" varchar(255) NOT NULL,
	"avatar_url" varchar(500),
	"role" "user_role" DEFAULT 'CUSTOMER' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "verification_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gym_id" uuid NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_url" varchar(500) NOT NULL,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "busy_hour_aggregates" ADD CONSTRAINT "busy_hour_aggregates_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_primary_member_id_members_id_fk" FOREIGN KEY ("primary_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_secondary_member_id_members_id_fk" FOREIGN KEY ("secondary_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gym_amenities" ADD CONSTRAINT "gym_amenities_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gym_amenities" ADD CONSTRAINT "gym_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gym_staff" ADD CONSTRAINT "gym_staff_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gym_staff" ADD CONSTRAINT "gym_staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_staff_id_users_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_pauses" ADD CONSTRAINT "membership_pauses_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_pauses" ADD CONSTRAINT "membership_pauses_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fee_ledger" ADD CONSTRAINT "platform_fee_ledger_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renewal_risk_scores" ADD CONSTRAINT "renewal_risk_scores_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "renewal_risk_scores" ADD CONSTRAINT "renewal_risk_scores_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trials" ADD CONSTRAINT "trials_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trials" ADD CONSTRAINT "trials_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trials" ADD CONSTRAINT "trials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_gym_id_gyms_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gyms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_gym_checkin_idx" ON "attendance_logs" USING btree ("gym_id","check_in_time");--> statement-breakpoint
CREATE INDEX "attendance_member_checkin_idx" ON "attendance_logs" USING btree ("member_id","check_in_time");--> statement-breakpoint
CREATE INDEX "branch_locality_idx" ON "branches" USING btree ("locality");--> statement-breakpoint
CREATE INDEX "branch_city_idx" ON "branches" USING btree ("city");--> statement-breakpoint
CREATE INDEX "branch_pincode_idx" ON "branches" USING btree ("pincode");--> statement-breakpoint
CREATE UNIQUE INDEX "busy_hour_gym_day_hour_idx" ON "busy_hour_aggregates" USING btree ("gym_id","day_of_week","hour_of_day");--> statement-breakpoint
CREATE UNIQUE INDEX "member_gym_phone_idx" ON "members" USING btree ("gym_id","phone");--> statement-breakpoint
CREATE INDEX "member_phone_idx" ON "members" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "membership_end_date_idx" ON "memberships" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "risk_member_idx" ON "renewal_risk_scores" USING btree ("member_id");