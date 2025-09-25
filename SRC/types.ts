export type SessionData = {
  step: number,
  data: {
    first_name?: string,
    last_name?: string,
    mobile?: string,
    reporter_city?: string,
    event_city?: string,
    description?: string,
    attachment?: string | null,
    topic?: string,
    subtopic?: string
  }
};

export type MessageIn = {
  sessionId: string,
  text?: string,
  attachmentUrl?: string
};
