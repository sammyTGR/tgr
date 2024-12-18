"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import DOMPurify from "isomorphic-dompurify";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Image from "next/image";

// Create a sanitize function that uses DOMPurify
const sanitizeInput = (value: string) => {
  return DOMPurify.sanitize(value.trim());
};

const formSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .transform(sanitizeInput),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .transform(sanitizeInput),
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform(sanitizeInput),
});

type FormValues = z.infer<typeof formSchema>;

function SubscribeForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Sanitize all values before sending to API
      const sanitizedValues = {
        first_name: sanitizeInput(values.first_name),
        last_name: sanitizeInput(values.last_name),
        email: sanitizeInput(values.email),
      };

      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedValues),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Successfully Signed Up For Insider Deals!", {
        duration: 4000,
        position: "top-right",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to subscribe", {
        duration: 4000,
        position: "top-center",
      });
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate(values);
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          <div className="flex w-full">
            <div className="flex flex-col justify-center items-center w-full space-y-2">
              <div className="flex justify-center items-center w-full">
                <Image
                  src="https://utfs.io/f/9jzftpblGSv7Dy9MFXIa5pnydWiRaOIt8ZMoUDHXSEx79kJm"
                  alt="Subscribe"
                  width={700}
                  height={150}
                  priority
                />
              </div>
              {/* <h1 className="text-2xl font-bold">TGR Insider Deals</h1> */}
              <p className="text-sm mb-4">
                Sign Up For Insider Deals For TGR Members Only
              </p>
              <div className="flex flex-row space-x-2 w-[400px]">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="First Name"
                          required
                          // Add onBlur handler to sanitize on blur
                          onBlur={(e) => {
                            field.onChange(sanitizeInput(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Last Name"
                          required
                          onBlur={(e) => {
                            field.onChange(sanitizeInput(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-[400px]">
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        required
                        onBlur={(e) => {
                          field.onChange(sanitizeInput(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="mt-4 w-[400px]"
              >
                {mutation.isPending ? "Submitting" : "Sign Up"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default SubscribeForm;
