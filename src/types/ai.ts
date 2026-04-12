/**
 * AI conversation types
 */

export type MessageType  = 'user' | 'ai' | 'system';
export type AIIntent     = 'discovery' | 'origin' | 'impact' | 'brewing' | 'products' | 'chakanTree' | 'order' | 'shipping' | 'account' | 'general';

export interface Message {
  id:          string;
  type:        MessageType;
  content:     string;
  timestamp:   number;
  isStreaming?: boolean;
  intent?:     AIIntent | null;
  followUps?:  string[];
}

export interface ConversationContext {
  isEmpty:             boolean;
  messageCount:        number;
  userMessageCount:    number;
  intentHistory:       AIIntent[];
  lastIntent:          AIIntent | null;
  firstMessage:        string;
  chakanTreeMentioned: boolean;
  productsMentioned:   boolean;
  topics:              AIIntent[];
}

export interface AIState {
  messages:                Message[];
  isStreaming:             boolean;
  currentStreamingMessage: string;
  currentIntent:           AIIntent | null;
  suggestedFollowUps:      string[];
  conversationId:          string | null;
  error:                   string | null;
}

export interface StreamResult {
  content:    string;
  intent:     AIIntent | null;
  followUps:  string[];
  usage?:     { input_tokens: number; output_tokens: number };
  stopReason?: string;
}