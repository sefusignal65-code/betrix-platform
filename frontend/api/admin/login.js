import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '../../config/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { telegram_id, auth_date, hash } = req.body;

        // Verify if it's admin login
        if (telegram_id === AUTH_CONFIG.ADMIN_TELEGRAM_ID) {
            // Verify Telegram login widget data
            const isValid = verifyTelegramAuth(req.body);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid authentication' });
            }

            // Generate admin JWT token
            const token = jwt.sign(
                { 
                    telegram_id,
                    role: 'admin'
                },
                AUTH_CONFIG.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.status(200).json({ 
                token,
                role: 'admin',
                telegram_id
            });
        }

        return res.status(401).json({ error: 'Unauthorized' });
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

function verifyTelegramAuth(authData) {
    const { hash, ...data } = authData;
    
    // Create a string of key=value pairs sorted alphabetically
    const checkString = Object.keys(data)
        .sort()
        .map(k => `${k}=${data[k]}`)
        .join('\n');
    
    // Create a hash using bot token
    const secretKey = createHash('sha256')
        .update(AUTH_CONFIG.TELEGRAM_BOT_TOKEN)
        .digest();
    
    const hmac = createHash('sha256')
        .update(checkString)
        .update(secretKey)
        .digest('hex');
    
    return hmac === hash;
}