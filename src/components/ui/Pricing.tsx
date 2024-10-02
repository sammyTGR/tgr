"use client";

import { Button } from "@/components/ui/button";
import type { Tables } from "@/types_db";
import { getStripe } from "@/utils/stripe/client";
import { checkoutWithStripe } from "@/utils/stripe/server";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useTransition } from "react";
import { Price } from "@/types_db";
import { supabase } from "@/utils/supabase/client";

type Product = Tables<"products"> & {
  prices: Tables<"prices">[];
  metadata?: { product_type?: "training" | "physical" };
};
type Customer = Tables<"customers">;
type ClassSchedule = {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  price: number | null;
  stripe_product_id?: string;
  stripe_price_id?: string;
};

interface Props {
  user: User | null | undefined;
  products: Product[];
  subscription: Customer | null;
}

type BillingInterval = "one_time" | "training" | "monthly" | "yearly"; // Add other valid intervals
type PriceType = "one_time" | "training" | "recurring"; // Add other valid price types

export default function Pricing({ user, products, subscription }: Props) {
  const router = useRouter();
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("one_time");
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);

  useEffect(() => {
    const fetchClassSchedules = async () => {
      const { data, error } = await supabase
        .from("class_schedules")
        .select("*")
        .order("start_time");

      if (error) {
        console.error("Error fetching class schedules:", error);
      } else if (data) {
        setClassSchedules(data);
      }
    };

    fetchClassSchedules();
  }, []);

  const handleStripeCheckout = async (price: Price, product: Product) => {
    if (!user) {
      return router.push("/sign-in");
    }
    startTransition(async () => {
      try {
        const billingInterval: "one_time" | "month" | "year" =
          price.type === "recurring"
            ? price.interval === "year" || price.interval === "month"
              ? price.interval
              : "month" // Default to "month" if interval is not "year" or "month"
            : "one_time";

        const { sessionId } = await checkoutWithStripe(price, {
          productId: product.id,
          productName: product.name,
          billingInterval,
        });

        if (sessionId) {
          const stripe = await getStripe();
          stripe?.redirectToCheckout({ sessionId });
        }
      } catch (error) {
        alert((error as Error)?.message);
      }
    });
  };

  const handleClassEnrollment = async (classSchedule: ClassSchedule) => {
    if (!user) {
      return router.push("/sign-in");
    }
    startTransition(async () => {
      try {
        // Fetch customer data
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("first_name, last_name")
          .eq("user_uuid", user.id)
          .single();

        if (customerError) throw customerError;

        // Create a Stripe Checkout session
        const { sessionId } = await checkoutWithStripe(
          {
            id: classSchedule.stripe_price_id!,
            product_id: classSchedule.stripe_product_id!,
            active: true,
            description: classSchedule.description,
            unit_amount: classSchedule.price ? classSchedule.price * 100 : 0,
            currency: "usd",
            type: "one_time",
            interval: null,
            interval_count: null,
            trial_period_days: null,
            metadata: { product_type: "training" },
          },
          {
            productId: classSchedule.stripe_product_id!,
            productName: classSchedule.title,
            billingInterval: "one_time",
          }
        );

        if (sessionId) {
          // Insert the enrollment into the class_enrollments table
          const { data, error } = await supabase
            .from("class_enrollments")
            .insert({
              user_id: user.id,
              class_id: classSchedule.id,
              payment_status: "paid",
              user_name:
                `${customerData.first_name || ""} ${
                  customerData.last_name || ""
                }`.trim() || user.email,
              stripe_session_id: sessionId,
            })
            .select();

          if (error) throw error;

          const stripe = await getStripe();
          stripe?.redirectToCheckout({ sessionId });
        }
      } catch (error) {
        console.error("Error during class enrollment:", error);
        alert((error as Error)?.message);
      }
    });
  };

  // Separate products into physical products, training classes, and subscriptions
  const physicalProducts = products.filter(
    (product) =>
      product.prices.some((price) => price.type === "one_time") &&
      (!product.metadata?.product_type ||
        product.metadata.product_type === "physical")
  );

  const trainingProducts = products.filter(
    (product) =>
      product.prices.some((price) => price.type === "one_time") &&
      product.metadata?.product_type === "training"
  );

  const subscriptionProducts = products.filter((product) =>
    product.prices.some((price) => price.type === "recurring")
  );

  const filteredPhysicalProducts = physicalProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTrainingProducts = trainingProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubscriptionProducts = subscriptionProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = classSchedules.filter((classSchedule) =>
    classSchedule.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!products.length && !classSchedules.length) {
    return (
      <p>
        No subscription pricing plans or classes found. Please contact support.
      </p>
    );
  }

  const intervals = [
    { value: "one_time", label: "Products" },
    { value: "training", label: "Training" },
    { value: "month", label: "Monthly" },
    { value: "year", label: "Annual" },
  ];

  return (
    <div className="max-w-6xl px-4 py-4 mx-auto sm:py-24 sm:px-6 lg:px-8">
      <div className="sm:flex sm:flex-col sm:align-center">
        <div className="w-full mx-auto items-center justify-center max-w-3xl">
          <Image
            src="/MembershipBanner.png"
            alt="Banner"
            layout="responsive"
            width={1211}
            height={386}
            quality={100}
            objectFit="contain"
          />

          <p className="max-w-2xl m-auto text-xl sm:text-center sm:text-2xl">
            Let&apos;s get you set up with a subscription and | or firearm
            that&apos;s a ... blast... and works best for your goals!
          </p>
        </div>
        <div className="relative self-center mt-6 rounded-lg p-0.5 flex sm:mt-8 border border-zinc-800">
          {intervals.map((interval) => (
            <button
              key={interval.value}
              onClick={() =>
                setBillingInterval(interval.value as BillingInterval)
              }
              type="button"
              className={`${
                billingInterval === interval.value
                  ? "relative w-1/3 border-zinc-800 shadow-sm text-muted-foreground ring-2 ring-pink-600 ring-opacity-50" // Added ring styles here
                  : "ml-0.5 relative w-1/3 border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900"
              } rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>
      {/* Add search input for Products and Training tabs */}
      <div className="flex justify-start">
        {(billingInterval === "one_time" || billingInterval === "training") && (
          <div className="mt-6">
            <Input
              type="text"
              placeholder={
                billingInterval === "one_time"
                  ? "Search products..."
                  : "Search classes..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md mx-auto"
            />
          </div>
        )}
      </div>
      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 md:max-w-4xl md:grid-cols-3 md:mx-auto lg:max-w-none lg:mx-auto lg:grid-cols-4">
        {billingInterval === "training" ? (
          <>
            {filteredTrainingProducts.map((product) => {
              const price = product.prices.find((price) => {
                if (billingInterval === "training") {
                  return price.type === "training";
                } else if (
                  billingInterval === "monthly" ||
                  billingInterval === "yearly"
                ) {
                  return (
                    price.type === "recurring" &&
                    price.interval === billingInterval
                  );
                } else {
                  return price.type === "one_time";
                }
              });

              if (!price) return null;

              const priceString = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: price.currency,
                minimumFractionDigits: 0,
              }).format((price.unit_amount || 0) / 100);

              return (
                <div
                  key={product.id}
                  className="rounded-lg shadow-md divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 flex flex-col"
                >
                  <div className="p-6 flex flex-col flex-grow">
                    {product.image && (
                      <div className="flex-grow w-full h-48 mb-2">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain rounded-md"
                        />
                      </div>
                    )}
                    <h2 className="flex-grow text-2xl font-semibold leading-6">
                      {product.name}
                    </h2>
                    <p className="mt-4 flex-grow">{product.description}</p>
                    <p className="flex-shrink mt-8">
                      <span className="flex-shrink text-3xl font-extrabold">
                        {priceString}
                      </span>
                      {price.type === "recurring" && (
                        <span className="text-base font-medium">
                          /{price.interval}
                        </span>
                      )}
                    </p>
                    <Button
                      variant="outline"
                      disabled={!user || priceIdLoading === price.id}
                      onClick={() => handleStripeCheckout(price, product)}
                      className="w-full py-2 mt-8 text-sm font-semibold text-center rounded-md hover:bg-muted"
                    >
                      {subscription
                        ? "Manage"
                        : price.type === "one_time"
                        ? "Add to Cart"
                        : "Subscribe"}
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredClasses.map((classSchedule) => (
              <div
                key={classSchedule.id}
                className="rounded-lg shadow-md divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 flex flex-col"
              >
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="flex-grow text-2xl font-semibold leading-6">
                    {classSchedule.title}
                  </h2>
                  <p className="mt-4 flex-grow">{classSchedule.description}</p>
                  <p className="mt-2">
                    Start: {new Date(classSchedule.start_time).toLocaleString()}
                  </p>
                  <p className="mt-2">
                    End: {new Date(classSchedule.end_time).toLocaleString()}
                  </p>
                  <p className="flex-shrink mt-8">
                    <span className="flex-shrink text-3xl font-extrabold">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "usd",
                        minimumFractionDigits: 0,
                      }).format(classSchedule.price || 0)}
                    </span>
                  </p>
                  <Button
                    variant="outline"
                    disabled={!user}
                    onClick={() => handleClassEnrollment(classSchedule)}
                    className="w-full py-2 mt-8 text-sm font-semibold text-center rounded-md hover:bg-muted"
                  >
                    Register for Class
                  </Button>
                </div>
              </div>
            ))}
          </>
        ) : billingInterval === "one_time" ? (
          filteredPhysicalProducts.map((product) => {
            const price = product.prices.find((price) => {
              if (
                billingInterval === "one_time" ||
                billingInterval === "training"
              ) {
                return price.type === "one_time";
              } else {
                return (
                  price.type === "recurring" &&
                  price.interval === billingInterval
                );
              }
            });

            if (!price) return null;

            const priceString = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: price.currency,
              minimumFractionDigits: 0,
            }).format((price.unit_amount || 0) / 100);

            return (
              <div
                key={product.id}
                className="rounded-lg shadow-md divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 flex flex-col"
              >
                <div className="p-6 flex flex-col flex-grow">
                  {product.image && (
                    <div className="flex-grow w-full h-48 mb-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain rounded-md"
                      />
                    </div>
                  )}
                  <h2 className="flex-grow text-2xl font-semibold leading-6">
                    {product.name}
                  </h2>
                  <p className="mt-4 flex-grow">{product.description}</p>
                  <p className="flex-shrink mt-8">
                    <span className="flex-shrink text-3xl font-extrabold">
                      {priceString}
                    </span>
                    {price.type === "recurring" && (
                      <span className="text-base font-medium">
                        /{price.interval}
                      </span>
                    )}
                  </p>
                  <Button
                    variant="outline"
                    disabled={!user || priceIdLoading === price.id}
                    onClick={() => handleStripeCheckout(price, product)}
                    className="w-full py-2 mt-8 text-sm font-semibold text-center rounded-md hover:bg-muted"
                  >
                    {subscription
                      ? "Manage"
                      : price.type === "one_time"
                      ? "Add to Cart"
                      : "Subscribe"}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          filteredSubscriptionProducts.map((product) => {
            const price = product.prices.find((price) =>
              price.type === "recurring" && price.interval === billingInterval
            );

            if (!price) return null;

            const priceString = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: price.currency,
              minimumFractionDigits: 0,
            }).format((price.unit_amount || 0) / 100);

            return (
              <div
                key={product.id}
                className="rounded-lg shadow-md divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 flex flex-col"
              >
                <div className="p-6 flex flex-col flex-grow">
                  {product.image && (
                    <div className="flex-grow w-full h-48 mb-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain rounded-md"
                      />
                    </div>
                  )}
                  <h2 className="flex-grow text-2xl font-semibold leading-6">
                    {product.name}
                  </h2>
                  <p className="mt-4 flex-grow">{product.description}</p>
                  <p className="flex-shrink mt-8">
                    <span className="flex-shrink text-3xl font-extrabold">
                      {priceString}
                    </span>
                    <span className="text-base font-medium">
                      /{price.interval}
                    </span>
                  </p>
                  <Button
                    variant="outline"
                    disabled={!user || priceIdLoading === price.id}
                    onClick={() => handleStripeCheckout(price, product)}
                    className="w-full py-2 mt-8 text-sm font-semibold text-center rounded-md hover:bg-muted"
                  >
                    {subscription ? "Manage" : "Subscribe"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}