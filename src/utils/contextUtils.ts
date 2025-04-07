import { Message, Conversation } from '../types';

/**
 * Maximum number of messages to include in context when not selecting specifically
 */
const MAX_CONTEXT_MESSAGES = 20;

/**
 * Calculate term frequency for a string
 * @param text Input text
 * @returns Map of terms to frequencies
 */
export const calculateTermFrequency = (text: string): Map<string, number> => {
    const terms = text.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/) // Split by whitespace
        .filter(term => term.length > 1); // Filter out single letters and empty strings

    const termFrequency = new Map<string, number>();

    // Count occurrences of each term
    for (const term of terms) {
        const currentCount = termFrequency.get(term) || 0;
        termFrequency.set(term, currentCount + 1);
    }

    return termFrequency;
};

/**
 * Calculate inverse document frequency across all messages
 * @param messages Array of messages
 * @returns Map of terms to IDF values
 */
export const calculateInverseDocumentFrequency = (messages: Message[]): Map<string, number> => {
    const documentCount = messages.length;
    const termDocumentCount = new Map<string, number>();
    const idf = new Map<string, number>();

    // Calculate how many documents each term appears in
    for (const message of messages) {
        const terms = new Set(
            message.content.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(term => term.length > 1)
        );

        for (const term of terms) {
            const currentCount = termDocumentCount.get(term) || 0;
            termDocumentCount.set(term, currentCount + 1);
        }
    }

    // Calculate IDF for each term
    for (const [term, count] of termDocumentCount.entries()) {
        // Use a smoothed IDF calculation to prevent division by zero
        const idfValue = Math.log((documentCount + 1) / (count + 1)) + 1;
        idf.set(term, idfValue);
    }

    return idf;
};

/**
 * Calculate relevance score between query and message
 * @param query The query text
 * @param message The message to compare against
 * @param idf Global IDF values
 * @returns Relevance score
 */
export const calculateRelevanceScore = (query: string, message: Message, idf: Map<string, number>): number => {
    const queryTerms = calculateTermFrequency(query);
    const messageTerms = calculateTermFrequency(message.content);

    let score = 0;

    // For each term in the query, calculate TF-IDF contribution to the score
    for (const [term, frequency] of queryTerms.entries()) {
        const messageFrequency = messageTerms.get(term) || 0;
        const idfValue = idf.get(term) || 1; // Default to 1 if term isn't in IDF

        // TF-IDF score for this term
        const termScore = frequency * messageFrequency * idfValue;
        score += termScore;
    }

    return score;
};

/**
 * Calculate live relevance scores for all messages as user types
 * @param conversation The full conversation
 * @param currentInput The current input text being typed
 * @returns Map of message indices to relevance scores
 */
export const calculateLiveRelevanceScores = (conversation: Conversation, currentInput: string): Map<number, number> => {
    // Don't calculate if input is too short
    if (!currentInput || currentInput.trim().length < 2) {
        return new Map<number, number>();
    }

    const messages = conversation.messages;
    const regularMessages = messages.filter(msg => msg.role !== 'system');
    const idf = calculateInverseDocumentFrequency(regularMessages);

    const scoreMap = new Map<number, number>();

    // Calculate scores for each message by index
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const score = calculateRelevanceScore(currentInput, message, idf);
        // Round to 2 decimal places for display
        scoreMap.set(i, Math.round(score * 100) / 100);
    }

    return scoreMap;
};

/**
 * Find relevant messages based on the new query and star status
 * @param conversation The full conversation
 * @param newQuery The new user message/query
 * @returns Array of messages to include in context
 */
export const findRelevantMessages = (conversation: Conversation, newQuery: string): Message[] => {
    const allMessages = conversation.messages.slice();

    // Always include the system message if present
    const systemMessages = allMessages.filter(msg => msg.role === 'system');

    // Always include starred messages
    const starredMessages = allMessages.filter(msg => msg.starred);

    // Get remaining messages that aren't starred or system
    const regularMessages = allMessages.filter(msg =>
        msg.role !== 'system' && !msg.starred
    );

    // If we have very few messages, just return them all
    if (allMessages.length <= MAX_CONTEXT_MESSAGES) {
        return allMessages;
    }

    // Calculate IDF across all regular messages for better scoring
    const idf = calculateInverseDocumentFrequency(regularMessages);

    // Score regular messages by relevance to the query
    const scoredMessages = regularMessages.map(msg => ({
        message: msg,
        score: calculateRelevanceScore(newQuery, msg, idf)
    }));

    // Sort by score descending
    scoredMessages.sort((a, b) => b.score - a.score);

    // Select top scoring messages up to limit
    const selectedRegularMessages = scoredMessages
        .slice(0, MAX_CONTEXT_MESSAGES)
        .map(item => item.message);

    // Combine all selected messages
    const selectedMessages = [
        ...systemMessages,
        ...starredMessages,
        ...selectedRegularMessages
    ];

    // Sort by original position in the conversation to maintain order
    const messageIndices = new Map<Message, number>();
    allMessages.forEach((msg, index) => {
        messageIndices.set(msg, index);
    });

    selectedMessages.sort((a, b) => {
        const indexA = messageIndices.get(a) ?? 0;
        const indexB = messageIndices.get(b) ?? 0;
        return indexA - indexB;
    });

    return selectedMessages;
};
