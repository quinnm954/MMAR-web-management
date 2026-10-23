export const GOOGLE_REVIEW_URL = "https://share.google/bx2Gb42dslCITJdS8";

export interface FeedbackRecord {
  rating: number | null;
  satisfied: boolean | null;
  status: string;
}

export const needsFeedbackAttention = (row: FeedbackRecord) =>
  row.status !== "resolved" && (row.satisfied === false || (row.satisfied === null && row.rating !== null && row.rating < 5));

export const isSatisfiedFeedback = (row: FeedbackRecord) =>
  row.satisfied === true || (row.satisfied === null && row.rating !== null && row.rating >= 4);

export function feedbackComments(comments: string, context?: string) {
  return [context ? `Ref: ${context}` : "", comments.trim()].filter(Boolean).join("\n").slice(0, 2000) || null;
}