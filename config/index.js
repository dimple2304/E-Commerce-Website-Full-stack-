import dotenv from 'dotenv';
dotenv.config();

export const {
    DEBUG_MODE,
    EMAIL_USER,
    EMAIL_PASS
    
} = process.env;