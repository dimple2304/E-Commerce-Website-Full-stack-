import { DEBUG_MODE } from '../config/index.js';
import Joi from 'joi';

const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let data = {
        message: "Internal server error",
        ...(DEBUG_MODE === 'true' && { originalError: err.message })
    };

    if (err && err.isJoi) { 
        statusCode = 422;  // Unprocessable Entity
        data = {
            message: err.details?.[0]?.message || err.message
        };
    }

    return res.status(statusCode).json(data);
};

export default errorHandler;
