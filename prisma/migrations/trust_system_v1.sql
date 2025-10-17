-- ============================================
-- TRUST SYSTEM FOUNDATION - PHASE 1
-- ============================================

-- Trust Scores Table - Stores calculated trust metrics for each user
CREATE TABLE trust_scores (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(30) NOT NULL UNIQUE,
    
    -- Overall Score (0-1000)
    overall_score INT NOT NULL DEFAULT 0,
    score_level VARCHAR(20) NOT NULL DEFAULT 'new', -- new, building, established, trusted, elite
    
    -- Component Scores (0-100 each)
    verification_score INT NOT NULL DEFAULT 0,
    transaction_score INT NOT NULL DEFAULT 0,
    reputation_score INT NOT NULL DEFAULT 0,
    activity_score INT NOT NULL DEFAULT 0,
    responsiveness_score INT NOT NULL DEFAULT 0,
    
    -- Transaction Metrics
    total_transactions INT NOT NULL DEFAULT 0,
    successful_transactions INT NOT NULL DEFAULT 0,
    disputed_transactions INT NOT NULL DEFAULT 0,
    cancelled_transactions INT NOT NULL DEFAULT 0,
    total_volume DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Reputation Metrics
    total_reviews INT NOT NULL DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT NULL,
    positive_reviews INT NOT NULL DEFAULT 0,
    negative_reviews INT NOT NULL DEFAULT 0,
    
    -- Activity Metrics
    listings_created INT NOT NULL DEFAULT 0,
    listings_sold INT NOT NULL DEFAULT 0,
    listing_completion_rate DECIMAL(5,2) DEFAULT 0,
    account_age_days INT NOT NULL DEFAULT 0,
    
    -- Responsiveness Metrics
    avg_response_time_minutes INT DEFAULT NULL,
    messages_sent INT NOT NULL DEFAULT 0,
    messages_received INT NOT NULL DEFAULT 0,
    response_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Verification Status
    email_verified BOOLEAN NOT NULL DEFAULT false,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    id_verified BOOLEAN NOT NULL DEFAULT false,
    address_verified BOOLEAN NOT NULL DEFAULT false,
    payment_verified BOOLEAN NOT NULL DEFAULT false,
    
    -- Risk Indicators
    risk_level VARCHAR(20) NOT NULL DEFAULT 'unknown', -- low, medium, high, critical
    flags_received INT NOT NULL DEFAULT 0,
    warnings_issued INT NOT NULL DEFAULT 0,
    
    -- Timestamps
    last_calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_trust_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_overall_score CHECK (overall_score >= 0 AND overall_score <= 1000),
    CONSTRAINT chk_component_scores CHECK (
        verification_score >= 0 AND verification_score <= 100 AND
        transaction_score >= 0 AND transaction_score <= 100 AND
        reputation_score >= 0 AND reputation_score <= 100 AND
        activity_score >= 0 AND activity_score <= 100 AND
        responsiveness_score >= 0 AND responsiveness_score <= 100
    )
);

CREATE INDEX idx_trust_scores_user ON trust_scores(user_id);
CREATE INDEX idx_trust_scores_level ON trust_scores(score_level);
CREATE INDEX idx_trust_scores_risk ON trust_scores(risk_level);
CREATE INDEX idx_trust_scores_overall ON trust_scores(overall_score DESC);

