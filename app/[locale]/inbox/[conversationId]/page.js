"use client";

import { use } from "react";
import ChatThread from "@/components/ChatThread";

export default function ThreadPage({ params }) {
  const { conversationId } = use(params);
  return <ChatThread conversationId={conversationId} />;
}
