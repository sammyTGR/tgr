"use client";
import { useEffect, useState, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

const title = "TGR Ops Chat";

export default function ChatClient() {
  const [message, setMessage] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [messages, setMessages] = useState<
    {
      user: string;
      message: string;
    }[]
  >([]);

  const channel = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!channel.current) {
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
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
  }, []);

  function onSend() {
    if (!channel.current || message.trim().length === 0) return;
    channel.current.send({
      type: "broadcast",
      event: "message",
      payload: { message: { message, user } },
    });
    setMessage("");
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
                user === msg.user ? "blue-800" : "gray-600"
              } ${user === msg.user ? "self-end" : "self-start"}`}
            >
              <span className="font-bold">{msg.user}: </span>
              {/* Add this line */}
              {msg.message}
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-2 mx-auto">
          <Input
            type="text"
            placeholder="Username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="flex-[0.2] text-lg"
          />
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
