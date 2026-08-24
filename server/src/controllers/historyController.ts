import { Request, Response } from 'express';
import { historyService } from '../services/historyService';

export const listConversationsHandler = async (req: Request, res: Response) => {
  try {
    const projectId = (req.query.projectId as string) || (req.body?.projectId as string) || 'demo-project';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const search = req.query.search as string;

    const conversations = await historyService.listConversations(projectId, limit, search);
    return res.json({
      success: true,
      data: conversations,
    });
  } catch (err: any) {
    console.error('❌ Error listing conversations:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'HISTORY_FETCH_FAILED',
        message: err.message || 'History could not be loaded from database.',
      },
    });
  }
};

export const getConversationByIdHandler = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Conversation ID is required' },
      });
    }

    const data = await historyService.getConversationById(id);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' },
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('❌ Error fetching conversation by ID:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CONVERSATION_FETCH_FAILED',
        message: err.message || 'Failed to retrieve conversation details.',
      },
    });
  }
};

export const createConversationHandler = async (req: Request, res: Response) => {
  try {
    const { projectId, title, provider, model } = req.body;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'projectId is required' },
      });
    }

    const conversation = await historyService.createConversation(
      projectId,
      title || 'New Conversation',
      provider || 'gemini',
      model || 'gemini-3.1-flash-lite'
    );

    return res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (err: any) {
    console.error('❌ Error creating conversation:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CONVERSATION_CREATE_FAILED',
        message: err.message || 'Could not create new conversation.',
      },
    });
  }
};

export const renameConversationHandler = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { title } = req.body;

    if (!id || !title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Conversation ID and non-empty title are required' },
      });
    }

    const updated = await historyService.renameConversation(id, title.trim());
    return res.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    console.error('❌ Error renaming conversation:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CONVERSATION_RENAME_FAILED',
        message: err.message || 'Failed to rename conversation.',
      },
    });
  }
};

export const deleteConversationHandler = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    if (!id) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Conversation ID is required' },
      });
    }

    await historyService.deleteConversation(id);
    return res.json({
      success: true,
      message: 'Conversation deleted successfully.',
    });
  } catch (err: any) {
    console.error('❌ Error deleting conversation:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CONVERSATION_DELETE_FAILED',
        message: err.message || 'Failed to delete conversation.',
      },
    });
  }
};
