"use client";
import { useEffect, useState, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useRole } from "@/context/RoleContext"; // Import useRole

const title = "TGR Ops Chat";

export default function ChatClient() {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<
    {
      user: string;
      message: string;
    }[]
  >([]);
  const { user, role, loading } = useRole(); // Use useRole hook
  const [username, setUsername] = useState<string>("");

  const channel = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchUsername = async () => {
      if (user) {
        const { data: userData, error } = await client
          .from("employees")
          .select("name")
          .eq("user_uuid", user.id)
          .single();
        if (userData) {
          setUsername(userData.name);
        } else {
          console.error("Error fetching username:", error?.message);
        }
      }
    };

    fetchUsername();

    if (!channel.current) {
      channel.current = client.channel("chat-room", {
        config: {
          broadcast: {
            self: true,
          },
        },
      });
      channel.current
        .on("broadcast", { event: "message" }, ({ payload }) => {
          setMessages((prev) => [...prev, payload.message]);
        })
        .subscribe();
    }

    return () => {
      channel.current?.unsubscribe();
      channel.current = null;
    };
  }, [user]);

  function onSend() {
    // console.log("Sending message:", message);
    if (
      !channel.current ||
      message.trim().length === 0 ||
      username.trim().length === 0
    ) {
      console.warn("Cannot send message:", {
        message,
        username,
        channel: channel.current,
      });
      return;
    }
    channel.current.send({
      type: "broadcast",
      event: "message",
      payload: { message: { message, user: username } },
    });
    setMessage("");
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <h1 className="lg:leading-tighter text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[2.6rem] 2xl:text-[3rem]"></h1>
      <Card className="flex flex-col h-full max-w-4xl mx-auto my-12">
        <CardTitle className="text-3xl ml-2">
          <TextGenerateEffect words={title} />
        </CardTitle>

        <div className="mt-5 flex flex-col gap-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-md w-2/3 text-lg bg-${
                username === msg.user ? "blue-800" : "gray-600"
              } ${username === msg.user ? "self-end" : "self-start"}`}
            >
              <span className="font-bold">{msg.user}: </span>
              {msg.message}
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-2 mx-auto">
          <Input
            type="text"
            placeholder="Message"
            value={message}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setMessage(e.target.value)
            }
            onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                onSend();
              }
            }}
            className="flex-[0.7] text-lg"
          />
          <Button onClick={onSend}>Send</Button>
        </div>
      </Card>
    </>
  );
}
