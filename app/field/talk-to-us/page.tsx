"use client";

import { TalkToUs, type TalkApi } from "@/components/talk-to-us";
import { apiClient } from "@/lib/api-client";

// Round 48 Part D -- raise a request to admin and read the replies (GET/POST /field/info-center/talk).
const api: TalkApi = {
  list: () => apiClient.talkList().then((r) => r.data),
  create: (subject, message) => apiClient.talkCreate(subject, message).then((r) => r.data),
  reply: (id, message) => apiClient.talkReply(id, message).then((r) => r.data),
  info: () => apiClient.infoFeed().then((r) => r.data.talkInfo)
};

export default function TalkToUsPage() {
  return <TalkToUs api={api} />;
}
