import { Conversation } from '../types';

export interface ScoredConversation {
    conversation: Conversation;
    score: number;
    hasTitleMatch: boolean;
}

/**
 * Calculates search score for a conversation based on given search terms
 */
export const calculateSearchScore = (conversation: Conversation, terms: string[]): {
    score: number,
    hasTitleMatch: boolean;
} => {
    let totalScore = 0;
    let hasTitleMatch = false;

    // Skip scoring if no search terms
    if (terms.length === 0) return { score: 0, hasTitleMatch: false };

    const title = conversation.title.toLowerCase();

    for (const term of terms) {
        if (!term.trim()) continue;

        // Check if title contains the exact term (case insensitive)
        if (title.includes(term)) {
            hasTitleMatch = true;
        }

        // Score title matches higher (3 points per match)
        const titleMatches = (title.match(new RegExp(term, 'gi')) || []).length;
        totalScore += titleMatches * 3;

        // Score message content (1 point per match)
        for (const message of conversation.messages) {
            const contentMatches = (message.content.toLowerCase().match(new RegExp(term, 'gi')) || []).length;
            totalScore += contentMatches;
        }
    }

    return { score: totalScore, hasTitleMatch };
};

/**
 * Filter and sort conversations based on search query
 */
export const filterConversations = (
    conversations: Conversation[],
    searchQuery: string
): Conversation[] => {
    // If search is empty, return all conversations
    if (!searchQuery.trim()) {
        return conversations;
    }

    // Split search query into terms (by space)
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);

    // Score each conversation based on search terms
    const scoredConversations: ScoredConversation[] = conversations.map(conversation => {
        const { score, hasTitleMatch } = calculateSearchScore(conversation, searchTerms);
        return {
            conversation,
            score,
            hasTitleMatch
        };
    });

    // Filter out zero-score conversations
    const matchingConversations = scoredConversations.filter(item => item.score > 0);

    // First sort by title match flag, then by score
    matchingConversations.sort((a, b) => {
        // First prioritize title matches
        if (a.hasTitleMatch && !b.hasTitleMatch) return -1;
        if (!a.hasTitleMatch && b.hasTitleMatch) return 1;

        // Then sort by score for same category
        return b.score - a.score;
    });

    return matchingConversations.map(item => item.conversation);
};
