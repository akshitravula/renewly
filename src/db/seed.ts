/**
 * Seed script for Bengaluru launch
 * Populates real fitness studios, plans, amenities, trainers, members, check-ins, and invoices.
 */

import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_iXNzdYE8F0Mf@ep-withered-mode-aobdsjbq-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function seed() {
  const sql = postgres(connectionString, { max: 1 });
  console.log("Seeding database with Bengaluru launch data...");

  try {
    // 1. Amenities Master
    const amenitiesList = [
      { name: "Air Conditioning", slug: "air-conditioning", category: "COMFORT", icon: "wind" },
      { name: "Showers & Changing Rooms", slug: "showers", category: "FACILITY", icon: "shower" },
      { name: "Steam Bath", slug: "steam-bath", category: "COMFORT", icon: "cloud" },
      { name: "Lockers", slug: "lockers", category: "FACILITY", icon: "lock" },
      { name: "Valet / Free Parking", slug: "parking", category: "FACILITY", icon: "car" },
      { name: "Olympic Barbells & Bumper Plates", slug: "olympic-barbells", category: "EQUIPMENT", icon: "dumbbell" },
      { name: "Certified Personal Trainers", slug: "personal-trainers", category: "SAFETY", icon: "user-check" },
      { name: "Cardio Zone (Treadmills, Rowers)", slug: "cardio-zone", category: "EQUIPMENT", icon: "activity" },
      { name: "CrossFit Rig & Turf", slug: "crossfit-rig", category: "EQUIPMENT", icon: "zap" },
      { name: "Free High-Speed Wi-Fi", slug: "wifi", category: "COMFORT", icon: "wifi" },
      { name: "Protein Shake Bar / Cafe", slug: "cafe", category: "COMFORT", icon: "coffee" },
      { name: "Swimming Pool", slug: "swimming-pool", category: "FACILITY", icon: "waves" },
    ];

    for (const a of amenitiesList) {
      await sql`
        INSERT INTO amenities (name, slug, category, icon)
        VALUES (${a.name}, ${a.slug}, ${a.category}, ${a.icon})
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;
      `;
    }
    console.log("✓ Seeded amenities master");

    // 2. Users (Superadmin & Gym Owners)
    const [adminUser] = await sql`
      INSERT INTO users (phone, email, full_name, role, is_verified)
      VALUES ('9800000001', 'admin@renewly.fit', 'Renewly Admin', 'SUPERADMIN', true)
      ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `;

    const [ironforgeOwner] = await sql`
      INSERT INTO users (phone, email, full_name, role, is_verified)
      VALUES ('9876500001', 'vikram@ironforge.fit', 'Vikram Malhotra', 'GYM_OWNER', true)
      ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `;

    const [shaktiOwner] = await sql`
      INSERT INTO users (phone, email, full_name, role, is_verified)
      VALUES ('9876500003', 'divya@shaktifitness.in', 'Divya Rao', 'GYM_OWNER', true)
      ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `;

    const [cultpulseOwner] = await sql`
      INSERT INTO users (phone, email, full_name, role, is_verified)
      VALUES ('9876500004', 'karthik@cultpulse.fit', 'Karthik Nair', 'GYM_OWNER', true)
      ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id;
    `;
    console.log("✓ Seeded platform users");

    // 3. Gym 1: IronForge Fitness (Koramangala 5th Block)
    const [ironforgeGym] = await sql`
      INSERT INTO gyms (name, slug, legal_entity_name, gstin, pan, state_code, phone, email, status, is_claimed)
      VALUES (
        'IronForge Fitness & Performance',
        'ironforge-fitness',
        'IronForge Fitness LLP',
        '29AABCU9603R1ZM',
        'AABCU9603R',
        '29',
        '9876500001',
        'info@ironforge.fit',
        'ACTIVE',
        true
      )
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `;

    await sql`
      INSERT INTO gym_staff (gym_id, user_id, role, is_active)
      VALUES (${ironforgeGym.id}, ${ironforgeOwner.id}, 'GYM_OWNER', true)
      ON CONFLICT DO NOTHING;
    `;

    const [ironforgeBranch] = await sql`
      INSERT INTO branches (
        gym_id, name, address_line1, address_line2, landmark, locality, city, state, pincode, latitude, longitude, phone
      )
      VALUES (
        ${ironforgeGym.id},
        'Koramangala Main Studio',
        '#412, 1st Floor, 80 Feet Road, 5th Block',
        'Opposite Sony World Signal',
        'Near Empire Restaurant',
        'Koramangala',
        'Bengaluru',
        'Karnataka',
        '560095',
        12.9352450,
        77.6245120,
        '9876500001'
      )
      RETURNING id;
    `;

    // Listing for IronForge
    await sql`
      INSERT INTO listings (
        gym_id, branch_id, headline, description, gender_policy, starting_price_monthly, is_verified, is_featured, listing_quality_score, published_status
      )
      VALUES (
        ${ironforgeGym.id},
        ${ironforgeBranch.id},
        'Premier Strength, CrossFit & High-Performance Training Facility',
        'IronForge is Bengaluru''s dedicated high-performance strength and conditioning arena. Equipped with Eleiko barbells, competition powerlifting benches, dedicated sprint turf, and certified coaches. Enjoy spotless steam rooms and nutrition cafe.',
        'UNISEX',
        2499.00,
        true,
        true,
        96,
        'PUBLISHED'
      )
      ON CONFLICT (gym_id) DO UPDATE SET headline = EXCLUDED.headline, starting_price_monthly = EXCLUDED.starting_price_monthly;
    `;

    // Photos for IronForge
    await sql`
      INSERT INTO listing_photos (gym_id, photo_url, caption, tag, display_order, is_cover)
      VALUES
        (${ironforgeGym.id}, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80', 'Main workout floor & free weights', 'WORKOUT_FLOOR', 1, true),
        (${ironforgeGym.id}, 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=80', 'CrossFit rig and turf area', 'EQUIPMENT', 2, false),
        (${ironforgeGym.id}, 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=80', 'Cardio rowers & treadmills', 'EQUIPMENT', 3, false)
      ON CONFLICT DO NOTHING;
    `;

    // Plans for IronForge
    const [monthlyPlan] = await sql`
      INSERT INTO plans (
        gym_id, name, plan_type, duration_months, duration_days, base_price, joining_fee, gst_rate_percent, total_price, is_public, is_active
      )
      VALUES (
        ${ironforgeGym.id},
        'Monthly Strength Pass',
        'GYM',
        1,
        30,
        2117.80,
        0,
        18.00,
        2499.00,
        true,
        true
      )
      RETURNING id;
    `;

    const [quarterlyPlan] = await sql`
      INSERT INTO plans (
        gym_id, name, plan_type, duration_months, duration_days, base_price, joining_fee, gst_rate_percent, total_price, is_public, is_active
      )
      VALUES (
        ${ironforgeGym.id},
        'Quarterly Pro Athlete',
        'GYM',
        3,
        90,
        5507.63,
        0,
        18.00,
        6499.00,
        true,
        true
      )
      RETURNING id;
    `;

    const [annualPlan] = await sql`
      INSERT INTO plans (
        gym_id, name, plan_type, duration_months, duration_days, base_price, joining_fee, gst_rate_percent, total_price, is_public, is_active
      )
      VALUES (
        ${ironforgeGym.id},
        'Annual Champion All-Access',
        'COMBO',
        12,
        365,
        16948.31,
        0,
        18.00,
        19999.00,
        true,
        true
      )
      RETURNING id;
    `;

    // Trainers for IronForge
    await sql`
      INSERT INTO trainers (gym_id, name, specializations, certifications, languages_spoken, bio, is_public)
      VALUES
        (${ironforgeGym.id}, 'Vikram Malhotra', '["Olympic Weightlifting", "Powerlifting", "Hypertrophy"]'::jsonb, '["CSCS", "USAW Level 2"]'::jsonb, '["English", "Hindi", "Kannada"]'::jsonb, '10+ years coaching national level strength athletes.', true),
        (${ironforgeGym.id}, 'Neha Sharma', '["Functional Movement", "Mobility & Rehab", "Fat Loss"]'::jsonb, '["K11 Master Trainer", "ACE-CPT"]'::jsonb, '["English", "Hindi"]'::jsonb, 'Specializes in pain-free strength and body recomposition.', true)
      ON CONFLICT DO NOTHING;
    `;

    // Seed 4 Sample Members in IronForge for Renewals Testing
    // Member 1: Active loyalist
    const [m1] = await sql`
      INSERT INTO members (gym_id, first_name, last_name, phone, email, gender, status, tags)
      VALUES (${ironforgeGym.id}, 'Aditya', 'Nambiar', '9845011111', 'aditya.n@gmail.com', 'MALE', 'ACTIVE', '["Loyal", "Evening Batch"]'::jsonb)
      ON CONFLICT (gym_id, phone) DO UPDATE SET first_name = EXCLUDED.first_name
      RETURNING id;
    `;
    await sql`
      INSERT INTO memberships (gym_id, member_id, plan_id, start_date, end_date, original_end_date, status, total_amount, amount_paid, amount_due)
      VALUES (${ironforgeGym.id}, ${m1.id}, ${annualPlan.id}, '2026-04-01', '2027-03-31', '2027-03-31', 'ACTIVE', 19999.00, 19999.00, 0)
      ON CONFLICT DO NOTHING;
    `;

    // Member 2: Expiring in 4 days (2026-10-24), Moderate risk
    const [m2] = await sql`
      INSERT INTO members (gym_id, first_name, last_name, phone, email, gender, status, tags)
      VALUES (${ironforgeGym.id}, 'Sneha', 'Reddy', '9845022222', 'sneha.reddy@gmail.com', 'FEMALE', 'EXPIRING_SOON', '["Morning Batch", "CrossFit"]'::jsonb)
      ON CONFLICT (gym_id, phone) DO UPDATE SET first_name = EXCLUDED.first_name
      RETURNING id;
    `;
    const [m2Ship] = await sql`
      INSERT INTO memberships (gym_id, member_id, plan_id, start_date, end_date, original_end_date, status, total_amount, amount_paid, amount_due)
      VALUES (${ironforgeGym.id}, ${m2.id}, ${quarterlyPlan.id}, '2026-07-24', '2026-10-24', '2026-10-24', 'EXPIRING_SOON', 6499.00, 6499.00, 0)
      ON CONFLICT DO NOTHING
      RETURNING id;
    `;
    await sql`
      INSERT INTO renewal_risk_scores (gym_id, member_id, risk_score, factors, explanation, recommended_action)
      VALUES (
        ${ironforgeGym.id},
        ${m2.id},
        35,
        '{"days_since_last_visit": 3, "visits_last_30_days": 12}'::jsonb,
        'Active member with steady habit. Gently remind for quarterly renewal.',
        'REMIND_GENTLY'
      )
      ON CONFLICT DO NOTHING;
    `;

    // Member 3: Expiring in 7 days, Has not visited in 16 days (High Risk)
    const [m3] = await sql`
      INSERT INTO members (gym_id, first_name, last_name, phone, email, gender, status, tags)
      VALUES (${ironforgeGym.id}, 'Rohan', 'Deshmukh', '9845033333', 'rohan.d@gmail.com', 'MALE', 'EXPIRING_SOON', '["Weekend Warrior"]'::jsonb)
      ON CONFLICT (gym_id, phone) DO UPDATE SET first_name = EXCLUDED.first_name
      RETURNING id;
    `;
    await sql`
      INSERT INTO memberships (gym_id, member_id, plan_id, start_date, end_date, original_end_date, status, total_amount, amount_paid, amount_due)
      VALUES (${ironforgeGym.id}, ${m3.id}, ${monthlyPlan.id}, '2026-09-27', '2026-10-27', '2026-10-27', 'EXPIRING_SOON', 2499.00, 2499.00, 0)
      ON CONFLICT DO NOTHING;
    `;
    await sql`
      INSERT INTO renewal_risk_scores (gym_id, member_id, risk_score, factors, explanation, recommended_action)
      VALUES (
        ${ironforgeGym.id},
        ${m3.id},
        68,
        '{"days_since_last_visit": 16, "drop_percent": 65}'::jsonb,
        'Has not attended in 16 days. Offer pause benefit or discount perk to retain.',
        'OFFER_PAUSE_BENEFIT'
      )
      ON CONFLICT DO NOTHING;
    `;

    // Member 4: Lapsed 3 days ago, Inactive 28 days (Critical Risk)
    const [m4] = await sql`
      INSERT INTO members (gym_id, first_name, last_name, phone, email, gender, status, tags)
      VALUES (${ironforgeGym.id}, 'Varun', 'Kulkarni', '9845044444', 'varun.k@gmail.com', 'MALE', 'EXPIRED', '["High Churn Risk"]'::jsonb)
      ON CONFLICT (gym_id, phone) DO UPDATE SET first_name = EXCLUDED.first_name
      RETURNING id;
    `;
    await sql`
      INSERT INTO memberships (gym_id, member_id, plan_id, start_date, end_date, original_end_date, status, total_amount, amount_paid, amount_due)
      VALUES (${ironforgeGym.id}, ${m4.id}, ${monthlyPlan.id}, '2026-09-17', '2026-10-17', '2026-10-17', 'EXPIRED', 2499.00, 2499.00, 0)
      ON CONFLICT DO NOTHING;
    `;
    await sql`
      INSERT INTO renewal_risk_scores (gym_id, member_id, risk_score, factors, explanation, recommended_action)
      VALUES (
        ${ironforgeGym.id},
        ${m4.id},
        88,
        '{"days_since_last_visit": 28, "visits_last_30_days": 0}'::jsonb,
        'Expired 3 days ago with 0 visits in the past month. Needs immediate personal call with special comeback incentive.',
        'CALL_DIRECTLY'
      )
      ON CONFLICT DO NOTHING;
    `;

    // Seed Sample Invoices
    await sql`
      INSERT INTO invoices (
        gym_id, invoice_number, financial_year, member_id, customer_name, customer_phone, customer_state_code,
        subtotal, cgst_amount, sgst_amount, igst_amount, total_tax, grand_total, hsn_sac_code, status
      )
      VALUES (
        ${ironforgeGym.id},
        'IRON/26-27/0001',
        '26-27',
        ${m1.id},
        'Aditya Nambiar',
        '9845011111',
        '29',
        16948.31,
        1525.35,
        1525.35,
        0,
        3050.69,
        19999.00,
        '999723',
        'PAID'
      )
      ON CONFLICT (invoice_number) DO NOTHING;
    `;

    // Seed Live Busyness Aggregates for IronForge (Mondays through Sundays)
    const hours = [6, 7, 8, 9, 10, 11, 12, 16, 17, 18, 19, 20, 21];
    for (const h of hours) {
      let score = 30;
      if (h === 7 || h === 8 || h === 19 || h === 20) score = 85; // Peak hours
      else if (h === 6 || h === 18) score = 65;
      else if (h === 12 || h === 16) score = 25;

      await sql`
        INSERT INTO busy_hour_aggregates (gym_id, day_of_week, hour_of_day, relative_busyness_score, sample_count)
        VALUES (${ironforgeGym.id}, 1, ${h}, ${score}, 45)
        ON CONFLICT (gym_id, day_of_week, hour_of_day) DO UPDATE SET relative_busyness_score = EXCLUDED.relative_busyness_score;
      `;
    }

    // 4. Gym 2: Shakti Women's Fitness & Pilates (Indiranagar)
    const [shaktiGym] = await sql`
      INSERT INTO gyms (name, slug, legal_entity_name, gstin, state_code, phone, email, status, is_claimed)
      VALUES (
        'Shakti Women''s Fitness & Pilates',
        'shakti-womens-fitness',
        'Shakti Fitness Pvt Ltd',
        '29AAECS1234F1Z8',
        '29',
        '9876500003',
        'hello@shaktifitness.in',
        'ACTIVE',
        true
      )
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `;

    const [shaktiBranch] = await sql`
      INSERT INTO branches (
        gym_id, name, address_line1, landmark, locality, city, state, pincode, latitude, longitude, phone
      )
      VALUES (
        ${shaktiGym.id},
        'Indiranagar Flagship',
        '#788, 100 Feet Road, HAL 2nd Stage',
        'Above Blue Tokai Coffee',
        'Indiranagar',
        'Bengaluru',
        'Karnataka',
        '560038',
        12.9718910,
        77.6411540,
        '9876500003'
      )
      RETURNING id;
    `;

    await sql`
      INSERT INTO listings (
        gym_id, branch_id, headline, description, gender_policy, starting_price_monthly, is_verified, is_featured, listing_quality_score, published_status
      )
      VALUES (
        ${shaktiGym.id},
        ${shaktiBranch.id},
        'Bengaluru''s Leading Exclusive Women''s Fitness, Reformer Pilates & Barre Studio',
        'A safe, uplifting, and empowering fitness sanctuary for women. Featuring classical Reformer Pilates, high-intensity Barre, functional weight training, pre/postnatal fitness, and luxury shower suites.',
        'WOMEN_ONLY',
        3200.00,
        true,
        true,
        98,
        'PUBLISHED'
      )
      ON CONFLICT (gym_id) DO UPDATE SET headline = EXCLUDED.headline, starting_price_monthly = EXCLUDED.starting_price_monthly;
    `;

    await sql`
      INSERT INTO listing_photos (gym_id, photo_url, caption, tag, display_order, is_cover)
      VALUES
        (${shaktiGym.id}, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80', 'Reformer Pilates Studio', 'WORKOUT_FLOOR', 1, true),
        (${shaktiGym.id}, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80', 'Barre & Yoga Sanctuary', 'FACILITY', 2, false)
      ON CONFLICT DO NOTHING;
    `;

    await sql`
      INSERT INTO plans (
        gym_id, name, plan_type, duration_months, duration_days, base_price, joining_fee, gst_rate_percent, total_price, is_public, is_active
      )
      VALUES
        (${shaktiGym.id}, 'Monthly Pilates & Cardio', 'PILATES', 1, 30, 2711.86, 0, 18.00, 3200.00, true, true),
        (${shaktiGym.id}, 'Annual Power Woman All-Access', 'COMBO', 12, 365, 21185.59, 0, 18.00, 24999.00, true, true)
      ON CONFLICT DO NOTHING;
    `;

    // 5. Gym 3: CultPulse Hybrid Club (HSR Layout)
    const [cultpulseGym] = await sql`
      INSERT INTO gyms (name, slug, legal_entity_name, gstin, state_code, phone, email, status, is_claimed)
      VALUES (
        'CultPulse Hybrid Training Club',
        'cultpulse-hsr',
        'Pulse Fitness India Ltd',
        '29AALCP4455G1Z2',
        '29',
        '9876500004',
        'hsr@cultpulse.fit',
        'ACTIVE',
        true
      )
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `;

    const [cultpulseBranch] = await sql`
      INSERT INTO branches (
        gym_id, name, address_line1, landmark, locality, city, state, pincode, latitude, longitude, phone
      )
      VALUES (
        ${cultpulseGym.id},
        'HSR Sector 2 Hub',
        '#12, 27th Main, Sector 2, HSR Layout',
        'Near NIFT Campus',
        'HSR Layout',
        'Bengaluru',
        'Karnataka',
        '560102',
        12.9116240,
        77.6388620,
        '9876500004'
      )
      RETURNING id;
    `;

    await sql`
      INSERT INTO listings (
        gym_id, branch_id, headline, description, gender_policy, starting_price_monthly, is_verified, is_featured, listing_quality_score, published_status
      )
      VALUES (
        ${cultpulseGym.id},
        ${cultpulseBranch.id},
        'Modern High-Energy Functional Fitness & Strength Community',
        'Dynamic group workouts, strength training zone, open 24/7 with app access. Clean, energetic, and affordable fitness for busy tech professionals.',
        'UNISEX',
        1999.00,
        true,
        false,
        90,
        'PUBLISHED'
      )
      ON CONFLICT (gym_id) DO UPDATE SET headline = EXCLUDED.headline, starting_price_monthly = EXCLUDED.starting_price_monthly;
    `;

    await sql`
      INSERT INTO listing_photos (gym_id, photo_url, caption, tag, display_order, is_cover)
      VALUES
        (${cultpulseGym.id}, 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80', 'Functional training floor', 'WORKOUT_FLOOR', 1, true)
      ON CONFLICT DO NOTHING;
    `;

    await sql`
      INSERT INTO plans (
        gym_id, name, plan_type, duration_months, duration_days, base_price, joining_fee, gst_rate_percent, total_price, is_public, is_active
      )
      VALUES
        (${cultpulseGym.id}, 'Monthly Essential', 'GYM', 1, 30, 1694.07, 0, 18.00, 1999.00, true, true),
        (${cultpulseGym.id}, 'Quarterly Pulse', 'GYM', 3, 90, 4236.44, 0, 18.00, 4999.00, true, true)
      ON CONFLICT DO NOTHING;
    `;

    console.log("✓ Successfully seeded Bengaluru launch data: IronForge, Shakti Fitness, and CultPulse!");
  } finally {
    await sql.end();
  }
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
