-- ============================================================================
-- PRAAN TELEMEDICINE GRID - AWS AURORA POSTGRESQL DATABASE SCHEMA
-- Region: AWS Asia Pacific (ap-south-1 Mumbai)
-- Compliance: ABDM (Ayushman Bharat Digital Mission), FHIR R4, HIPAA
-- Target Service: AWS Aurora Serverless v2 / AWS RDS PostgreSQL 15+
-- ============================================================================

-- Enable required PostgreSQL extensions for UUID generation and cryptographic functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ENUMS & DOMAIN TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE facility_tier AS ENUM ('HWC', 'PHC', 'CHC', 'DH', 'APEX');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE triage_priority AS ENUM ('RED', 'YELLOW', 'GREEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE teleconsult_status AS ENUM ('Waiting', 'In Progress', 'Completed', 'Referred', 'Cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE referral_status AS ENUM (
        'Initiated',
        'Accepted',
        'In Transit',
        'Admitted',
        'Discharged',
        'Counter-Referred',
        'Completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE high_risk_type AS ENUM (
        'ANC_HIGH_RISK',
        'SAM_INFANT',
        'NCD_DIABETES_HTN',
        'CARDIAC',
        'TB_DOTS',
        'NONE',
        'GENERAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. HEALTHCARE FACILITIES (5-Tier Federated Public Grid)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facilities (
    facility_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(64) NOT NULL,
    tier facility_tier NOT NULL,
    tier_label VARCHAR(128) NOT NULL,
    block_name VARCHAR(128) NOT NULL,
    district VARCHAR(128) NOT NULL,
    state VARCHAR(128) NOT NULL DEFAULT 'Maharashtra',
    pincode VARCHAR(10) NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(255),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    total_beds INT NOT NULL DEFAULT 0,
    occupied_beds INT NOT NULL DEFAULT 0,
    icu_beds INT NOT NULL DEFAULT 0,
    occupied_icu_beds INT NOT NULL DEFAULT 0,
    oxygen_available_liters INT NOT NULL DEFAULT 0,
    doctors_on_duty INT NOT NULL DEFAULT 1,
    teleconsult_stations INT NOT NULL DEFAULT 1,
    active_specialities JSONB NOT NULL DEFAULT '[]'::jsonb,
    ambulances_stationed INT NOT NULL DEFAULT 0,
    staff_name VARCHAR(128) NOT NULL,
    staff_role VARCHAR(128) NOT NULL,
    staff_title VARCHAR(128) NOT NULL,
    aws_node_arn VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_facilities_tier ON facilities(tier);
CREATE INDEX IF NOT EXISTS idx_facilities_district_block ON facilities(district, block_name);

-- ----------------------------------------------------------------------------
-- 3. PATIENTS (Longitudinal Health Records with ABDM ABHA ID)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    patient_id VARCHAR(64) PRIMARY KEY,
    abha_id VARCHAR(32) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(16) NOT NULL,
    phone_number VARCHAR(20),
    village VARCHAR(128) NOT NULL,
    block_name VARCHAR(128) NOT NULL,
    district VARCHAR(128) NOT NULL,
    registered_facility_id VARCHAR(32) NOT NULL REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    blood_group VARCHAR(8) NOT NULL,
    emergency_contact_name VARCHAR(128),
    emergency_contact_phone VARCHAR(20),
    allergies JSONB DEFAULT '[]'::jsonb,
    chronic_conditions JSONB DEFAULT '[]'::jsonb,
    risk_category VARCHAR(16) NOT NULL DEFAULT 'Low',
    high_risk_type high_risk_type NOT NULL DEFAULT 'NONE',
    asha_worker_name VARCHAR(128),
    asha_worker_phone VARCHAR(20),
    photo_s3_url VARCHAR(512),
    past_history_summary TEXT,
    last_visit_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_abha_id ON patients(abha_id);
CREATE INDEX IF NOT EXISTS idx_patients_facility ON patients(registered_facility_id);
CREATE INDEX IF NOT EXISTS idx_patients_risk ON patients(risk_category, high_risk_type);

-- ----------------------------------------------------------------------------
-- 4. PATIENT VITALS (Time-Series Clinical Measurements)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patient_vitals (
    vital_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    facility_id VARCHAR(32) NOT NULL REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    blood_pressure_sys INT NOT NULL,
    blood_pressure_dia INT NOT NULL,
    pulse_rate INT NOT NULL,
    spo2 NUMERIC(5, 2) NOT NULL,
    temperature_f NUMERIC(5, 2) NOT NULL,
    respiratory_rate INT NOT NULL,
    blood_sugar_mg_dl NUMERIC(6, 2),
    hemoglobin_g_dl NUMERIC(4, 2),
    weight_kg NUMERIC(5, 2),
    height_cm NUMERIC(5, 2),
    bmi NUMERIC(5, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vitals_patient_date ON patient_vitals(patient_id, recorded_at DESC);

-- ----------------------------------------------------------------------------
-- 5. TELECONSULTATIONS (Live Remote Doctor Sessions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teleconsultations (
    consultation_id VARCHAR(64) PRIMARY KEY,
    token_number INT NOT NULL,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    requesting_facility_id VARCHAR(32) NOT NULL REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    consulting_facility_id VARCHAR(32) NOT NULL REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    consulting_doctor_name VARCHAR(128) NOT NULL,
    speciality_required VARCHAR(128) NOT NULL,
    assisted_by_asha VARCHAR(128),
    chief_complaints TEXT NOT NULL,
    symptoms_duration VARCHAR(64) NOT NULL,
    vitals_snapshot JSONB NOT NULL,
    triage_priority triage_priority NOT NULL DEFAULT 'GREEN',
    triage_score INT NOT NULL DEFAULT 0,
    triage_reason TEXT,
    status teleconsult_status NOT NULL DEFAULT 'Waiting',
    meeting_room_id VARCHAR(128) NOT NULL,
    ai_differential_diagnosis JSONB DEFAULT '[]'::jsonb,
    ai_red_flags JSONB DEFAULT '[]'::jsonb,
    ai_recommended_action TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    aws_dynamo_record_arn VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teleconsult_status ON teleconsultations(status);
CREATE INDEX IF NOT EXISTS idx_teleconsult_req_facility ON teleconsultations(requesting_facility_id);
CREATE INDEX IF NOT EXISTS idx_teleconsult_con_facility ON teleconsultations(consulting_facility_id);
CREATE INDEX IF NOT EXISTS idx_teleconsult_triage ON teleconsultations(triage_priority);

-- ----------------------------------------------------------------------------
-- 6. PRESCRIPTIONS & MEDICATIONS (ABDM Signed Digital Orders)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id VARCHAR(64) PRIMARY KEY,
    consultation_id VARCHAR(64) UNIQUE NOT NULL REFERENCES teleconsultations(consultation_id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_name VARCHAR(128) NOT NULL,
    doctor_registration VARCHAR(64) NOT NULL,
    facility_name VARCHAR(255) NOT NULL,
    diagnosis TEXT NOT NULL,
    clinical_notes TEXT,
    dietary_advice TEXT,
    precautions TEXT,
    follow_up_date DATE,
    signed_abdm_id VARCHAR(128) NOT NULL,
    qr_code_s3_path VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescription_medications (
    medication_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id VARCHAR(64) NOT NULL REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(64) NOT NULL,
    frequency VARCHAR(64) NOT NULL,
    duration_days INT NOT NULL,
    instructions TEXT,
    is_available_in_local_pharmacy BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_presc_meds_prescription ON prescription_medications(prescription_id);

-- ----------------------------------------------------------------------------
-- 7. INTER-HOSPITAL REFERRALS (Emergency Routing & Transit Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
    referral_id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    origin_facility_id VARCHAR(32) NOT NULL REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    target_facility_id VARCHAR(32) NOT NULL REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    referred_by_staff VARCHAR(128) NOT NULL,
    target_speciality VARCHAR(128) NOT NULL,
    provisional_diagnosis TEXT NOT NULL,
    clinical_justification TEXT NOT NULL,
    priority triage_priority NOT NULL DEFAULT 'YELLOW',
    status referral_status NOT NULL DEFAULT 'Initiated',
    vitals_at_referral JSONB NOT NULL,
    ambulance_vehicle_number VARCHAR(32),
    ambulance_driver_name VARCHAR(128),
    ambulance_driver_phone VARCHAR(20),
    ambulance_paramedic_name VARCHAR(128),
    ambulance_current_location VARCHAR(255),
    ambulance_eta_minutes INT,
    ambulance_oxygen_equipped BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_target_facility ON referrals(target_facility_id);
CREATE INDEX IF NOT EXISTS idx_referrals_priority ON referrals(priority);

-- ----------------------------------------------------------------------------
-- 8. PHARMACY INVENTORY & DEPOT (Federated Stock by Facility)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacy_items (
    item_id VARCHAR(64) PRIMARY KEY,
    medicine_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    reorder_threshold INT NOT NULL DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facility_pharmacy_stock (
    stock_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id VARCHAR(32) NOT NULL REFERENCES facilities(facility_id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL REFERENCES pharmacy_items(item_id) ON DELETE CASCADE,
    stock_quantity INT NOT NULL DEFAULT 0,
    batch_number VARCHAR(64),
    expiry_date DATE,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(facility_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_fac ON facility_pharmacy_stock(facility_id);

-- ----------------------------------------------------------------------------
-- 9. LAB & POINT-OF-CARE DIAGNOSTICS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_orders (
    lab_order_id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    facility_id VARCHAR(32) NOT NULL REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    ordered_by_doctor VARCHAR(128) NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    urgency VARCHAR(32) NOT NULL DEFAULT 'Routine',
    status VARCHAR(32) NOT NULL DEFAULT 'Pending',
    result_value VARCHAR(255),
    reference_range VARCHAR(128),
    is_abnormal BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_facility ON lab_orders(facility_id);

-- ----------------------------------------------------------------------------
-- 10. HIGH RISK CARE REGISTRY & ASHA SURVEILLANCE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS high_risk_registry (
    registry_id VARCHAR(64) PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    category high_risk_type NOT NULL,
    clinical_condition VARCHAR(255) NOT NULL,
    village VARCHAR(128) NOT NULL,
    asha_worker_name VARCHAR(128) NOT NULL,
    asha_worker_phone VARCHAR(20),
    last_home_visit_date DATE,
    next_scheduled_follow_up DATE,
    compliance_score NUMERIC(5, 2) NOT NULL DEFAULT 85.00,
    visit_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_high_risk_category ON high_risk_registry(category);
CREATE INDEX IF NOT EXISTS idx_high_risk_patient ON high_risk_registry(patient_id);

-- ----------------------------------------------------------------------------
-- 11. AWS SYNC AUDIT LOG & DYNAMODB REPLICATION TRACKER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aws_cloud_sync_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    facility_id VARCHAR(32) REFERENCES facilities(facility_id),
    sync_action VARCHAR(32) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    aws_dynamodb_table VARCHAR(128),
    aws_s3_key VARCHAR(512),
    sync_status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    latency_ms INT NOT NULL DEFAULT 24,
    payload JSONB,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aws_sync_time ON aws_cloud_sync_log(synced_at DESC);

-- ----------------------------------------------------------------------------
-- 12. INITIAL SEED DATA FOR 5-TIER FACILITY GRID
-- ----------------------------------------------------------------------------
INSERT INTO facilities (
    facility_id, name, short_name, tier, tier_label, block_name, district, state, pincode,
    latitude, longitude, total_beds, occupied_beds, icu_beds, occupied_icu_beds,
    oxygen_available_liters, doctors_on_duty, teleconsult_stations, staff_name, staff_role, staff_title
) VALUES
('HWC-01', 'Shirur Rural Sub-Centre & Health & Wellness Centre', 'Shirur HWC', 'HWC', 'Tier 1 · Sub-Centre', 'Shirur', 'Pune', 'Maharashtra', '412210', 18.8286, 74.3776, 2, 0, 0, 0, 200, 1, 1, 'Sarita Pawar', 'Community Health Officer', 'Sister'),
('PHC-02', 'Khed Primary Health Centre', 'Khed PHC', 'PHC', 'Tier 2 · Primary Centre', 'Khed', 'Pune', 'Maharashtra', '410501', 18.8500, 73.9100, 12, 5, 0, 0, 1200, 2, 2, 'Dr. Rajesh Deshmukh', 'Medical Officer MBBS', 'Dr.'),
('CHC-03', 'Manchar Community Health Centre', 'Manchar CHC', 'CHC', 'Tier 3 · Community Hospital', 'Ambegaon', 'Pune', 'Maharashtra', '410503', 19.0100, 73.9400, 35, 21, 4, 2, 5000, 5, 3, 'Dr. Sunita Kadam', 'Obstetrician & Gynaecologist (MD)', 'Dr.'),
('DH-04', 'Pune District Civil Hospital Aundh', 'Aundh Civil Hospital', 'DH', 'Tier 4 · District Hospital', 'Haveli', 'Pune', 'Maharashtra', '411027', 18.5583, 73.8073, 160, 128, 24, 18, 25000, 22, 6, 'Dr. Arvind Joshi', 'Chief Medical Officer / Physician', 'Dr.'),
('APEX-05', 'B.J. Government Medical College & Sassoon General Hospital', 'Sassoon Apex Hospital', 'APEX', 'Tier 5 · Apex Medical College', 'Pune City', 'Pune', 'Maharashtra', '411001', 18.5262, 73.8744, 450, 395, 80, 71, 90000, 65, 12, 'Dr. Meenakshi Kulkarni', 'Professor & Head of Tele-Medicine & Cardiology', 'Prof. Dr.')
ON CONFLICT (facility_id) DO NOTHING;

-- End of AWS Aurora PostgreSQL Schema
