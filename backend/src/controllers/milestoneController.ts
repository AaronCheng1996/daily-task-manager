import logger from "../utils/logger";
import { ErrorType, SuccessMessage } from "../utils/messages.enum";
import { MilestoneService } from "../services/milestoneService";
import { AuthRequest } from "../utils/auth";
import { Response } from "express";
import { z } from "zod";

const createMilestoneSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    order_index: z.number().int().min(0)
});

const updateMilestoneSchema = createMilestoneSchema.partial();

const milestoneController = {
    getMilestones: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const milestones = await MilestoneService.getTaskMilestones(req.params.id);
            res.json({ milestones });
        } catch (error) {
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    createMilestone: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const rawData = req.body.milestoneData || req.body;
            const milestoneData = createMilestoneSchema.parse(rawData);
            const milestone = await MilestoneService.createMilestone(req.params.id, milestoneData);
            res.json({ message: SuccessMessage.MILESTONE_CREATED, milestone });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
            
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
            
            if (error instanceof Error && error.message === ErrorType.BAD_REQUEST) {
                res.status(400).json({ error: ErrorType.BAD_REQUEST });
                return;
            }
            
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    updateMilestone: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const rawData = req.body.milestoneData || req.body;
            const milestoneData = updateMilestoneSchema.parse(rawData);
            const milestone = await MilestoneService.updateMilestone(req.params.id, milestoneData);
            res.json({ message: SuccessMessage.MILESTONE_UPDATED, milestone });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ 
                    error: ErrorType.VALIDATION_ERROR, 
                    details: error.errors 
                });
                return;
            }
            
            if (error instanceof Error && error.message === ErrorType.NOT_FOUND) {
                res.status(404).json({ error: ErrorType.NOT_FOUND });
                return;
            }
            
            if (error instanceof Error && error.message === ErrorType.BAD_REQUEST) {
                res.status(400).json({ error: ErrorType.BAD_REQUEST });
                return;
            }
            
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    deleteMilestone: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await MilestoneService.deleteMilestone(req.params.id);
            res.json({ message: SuccessMessage.MILESTONE_DELETED });
        } catch (error) {
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    toggleMilestoneCompletion: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            await MilestoneService.toggleMilestoneCompletion(req.params.id);
            res.json({ message: SuccessMessage.TASK_COMPLETION_TOGGLED });
        } catch (error) {
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    },
    reorderMilestones: async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const milestoneOrders = req.body.milestoneOrders || req.body;
            await MilestoneService.reorderMilestones(req.params.id, milestoneOrders);
            res.json({ message: SuccessMessage.MILESTONES_REORDERED });
        } catch (error) {
            logger.error(error);
            res.status(500).json({ error: ErrorType.INTERNAL_SERVER_ERROR });
        }
    }
}

export default milestoneController;