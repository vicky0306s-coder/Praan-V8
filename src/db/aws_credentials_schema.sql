-- ============================================================================
-- PRAAN TELEMEDICINE GRID - AWS CLOUD AUTHENTICATION & LOGIN CREDENTIALS SCHEMA
-- Region: AWS Asia Pacific (ap-south-1 Mumbai)
-- Target Service: AWS Aurora PostgreSQL / AWS Cognito User Pool Identity Sync
-- Compliance: ABDM Healthcare Professional Registry (HPR), ISO 27001, HIPAA
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USER ROLES & PERMISSIONS ENUM
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'SUPER_ADMIN',
        'CHO_ANM',
        'MEDICAL_OFFICER',
        'SPECIALIST_OBGYN',
        'SENIOR_PHYSICIAN',
        'APEX_DIRECTOR',
        'TELE_CONSULTANT',
        'PHARMACIST',
        'RADIOLOGIST'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE auth_status AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_MFA', 'LOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. FACILITY STAFF & CLINICAL CREDENTIALS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facility_user_credentials (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id VARCHAR(32) NOT NULL,
    hpr_id VARCHAR(64) UNIQUE, -- ABDM Health Professional Registry ID (e.g. 91-7788-4433-1122)
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(128) UNIQUE NOT NULL,
    
    -- Password Credentials (Stored with standard pgcrypto bcrypt blowfish hashing)
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(64),
    plain_reference_pass VARCHAR(64), -- Demo reference indicator (removable in strict production)
    
    -- Personal & Clinical Details
    staff_title VARCHAR(32) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    role_description VARCHAR(255) NOT NULL,
    medical_council_reg_number VARCHAR(128),
    phone_number VARCHAR(20) NOT NULL,
    
    -- Access Security & Session Metadata
    status auth_status NOT NULL DEFAULT 'ACTIVE',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(128),
    failed_login_attempts INT DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip VARCHAR(45),
    aws_cognito_sub VARCHAR(255),
    aws_iam_role_arn VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_email ON facility_user_credentials(email);
CREATE INDEX IF NOT EXISTS idx_user_facility ON facility_user_credentials(facility_id);
CREATE INDEX IF NOT EXISTS idx_user_role ON facility_user_credentials(role);

-- ----------------------------------------------------------------------------
-- 3. USER AUDIT & LOGIN ACCESS LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_login_audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES facility_user_credentials(user_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    facility_id VARCHAR(32) NOT NULL,
    login_status VARCHAR(32) NOT NULL, -- 'SUCCESS', 'FAILED_BAD_PASSWORD', 'ACCOUNT_LOCKED'
    ip_address VARCHAR(45),
    user_agent TEXT,
    aws_region VARCHAR(32) DEFAULT 'ap-south-1',
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_audit_email ON user_login_audit_logs(email);
CREATE INDEX IF NOT EXISTS idx_login_audit_time ON user_login_audit_logs(attempted_at DESC);

-- ----------------------------------------------------------------------------
-- 4. SEED LOGIN CREDENTIALS FOR ALL 5 HOSPITAL FACILITY NODES
-- ----------------------------------------------------------------------------
-- Note: Passwords are encrypted with crypt('...', gen_salt('bf', 8))

-- 1. Tier 1 · Shirur Sub-Centre & HWC (Sister Sunita Patil)
INSERT INTO facility_user_credentials (
    facility_id,
    hpr_id,
    email,
    username,
    password_hash,
    plain_reference_pass,
    staff_title,
    full_name,
    role,
    role_description,
    medical_council_reg_number,
    phone_number,
    status,
    aws_iam_role_arn
) VALUES (
    'HWC-01',
    'HPR-HWC-412210-001',
    'hwc_shirur@telemed.gov.in',
    'sunita.patil.hwc',
    crypt('shirur123', gen_salt('bf', 8)),
    'shirur123',
    'Sister',
    'Sister Sunita Patil',
    'CHO_ANM',
    'Auxiliary Nurse Midwife (ANM) & Community Health Officer',
    'MNC-ANM-2018-9941',
    '+91 2138 222104',
    'ACTIVE',
    'arn:aws:iam::721958105183:role/PraanFrontlineCHOAccessRole'
) ON CONFLICT (email) DO NOTHING;

-- 2. Tier 2 · Khed Primary Health Centre (Dr. Rajesh Deshmukh)
INSERT INTO facility_user_credentials (
    facility_id,
    hpr_id,
    email,
    username,
    password_hash,
    plain_reference_pass,
    staff_title,
    full_name,
    role,
    role_description,
    medical_council_reg_number,
    phone_number,
    status,
    aws_iam_role_arn
) VALUES (
    'PHC-02',
    'HPR-PHC-410505-002',
    'phc_khed@telemed.gov.in',
    'rajesh.deshmukh.phc',
    crypt('khed123', gen_salt('bf', 8)),
    'khed123',
    'Dr.',
    'Dr. Rajesh Deshmukh',
    'MEDICAL_OFFICER',
    'Medical Officer (MBBS) & In-Charge',
    'MMC-MBBS-2014-11840',
    '+91 2135 222019',
    'ACTIVE',
    'arn:aws:iam::721958105183:role/PraanPrimaryCareDoctorRole'
) ON CONFLICT (email) DO NOTHING;

-- 3. Tier 3 · Manchar Community Health Centre (Dr. Meera Kulkarni)
INSERT INTO facility_user_credentials (
    facility_id,
    hpr_id,
    email,
    username,
    password_hash,
    plain_reference_pass,
    staff_title,
    full_name,
    role,
    role_description,
    medical_council_reg_number,
    phone_number,
    status,
    aws_iam_role_arn
) VALUES (
    'CHC-03',
    'HPR-CHC-410503-003',
    'chc_manchar@telemed.gov.in',
    'meera.kulkarni.chc',
    crypt('manchar123', gen_salt('bf', 8)),
    'manchar123',
    'Dr.',
    'Dr. Meera Kulkarni',
    'SPECIALIST_OBGYN',
    'Consultant Obstetrician & Gynaecologist (MS OBGYN)',
    'MMC-MS-2011-04921',
    '+91 2133 223120',
    'ACTIVE',
    'arn:aws:iam::721958105183:role/PraanSpecialistConsultantRole'
) ON CONFLICT (email) DO NOTHING;

-- 4. Tier 4 · Pune District Civil Hospital (Dr. Arvind Joshi)
INSERT INTO facility_user_credentials (
    facility_id,
    hpr_id,
    email,
    username,
    password_hash,
    plain_reference_pass,
    staff_title,
    full_name,
    role,
    role_description,
    medical_council_reg_number,
    phone_number,
    status,
    aws_iam_role_arn
) VALUES (
    'DH-04',
    'HPR-DH-411027-004',
    'dh_pune@telemed.gov.in',
    'arvind.joshi.dh',
    crypt('pune123', gen_salt('bf', 8)),
    'pune123',
    'Dr.',
    'Dr. Arvind Joshi',
    'SENIOR_PHYSICIAN',
    'Senior Physician & District Telemedicine Nodal Officer (MD Med)',
    'MMC-MD-2005-01823',
    '+91 20 2727 3422',
    'ACTIVE',
    'arn:aws:iam::721958105183:role/PraanDistrictDirectorRole'
) ON CONFLICT (email) DO NOTHING;

-- 5. Tier 5 · Sassoon General Hospital & Apex Medical College (Prof. Dr. Ananya Sen)
INSERT INTO facility_user_credentials (
    facility_id,
    hpr_id,
    email,
    username,
    password_hash,
    plain_reference_pass,
    staff_title,
    full_name,
    role,
    role_description,
    medical_council_reg_number,
    phone_number,
    status,
    aws_iam_role_arn
) VALUES (
    'APEX-05',
    'HPR-APEX-411001-005',
    'apex_sassoon@telemed.gov.in',
    'ananya.sen.apex',
    crypt('sassoon123', gen_salt('bf', 8)),
    'sassoon123',
    'Prof. Dr.',
    'Prof. Dr. Ananya Sen',
    'APEX_DIRECTOR',
    'Chief of Tele-ICU & Professor of Cardiology (MD, DM)',
    'MMC-DM-1999-00214',
    '+91 20 2612 8000',
    'ACTIVE',
    'arn:aws:iam::721958105183:role/PraanApexCommandAdminRole'
) ON CONFLICT (email) DO NOTHING;

-- 6. Super Admin Grid Operator
INSERT INTO facility_user_credentials (
    facility_id,
    hpr_id,
    email,
    username,
    password_hash,
    plain_reference_pass,
    staff_title,
    full_name,
    role,
    role_description,
    medical_council_reg_number,
    phone_number,
    status,
    aws_iam_role_arn
) VALUES (
    'APEX-05',
    'HPR-ADMIN-GRID-000',
    'admin@praanhealth.gov.in',
    'admin.praan.grid',
    crypt('admin@praan2026', gen_salt('bf', 8)),
    'admin@praan2026',
    'Administrator',
    'Praan State Grid Administrator',
    'SUPER_ADMIN',
    'State Health Directorate ABDM Administrator',
    'ADMIN-MAHA-HEALTH-001',
    '+91 20 2605 1000',
    'ACTIVE',
    'arn:aws:iam::721958105183:role/PraanSuperAdminCloudRole'
) ON CONFLICT (email) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. HELPER VIEW: VERIFIED FACILITY LOGIN DIRECTORY
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_facility_login_directory AS
SELECT 
    f.facility_id,
    f.name AS facility_name,
    f.tier,
    u.user_id,
    u.email AS login_email,
    u.plain_reference_pass AS reference_password,
    u.full_name AS staff_name,
    u.staff_title,
    u.role_description AS staff_role,
    u.medical_council_reg_number,
    u.hpr_id,
    u.status AS account_status,
    u.aws_iam_role_arn
FROM facility_user_credentials u
JOIN facilities f ON u.facility_id = f.facility_id
ORDER BY f.facility_id ASC;

-- End of AWS Authentication & Credentials Schema
