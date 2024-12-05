"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import DOMPurify from "isomorphic-dompurify";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

const supabase = createServerComponentClient({ cookies });

export async function sendAndGetMessages(chatId: string, message: string) {
  const supabase = createServerComponentClient({ cookies });
  const sanitizedMessage = DOMPurify.sanitize(message.trim());

  if (!sanitizedMessage) throw new Error("Message cannot be empty");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const [sendResult, messagesResult] = await Promise.all([
    supabase
      .from("messages")
      .insert([
        {
          content: sanitizedMessage,
          user_id: user.id,
          is_agent: false,
          chat_id: chatId,
        },
      ])
      .select()
      .single(),
    supabase
      .from("messages")
      .select("id, content, is_agent, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  if (sendResult.error) throw sendResult.error;
  if (messagesResult.error) throw messagesResult.error;

  return messagesResult.data;
}

export async function getEmployees(search?: string) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    let query = serviceClient
      .from("employees")
      .select("employee_id, name, contact_info, avatar_url")
      .eq("status", "active");

    if (search) {
      const sanitizedSearch = DOMPurify.sanitize(search.trim());
      query = query.ilike("name", `%${sanitizedSearch}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("getEmployees error:", error);
    throw error;
  }
}

export async function createChat(users: string[]) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .insert({ name: users.length > 2 ? "Group Chat" : null })
    .select()
    .single();

  if (chatError) throw chatError;

  const participants = [...users, user.id].map((userId) => ({
    chat_id: chat.id,
    user_id: userId,
  }));

  const { error: participantError } = await supabase
    .from("chat_participants")
    .insert(participants);

  if (participantError) throw participantError;

  const notifications = participants.map((participant) => ({
    user_id: participant.user_id,
    type: "new_chat",
    content: `You have been added to a new chat`,
    chat_id: chat.id,
  }));

  const { error: notificationError } = await supabase
    .from("notifications")
    .insert(notifications);

  if (notificationError) throw notificationError;

  return chat.id;
}

export async function getChatParticipants(chatId: string) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("chat_participants")
    .select("user_id")
    .eq("chat_id", chatId);

  if (error) throw error;

  return data.map((participant) => participant.user_id);
}

export async function deleteChat(chatId: string): Promise<void> {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Delete all messages first
  const { error: messagesError } = await supabase
    .from("messages")
    .delete()
    .eq("chat_id", chatId);

  if (messagesError) throw messagesError;

  // Delete all chat participants
  const { error: participantsError } = await supabase
    .from("chat_participants")
    .delete()
    .eq("chat_id", chatId);

  if (participantsError) throw participantsError;

  // Finally delete the chat itself
  const { error: chatError } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId);

  if (chatError) throw chatError;
}

export async function markMessagesAsRead(chatId: string, userId: string) {
  try {
    // First, get all messages for this chat
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(
        `
        id,
        read:message_reads!left(
          user_id
        )
      `
      )
      .eq("chat_id", chatId);

    if (messagesError) throw messagesError;

    // Filter for unread messages
    const unreadMessages = messages?.filter(
      (msg) => !msg.read.some((r: { user_id: string }) => r.user_id === userId)
    );

    if (unreadMessages?.length) {
      // Prepare the data for insertion into message_reads
      const messageReads = unreadMessages.map((msg) => ({
        message_id: msg.id,
        user_id: userId,
      }));

      // Insert the read status into message_reads
      const { error: insertError } = await supabase
        .from("message_reads")
        .insert(messageReads);

      if (insertError) {
        console.error("Error marking messages as read:", insertError);
        throw insertError;
      }
    }
  } catch (error) {
    console.error("markMessagesAsRead error:", error);
    throw error;
  }
}

export async function sendMessage(
  content: string,
  chatId: string,
  userId: string,
  recipientId: string
) {
  const supabase = createClientComponentClient();

  try {
    // Send message and create notification in a single transaction
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        content,
        chat_id: chatId,
        user_id: userId,
        is_agent: false,
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Only create notification if recipient is different from sender
    if (userId !== recipientId) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: recipientId,
          type: "new_message",
          content: `New message in chat`,
          chat_id: chatId,
          read: false,
        });

      if (notificationError) throw notificationError;
    }

    return message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

export async function sendMessageWithNotification(
  content: string,
  chatId: string,
  userId: string,
  recipientId: string
) {
  const supabase = createClientComponentClient();

  try {
    // Send the message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        content,
        chat_id: chatId,
        user_id: userId,
        is_agent: false,
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Create a notification for the recipient
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: recipientId,
        type: "new_message",
        content: `New message in chat`,
        chat_id: chatId,
        read: false,
      });

    if (notificationError) throw notificationError;

    return message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}
