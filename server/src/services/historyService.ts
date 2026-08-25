import { prisma } from '../config';

export class HistoryService {
  /**
   * List conversations for a specific project with isolation & optional title/content search
   */
  async listConversations(projectId?: string, limit = 50, search?: string) {
    const searchFilter = search && search.trim()
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            {
              messages: {
                some: {
                  content: { contains: search, mode: 'insensitive' as const },
                },
              },
            },
          ],
        }
      : {};

    const whereClause = projectId ? { projectId, ...searchFilter } : { ...searchFilter };

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return conversations.map((c) => ({
      id: c.id,
      projectId: c.projectId,
      title: c.title,
      provider: c.provider || 'gemini',
      model: c.model || 'gemini-3.1-flash-lite',
      lastMessage: c.messages[0]?.content || null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  /**
   * Fetch single conversation by ID along with full message history
   */
  async getConversationById(id: string) {
    if (!id) {
      throw new Error('Conversation ID is required');
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return null;
    }

    const messages = conversation.messages.map((m) => {
      let parsedSources = [];
      if (m.sources) {
        try {
          parsedSources = JSON.parse(m.sources);
        } catch {
          parsedSources = [];
        }
      }

      return {
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        provider: m.provider || conversation.provider,
        model: m.model || conversation.model,
        sources: parsedSources,
        grounded: m.grounded,
        isError: m.isError,
        createdAt: m.createdAt.toISOString(),
      };
    });

    return {
      conversation: {
        id: conversation.id,
        projectId: conversation.projectId,
        title: conversation.title,
        provider: conversation.provider,
        model: conversation.model,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      messages,
    };
  }

  /**
   * Get or create active conversation for a project
   */
  async getOrCreateActiveConversation(projectId: string, defaultProvider = 'gemini', defaultModel = 'gemini-3.1-flash-lite') {
    let conversation = await prisma.conversation.findFirst({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          projectId,
          title: 'ContentSpine Q&A Session',
          provider: defaultProvider,
          model: defaultModel,
        },
      });
    }

    return conversation;
  }

  /**
   * Create a new conversation
   */
  async createConversation(projectId: string, title: string, provider = 'gemini', model = 'gemini-3.1-flash-lite') {
    if (!projectId) {
      throw new Error('projectId is required');
    }

    const conversation = await prisma.conversation.create({
      data: {
        projectId,
        title: title || 'New Conversation',
        provider,
        model,
      },
    });

    return {
      id: conversation.id,
      projectId: conversation.projectId,
      title: conversation.title,
      provider: conversation.provider,
      model: conversation.model,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  /**
   * Rename a conversation title in Neon database
   */
  async renameConversation(id: string, title: string) {
    if (!id || !title.trim()) {
      throw new Error('Conversation ID and a valid title are required');
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        title: title.trim(),
      },
    });

    return {
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  /**
   * Delete a conversation from Neon database (cascade removes messages)
   */
  async deleteConversation(id: string) {
    if (!id) {
      throw new Error('Conversation ID is required');
    }

    await prisma.conversation.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Save a message (user or assistant) to Neon database and update conversation timestamp
   */
  async saveMessage(params: {
    conversationId: string;
    role: string;
    content: string;
    provider?: string;
    model?: string;
    sources?: any[];
    grounded?: boolean;
    isError?: boolean;
  }) {
    const { conversationId, role, content, provider, model, sources, grounded = true, isError = false } = params;

    if (!conversationId || !role || !content) {
      throw new Error('conversationId, role, and content are required');
    }

    const sourcesJson = sources && Array.isArray(sources) && sources.length > 0 ? JSON.stringify(sources) : null;

    const message = await prisma.message.create({
      data: {
        conversationId,
        role: role.toUpperCase(),
        content,
        provider,
        model,
        sources: sourcesJson,
        grounded,
        isError,
      },
    });

    // Touch conversation updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    let parsedSources = [];
    if (message.sources) {
      try {
        parsedSources = JSON.parse(message.sources);
      } catch {
        parsedSources = [];
      }
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      provider: message.provider,
      model: message.model,
      sources: parsedSources,
      grounded: message.grounded,
      isError: message.isError,
      createdAt: message.createdAt.toISOString(),
    };
  }

  /**
   * Auto-generate conversation title from 1st user query (Requirement 11)
   */
  async autoUpdateConversationTitleFromMessage(conversationId: string, userQuery: string) {
    if (!conversationId || !userQuery || !userQuery.trim()) return;

    try {
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (conv && (conv.title === 'ContentSpine Q&A Session' || conv.title === 'New Conversation')) {
        let cleanTitle = userQuery.trim().replace(/^["'\s]+|["'\s]+$/g, '');
        if (cleanTitle.length > 45) {
          cleanTitle = cleanTitle.substring(0, 42) + '...';
        }
        // Capitalize first letter
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { title: cleanTitle },
        });
      }
    } catch {
      // Ignore title update failures
    }
  }

  /**
   * Record Generation Activity in Neon for analytics
   */
  async recordGenerationActivity(params: {
    projectId: string;
    conversationId?: string;
    provider: string;
    model?: string;
    status: string;
    latencyMs?: number;
    errorCode?: string;
    retryAfterSeconds?: number;
  }) {
    try {
      return await prisma.generationActivity.create({
        data: {
          projectId: params.projectId,
          conversationId: params.conversationId,
          provider: params.provider,
          model: params.model,
          status: params.status,
          latencyMs: params.latencyMs,
          errorCode: params.errorCode,
          retryAfterSeconds: params.retryAfterSeconds,
        },
      });
    } catch {
      // Non-blocking log write
      return null;
    }
  }

  /**
   * Record Export History in Neon
   */
  async recordExportHistory(params: {
    projectId: string;
    conversationId?: string;
    format: string;
    filename: string;
  }) {
    try {
      return await prisma.exportHistory.create({
        data: {
          projectId: params.projectId,
          conversationId: params.conversationId,
          format: params.format,
          filename: params.filename,
        },
      });
    } catch {
      return null;
    }
  }
}

export const historyService = new HistoryService();
