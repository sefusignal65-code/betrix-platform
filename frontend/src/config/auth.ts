export const AUTH_CONFIG = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    ADMIN_TELEGRAM_ID: process.env.ADMIN_TELEGRAM_ID,
    JWT_SECRET: process.env.JWT_SECRET,
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000'
};

export const AUTH_ENDPOINTS = {
    ADMIN_LOGIN: '/api/admin/login',
    USER_LOGIN: '/api/auth/login',
    VERIFY_TELEGRAM: '/api/auth/verify-telegram',
    USER_REGISTER: '/api/auth/register',
    SUBSCRIPTION_CHECK: '/api/auth/check-subscription'
};

export const TELEGRAM_DEEP_LINK_PREFIX = 'https://t.me/BetrixAIBot?start=';