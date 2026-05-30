export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  FCM = 'fcm',
  APNS = 'apns',
  IN_APP = 'in_app',
}
export enum NotificationTemplate {
  USER_REGISTRATION = 'user_registration',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  PROMOTION = 'promotion',
  SECURITY_ALERT = 'security_alert',
}

export enum NotificationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  IN_PROGRESS = 'in_progress',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export interface NotificationPayload {
  channel: NotificationChannel;
  recipient: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}
export interface NotificationProvider {
  channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<void>;
}
