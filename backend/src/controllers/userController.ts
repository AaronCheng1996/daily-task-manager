import { Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/userService';
import { AuthRequest } from '../utils/auth';
import logger from '../utils/logger';
import { ErrorType, SuccessMessage } from '../utils/messages.enum';

const registerSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6)
});

const loginSchema = z.object({
    usernameOrEmail: z.string(),
    password: z.string()
});

const userController = {
    register: async (req: AuthRequest, res: Response): Promise<void> => {
        try {   
            const { username, email, password } = registerSchema.parse(req.body);
            
            const result = await UserService.register(username, email, password);
            
            res.status(201).json({
            message: SuccessMessage.USER_REGISTERED,
            user: result.user,
            token: result.token
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
            
            if (error instanceof Error && error.message === ErrorType.USER_ALREADY_EXISTS) {
                res.status(409).json({ error: ErrorType.USER_ALREADY_EXISTS });
                return;
            }
            
            logger.error('Registration error:', error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },

    login: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { usernameOrEmail, password } = loginSchema.parse(req.body);
            
            const result = await UserService.login(usernameOrEmail, password);
            
            res.json({
            message: SuccessMessage.USER_LOGGED_IN,
            user: result.user,
            token: result.token
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
            
            if (error instanceof Error && error.message === ErrorType.INVALID_CREDENTIALS) {
                res.status(401).json({ error: ErrorType.INVALID_CREDENTIALS });
                return;
            }
            
            logger.error('Login error:', error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },

    getProfile: async (req: AuthRequest, res: Response): Promise<void> => {
        res.json({ user: (req as AuthRequest).user });
    },
 
    updateProfile: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const updateSchema = z.object({
            username: z.string().min(3).max(50).optional(),
            email: z.string().email().optional(),
            preferred_language: z.string().max(10).optional(),
            timezone: z.string().max(50).optional()
            });
            
            const updates = updateSchema.parse(req.body);
            const updatedUser = await UserService.updateUser((req as AuthRequest).user!.id, updates);
            
            res.json({
            message: SuccessMessage.USER_PROFILE_UPDATED,
            user: updatedUser
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
            
            logger.error('Profile update error:', error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    }
}

export default userController;
