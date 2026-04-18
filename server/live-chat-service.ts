/**
 * Live Chat Service for Royal Voyage
 * Manages real-time customer support conversations
 */

import { chatLogger } from "./logger";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: number;
  senderType: "user" | "agent";
  message: string;
  attachments?: string[];
  timestamp: Date;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  userId: number;
  agentId?: number;
  subject: string;
  status: "open" | "closed" | "waiting";
  priority: "low" | "medium" | "high";
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

class LiveChatService {
  private conversations: Map<string, ChatConversation> = new Map();
  private activeAgents: Map<number, boolean> = new Map();

  /**
   * Start new conversation
   */
  async startConversation(userId: number, subject: string): Promise<ChatConversation> {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const conversation: ChatConversation = {
      id: conversationId,
      userId,
      subject,
      status: "open",
      priority: "medium",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.conversations.set(conversationId, conversation);

    chatLogger.info(`New conversation started`, {
      conversationId,
      userId,
      subject,
    });

    return conversation;
  }

  /**
   * Send message in conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: number,
    senderType: "user" | "agent",
    message: string,
    attachments?: string[]
  ): Promise<ChatMessage | null> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      chatLogger.warn(`Conversation not found: ${conversationId}`);
      return null;
    }

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId,
      senderType,
      message,
      attachments,
      timestamp: new Date(),
      read: false,
    };

    conversation.messages.push(chatMessage);
    conversation.updatedAt = new Date();

    // Mark conversation as waiting if user message
    if (senderType === "user" && conversation.status === "open") {
      conversation.status = "waiting";
    }

    // Mark conversation as open if agent message
    if (senderType === "agent" && conversation.status === "waiting") {
      conversation.status = "open";
    }

    chatLogger.info(`Message sent in conversation`, {
      conversationId,
      messageId: chatMessage.id,
      senderType,
      messageLength: message.length,
    });

    return chatMessage;
  }

  /**
   * Assign agent to conversation
   */
  async assignAgent(conversationId: string, agentId: number): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      chatLogger.warn(`Conversation not found: ${conversationId}`);
      return false;
    }

    conversation.agentId = agentId;
    conversation.updatedAt = new Date();

    chatLogger.info(`Agent assigned to conversation`, {
      conversationId,
      agentId,
    });

    return true;
  }

  /**
   * Close conversation
   */
  async closeConversation(conversationId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      chatLogger.warn(`Conversation not found: ${conversationId}`);
      return false;
    }

    conversation.status = "closed";
    conversation.resolvedAt = new Date();
    conversation.updatedAt = new Date();

    chatLogger.info(`Conversation closed`, {
      conversationId,
      messageCount: conversation.messages.length,
      duration: conversation.resolvedAt.getTime() - conversation.createdAt.getTime(),
    });

    return true;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: number): Promise<ChatConversation[]> {
    return Array.from(this.conversations.values()).filter((c) => c.userId === userId);
  }

  /**
   * Get open conversations
   */
  async getOpenConversations(): Promise<ChatConversation[]> {
    return Array.from(this.conversations.values()).filter((c) => c.status === "open");
  }

  /**
   * Get waiting conversations
   */
  async getWaitingConversations(): Promise<ChatConversation[]> {
    return Array.from(this.conversations.values()).filter((c) => c.status === "waiting");
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(conversationId: string, messageId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return false;
    }

    const message = conversation.messages.find((m) => m.id === messageId);

    if (!message) {
      return false;
    }

    message.read = true;

    return true;
  }

  /**
   * Set agent availability
   */
  setAgentAvailable(agentId: number, available: boolean) {
    this.activeAgents.set(agentId, available);

    chatLogger.info(`Agent availability updated`, {
      agentId,
      available,
    });
  }

  /**
   * Get available agents
   */
  getAvailableAgents(): number[] {
    return Array.from(this.activeAgents.entries())
      .filter(([_, available]) => available)
      .map(([agentId, _]) => agentId);
  }

  /**
   * Get conversation statistics
   */
  getStatistics() {
    const conversations = Array.from(this.conversations.values());

    return {
      totalConversations: conversations.length,
      openConversations: conversations.filter((c) => c.status === "open").length,
      waitingConversations: conversations.filter((c) => c.status === "waiting").length,
      closedConversations: conversations.filter((c) => c.status === "closed").length,
      averageResponseTime: this.calculateAverageResponseTime(),
      averageResolutionTime: this.calculateAverageResolutionTime(),
    };
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(): number {
    const conversations = Array.from(this.conversations.values()).filter(
      (c) => c.messages.length > 1
    );

    if (conversations.length === 0) return 0;

    const responseTimes = conversations.map((c) => {
      const userMessages = c.messages.filter((m) => m.senderType === "user");
      const agentMessages = c.messages.filter((m) => m.senderType === "agent");

      if (userMessages.length === 0 || agentMessages.length === 0) return 0;

      const firstUserMessage = userMessages[0];
      const firstAgentMessage = agentMessages.find((m) => m.timestamp > firstUserMessage.timestamp);

      if (!firstAgentMessage) return 0;

      return firstAgentMessage.timestamp.getTime() - firstUserMessage.timestamp.getTime();
    });

    return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  }

  /**
   * Calculate average resolution time
   */
  private calculateAverageResolutionTime(): number {
    const closedConversations = Array.from(this.conversations.values()).filter(
      (c) => c.status === "closed" && c.resolvedAt
    );

    if (closedConversations.length === 0) return 0;

    const resolutionTimes = closedConversations.map((c) => {
      return c.resolvedAt!.getTime() - c.createdAt.getTime();
    });

    return resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
  }
}

// Export singleton instance
export const liveChatService = new LiveChatService();

export default LiveChatService;
