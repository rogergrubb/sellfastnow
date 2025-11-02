-- Notifications System Migration
-- Creates tables for in-app notifications and user notification preferences

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'message', 'offer', 'review', 'transaction', 'sale', 'purchase', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id VARCHAR, -- ID of related entity (message, listing, transaction, etc.)
  related_type VARCHAR(50), -- 'message', 'listing', 'transaction', 'review', 'offer'
  action_url VARCHAR(500), -- URL to navigate to when clicked
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  read_at TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- In-app notification preferences
  in_app_messages BOOLEAN NOT NULL DEFAULT true,
  in_app_offers BOOLEAN NOT NULL DEFAULT true,
  in_app_reviews BOOLEAN NOT NULL DEFAULT true,
  in_app_transactions BOOLEAN NOT NULL DEFAULT true,
  in_app_sales BOOLEAN NOT NULL DEFAULT true,
  in_app_purchases BOOLEAN NOT NULL DEFAULT true,
  in_app_system BOOLEAN NOT NULL DEFAULT true,
  
  -- Email notification preferences
  email_messages BOOLEAN NOT NULL DEFAULT true,
  email_offers BOOLEAN NOT NULL DEFAULT true,
  email_reviews BOOLEAN NOT NULL DEFAULT true,
  email_transactions BOOLEAN NOT NULL DEFAULT true,
  email_sales BOOLEAN NOT NULL DEFAULT true,
  email_purchases BOOLEAN NOT NULL DEFAULT true,
  email_system BOOLEAN NOT NULL DEFAULT false,
  email_daily_digest BOOLEAN NOT NULL DEFAULT false,
  email_weekly_digest BOOLEAN NOT NULL DEFAULT false,
  
  -- SMS notification preferences
  sms_messages BOOLEAN NOT NULL DEFAULT false,
  sms_offers BOOLEAN NOT NULL DEFAULT false,
  sms_reviews BOOLEAN NOT NULL DEFAULT false,
  sms_transactions BOOLEAN NOT NULL DEFAULT false,
  sms_sales BOOLEAN NOT NULL DEFAULT false,
  sms_purchases BOOLEAN NOT NULL DEFAULT false,
  sms_system BOOLEAN NOT NULL DEFAULT false,
  
  -- Quiet hours (no notifications during this time)
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME, -- e.g., '22:00:00'
  quiet_hours_end TIME, -- e.g., '08:00:00'
  quiet_hours_timezone VARCHAR(50) DEFAULT 'America/New_York',
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create default preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Notification delivery log (for tracking sent emails/SMS)
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id VARCHAR REFERENCES notifications(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivery_method VARCHAR(20) NOT NULL, -- 'email', 'sms', 'in_app'
  status VARCHAR(20) NOT NULL, -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  recipient VARCHAR(255), -- email address or phone number
  error_message TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_log_notification_id ON notification_delivery_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_user_id ON notification_delivery_log(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_status ON notification_delivery_log(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Comments for documentation
COMMENT ON TABLE notifications IS 'Stores in-app notifications for users';
COMMENT ON TABLE notification_preferences IS 'User preferences for different notification channels';
COMMENT ON TABLE notification_delivery_log IS 'Tracks delivery status of email and SMS notifications';