-- Trust Events Table - Tracks all actions that affect trust
CREATE TABLE trust_events (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(30) NOT NULL,
    
    -- Event Details
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(30) NOT NULL, -- verification, transaction, reputation, activity, flag
    event_action VARCHAR(50) NOT NULL,
    
    -- Impact
    score_delta INT NOT NULL DEFAULT 0, -- Change in overall score
    component_affected VARCHAR(30), -- Which component score was affected
    
    -- Context
    related_entity_type VARCHAR(30), -- listing, transaction, review, message
    related_entity_id VARCHAR(30),
    metadata JSONB,
    
    -- Recording
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed BOOLEAN NOT NULL DEFAULT false,
    
    CONSTRAINT fk_trust_event_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_trust_events_user ON trust_events(user_id);
CREATE INDEX idx_trust_events_type ON trust_events(event_type);
CREATE INDEX idx_trust_events_category ON trust_events(event_category);
CREATE INDEX idx_trust_events_recorded ON trust_events(recorded_at DESC);
CREATE INDEX idx_trust_events_processed ON trust_events(processed);

-- Trust Rules Table - Configuration for trust calculations
CREATE TABLE trust_rules (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    
    -- Rule Definition
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_category VARCHAR(30) NOT NULL,
    rule_type VARCHAR(30) NOT NULL, -- bonus, penalty, multiplier, threshold
    
    -- Scoring
    score_impact INT NOT NULL, -- Points added/subtracted
    component_target VARCHAR(30) NOT NULL, -- Which score component this affects
    
    -- Conditions
    trigger_event VARCHAR(50) NOT NULL,
    conditions JSONB, -- Additional conditions for rule application
    
    -- Limits
    max_applications INT DEFAULT NULL, -- Max times rule can apply per user
    cooldown_hours INT DEFAULT NULL, -- Hours between applications
    
    -- Status
    active BOOLEAN NOT NULL DEFAULT true,
    priority INT NOT NULL DEFAULT 0,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trust_rules_category ON trust_rules(rule_category);
CREATE INDEX idx_trust_rules_active ON trust_rules(active);
CREATE INDEX idx_trust_rules_trigger ON trust_rules(trigger_event);

-- Trust Verification History - Tracks verification attempts and status changes
CREATE TABLE trust_verifications (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(30) NOT NULL,
    
    -- Verification Details
    verification_type VARCHAR(30) NOT NULL, -- email, phone, id, address, payment
    verification_method VARCHAR(50), -- sms, email_link, document_upload, etc.
    
    -- Status
    status VARCHAR(20) NOT NULL, -- pending, verified, failed, expired
    
    -- Data
    verified_value TEXT, -- The actual email/phone/address verified (encrypted if sensitive)
    verification_data JSONB, -- Additional verification metadata
    
    -- Provider
    provider VARCHAR(50), -- twilio, stripe_identity, manual, etc.
    provider_verification_id VARCHAR(100),
    
    -- Attempts
    attempt_count INT NOT NULL DEFAULT 1,
    
    -- Timestamps
    initiated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    CONSTRAINT fk_verification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_verifications_user ON trust_verifications(user_id);
CREATE INDEX idx_verifications_type ON trust_verifications(verification_type);
CREATE INDEX idx_verifications_status ON trust_verifications(status);

-- Trust Milestones Table - Achievement tracking
CREATE TABLE trust_milestones (
    id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(30) NOT NULL,
    
    -- Milestone Details
    milestone_type VARCHAR(50) NOT NULL,
    milestone_name VARCHAR(100) NOT NULL,
    
    -- Reward
    score_bonus INT NOT NULL DEFAULT 0,
    badge_awarded VARCHAR(50),
    
    -- Status
    achieved_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Metadata
    milestone_data JSONB,
    
    CONSTRAINT fk_milestone_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_milestone UNIQUE(user_id, milestone_type)
);

CREATE INDEX idx_milestones_user ON trust_milestones(user_id);
CREATE INDEX idx_milestones_type ON trust_milestones(milestone_type);

-- ============================================
-- TRUST CALCULATION FUNCTIONS
-- ============================================

-- Function to calculate verification score
CREATE OR REPLACE FUNCTION calculate_verification_score(p_user_id VARCHAR)
RETURNS INT AS $$
DECLARE
    v_score INT := 0;
BEGIN
    SELECT 
        (CASE WHEN email_verified THEN 20 ELSE 0 END +
         CASE WHEN phone_verified THEN 20 ELSE 0 END +
         CASE WHEN id_verified THEN 30 ELSE 0 END +
         CASE WHEN address_verified THEN 15 ELSE 0 END +
         CASE WHEN payment_verified THEN 15 ELSE 0 END)
    INTO v_score
    FROM trust_scores
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate transaction score
CREATE OR REPLACE FUNCTION calculate_transaction_score(p_user_id VARCHAR)
RETURNS INT AS $$
DECLARE
    v_score INT := 0;
    v_success_rate DECIMAL;
    v_total INT;
BEGIN
    SELECT 
        total_transactions,
        CASE 
            WHEN total_transactions > 0 THEN 
                (successful_transactions::DECIMAL / total_transactions) * 100
            ELSE 0 
        END
    INTO v_total, v_success_rate
    FROM trust_scores
    WHERE user_id = p_user_id;
    
    -- Base score from success rate (max 60 points)
    v_score := LEAST((v_success_rate * 0.6)::INT, 60);
    
    -- Volume bonus (max 30 points)
    v_score := v_score + LEAST(v_total * 2, 30);
    
    -- Dispute penalty
    UPDATE trust_scores 
    SET transaction_score = v_score - (disputed_transactions * 10)
    WHERE user_id = p_user_id;
    
    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate reputation score
CREATE OR REPLACE FUNCTION calculate_reputation_score(p_user_id VARCHAR)
RETURNS INT AS $$
DECLARE
    v_score INT := 0;
    v_rating DECIMAL;
    v_total_reviews INT;
BEGIN
    SELECT average_rating, total_reviews
    INTO v_rating, v_total_reviews
    FROM trust_scores
    WHERE user_id = p_user_id;
    
    -- Base score from rating (max 70 points)
    IF v_rating IS NOT NULL THEN
        v_score := ((v_rating / 5.0) * 70)::INT;
    END IF;
    
    -- Review volume bonus (max 30 points)
    v_score := v_score + LEAST(v_total_reviews * 3, 30);
    
    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate activity score
CREATE OR REPLACE FUNCTION calculate_activity_score(p_user_id VARCHAR)
RETURNS INT AS $$
DECLARE
    v_score INT := 0;
    v_completion_rate DECIMAL;
    v_age_days INT;
BEGIN
    SELECT listing_completion_rate, account_age_days
    INTO v_completion_rate, v_age_days
    FROM trust_scores
    WHERE user_id = p_user_id;
    
    -- Completion rate (max 50 points)
    v_score := (v_completion_rate * 0.5)::INT;
    
    -- Account age bonus (max 30 points)
    v_score := v_score + LEAST(v_age_days / 10, 30);
    
    -- Listing volume (max 20 points)
    v_score := v_score + (
        SELECT LEAST(listings_created, 20)
        FROM trust_scores
        WHERE user_id = p_user_id
    );
    
    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate responsiveness score
CREATE OR REPLACE FUNCTION calculate_responsiveness_score(p_user_id VARCHAR)
RETURNS INT AS $$
DECLARE
    v_score INT := 0;
    v_response_rate DECIMAL;
    v_response_time INT;
BEGIN
    SELECT response_rate, avg_response_time_minutes
    INTO v_response_rate, v_response_time
    FROM trust_scores
    WHERE user_id = p_user_id;
    
    -- Response rate (max 60 points)
    v_score := (v_response_rate * 0.6)::INT;
    
    -- Response time bonus (max 40 points)
    IF v_response_time IS NOT NULL THEN
        v_score := v_score + CASE
            WHEN v_response_time <= 5 THEN 40
            WHEN v_response_time <= 15 THEN 30
            WHEN v_response_time <= 60 THEN 20
            WHEN v_response_time <= 240 THEN 10
            ELSE 0
        END;
    END IF;
    
    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate overall trust score
CREATE OR REPLACE FUNCTION calculate_overall_trust_score(p_user_id VARCHAR)
RETURNS INT AS $$
DECLARE
    v_overall INT := 0;
    v_verification INT;
    v_transaction INT;
    v_reputation INT;
    v_activity INT;
    v_responsiveness INT;
BEGIN
    -- Calculate all component scores
    v_verification := calculate_verification_score(p_user_id);
    v_transaction := calculate_transaction_score(p_user_id);
    v_reputation := calculate_reputation_score(p_user_id);
    v_activity := calculate_activity_score(p_user_id);
    v_responsiveness := calculate_responsiveness_score(p_user_id);
    
    -- Weighted average (total 1000 points)
    v_overall := (
        (v_verification * 2.0) +      -- 200 points max
        (v_transaction * 3.0) +       -- 300 points max
        (v_reputation * 2.5) +        -- 250 points max
        (v_activity * 1.5) +          -- 150 points max
        (v_responsiveness * 1.0)      -- 100 points max
    )::INT;
    
    -- Update trust scores
    UPDATE trust_scores
    SET 
        overall_score = v_overall,
        verification_score = v_verification,
        transaction_score = v_transaction,
        reputation_score = v_reputation,
        activity_score = v_activity,
        responsiveness_score = v_responsiveness,
        score_level = CASE
            WHEN v_overall >= 800 THEN 'elite'
            WHEN v_overall >= 600 THEN 'trusted'
            WHEN v_overall >= 400 THEN 'established'
            WHEN v_overall >= 200 THEN 'building'
            ELSE 'new'
        END,
        risk_level = CASE
            WHEN flags_received >= 5 OR disputed_transactions >= 3 THEN 'critical'
            WHEN flags_received >= 3 OR disputed_transactions >= 2 THEN 'high'
            WHEN flags_received >= 1 OR disputed_transactions >= 1 THEN 'medium'
            ELSE 'low'
        END,
        last_calculated_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN v_overall;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize trust score for new user
CREATE OR REPLACE FUNCTION initialize_trust_score(p_user_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    INSERT INTO trust_scores (user_id, account_age_days)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to recalculate trust score when events are added
CREATE OR REPLACE FUNCTION trigger_recalculate_trust()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_overall_trust_score(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trust_event_recalculate
AFTER INSERT ON trust_events
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_trust();

-- ============================================
-- DEFAULT TRUST RULES
-- ============================================

INSERT INTO trust_rules (rule_name, rule_category, rule_type, score_impact, component_target, trigger_event, description) VALUES
-- Verification Rules
('email_verified', 'verification', 'bonus', 20, 'verification', 'email_verified', 'User verified their email address'),
('phone_verified', 'verification', 'bonus', 20, 'verification', 'phone_verified', 'User verified their phone number'),
('id_verified', 'verification', 'bonus', 30, 'verification', 'id_verified', 'User completed identity verification'),
('address_verified', 'verification', 'bonus', 15, 'verification', 'address_verified', 'User verified their physical address'),
('payment_verified', 'verification', 'bonus', 15, 'verification', 'payment_verified', 'User added verified payment method'),

-- Transaction Rules
('first_sale', 'transaction', 'bonus', 50, 'transaction', 'sale_completed', 'User completed their first sale'),
('tenth_sale', 'transaction', 'bonus', 100, 'transaction', 'milestone_10_sales', 'User completed 10 successful sales'),
('transaction_dispute', 'transaction', 'penalty', -50, 'transaction', 'dispute_filed', 'Transaction disputed by buyer'),
('transaction_cancelled', 'transaction', 'penalty', -10, 'transaction', 'transaction_cancelled', 'Transaction cancelled'),

-- Reputation Rules
('first_review', 'reputation', 'bonus', 25, 'reputation', 'review_received', 'User received their first review'),
('five_star_review', 'reputation', 'bonus', 10, 'reputation', 'review_5_stars', '5-star review received'),
('one_star_review', 'reputation', 'penalty', -20, 'reputation', 'review_1_star', '1-star review received'),

-- Activity Rules
('first_listing', 'activity', 'bonus', 20, 'activity', 'listing_created', 'User created their first listing'),
('listing_sold', 'activity', 'bonus', 15, 'activity', 'listing_sold', 'User successfully sold a listing'),
('listing_expired', 'activity', 'penalty', -5, 'activity', 'listing_expired', 'Listing expired without sale'),

-- Responsiveness Rules
('quick_response', 'responsiveness', 'bonus', 10, 'responsiveness', 'message_response_fast', 'Responded to message within 5 minutes'),
('slow_response', 'responsiveness', 'penalty', -5, 'responsiveness', 'message_response_slow', 'Took over 24 hours to respond'),

-- Flag Rules
('listing_flagged', 'flag', 'penalty', -100, 'overall', 'listing_flagged', 'User listing was flagged for violation'),
('account_warning', 'flag', 'penalty', -150, 'overall', 'account_warning', 'User received account warning');

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

CREATE OR REPLACE VIEW trust_score_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.display_name,
    ts.overall_score,
    ts.score_level,
    ts.risk_level,
    ts.total_transactions,
    ts.successful_transactions,
    ts.average_rating,
    ts.total_reviews,
    ts.account_age_days,
    ts.email_verified,
    ts.phone_verified,
    ts.id_verified,
    ts.last_calculated_at
FROM users u
LEFT JOIN trust_scores ts ON u.id = ts.user_id;

CREATE OR REPLACE VIEW trust_leaderboard AS
SELECT 
    u.id,
    u.display_name,
    u.avatar,
    ts.overall_score,
    ts.score_level,
    ts.total_transactions,
    ts.average_rating,
    RANK() OVER (ORDER BY ts.overall_score DESC) as rank
FROM users u
INNER JOIN trust_scores ts ON u.id = ts.user_id
WHERE ts.overall_score > 0
ORDER BY ts.overall_score DESC
LIMIT 100;
