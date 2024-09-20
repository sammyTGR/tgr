"use client";

import { Button } from "@/components/ui/button";
import type { Tables } from "@/types_db";
import { getStripe } from "@/utils/stripe/client";
import { checkoutWithStripe } from "@/utils/stripe/server";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

type Product = Tables<"products"> & { prices: Tables<"prices">[] };
type Customer = Tables<"customers">;

interface Props {
  user: User | null | undefined;
  products: Product[];
  subscription: Customer | null;
}

type BillingInterval = "one_time" | "year" | "month";

export default function Pricing({ user, products, subscription }: Props) {
  const router = useRouter();
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("month");
  const [priceIdLoading, setPriceIdLoading] = useState<string>();

  const handleStripeCheckout = async (
    price: Tables<"prices"> & { type: "one_time" | "recurring" }
  ) => {
    setPriceIdLoading(price.id);
    if (!user) {
      return router.push("/sign-in");
    }
    try {
      const { sessionId, error } = await checkoutWithStripe(price, "/");
      if (error) {
        throw new Error(error.message);
      }
      if (sessionId) {
        const stripe = await getStripe();
        stripe?.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      return alert((error as Error)?.message);
    } finally {
      setPriceIdLoading(undefined);
    }
  };

  if (!products.length) {
    return <p>No subscription pricing plans found. Please contact support.</p>;
  }

  const intervals = [
    { value: "month", label: "Monthly" },
    { value: "year", label: "Annual" },
    { value: "one_time", label: "Products" },
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
            Let&apos;s get you set up with a subscription that&apos;s a ...
            blast... and works best for your goals!
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
                  ? "relative w-1/3  border-zinc-800 shadow-sm "
                  : "ml-0.5 relative w-1/3 border border-transparent "
              } rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
        {products.map((product) => {
          const price = product.prices.find(
            (price) =>
              price.type ===
                (billingInterval === "one_time" ? "one_time" : "recurring") &&
              (billingInterval === "one_time" ||
                price.interval === billingInterval)
          );
          if (!price) return null;
          const priceString = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: price.currency,
            minimumFractionDigits: 0,
          }).format((price?.unit_amount || 0) / 100);
          return (
            <div
              key={product.id}
              className="rounded-lg shadow-md divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 flex flex-col"
            >
              <div className="p-6 flex flex-col flex-grow">
                {product.image && (
                  <div className="flex-shrink-0 w-full h-48 mb-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain rounded-md"
                    />
                  </div>
                )}
                <h2 className="text-2xl font-semibold leading-6">
                  {product.name}
                </h2>
                <p className="mt-4 flex-grow">{product.description}</p>
                <p className="mt-8">
                  <span className="text-5xl font-extrabold">{priceString}</span>
                  {billingInterval !== "one_time" && (
                    <span className="text-base font-medium">
                      /{billingInterval}
                    </span>
                  )}
                </p>
                <Button
                  variant="outline"
                  disabled={!user || priceIdLoading === price.id}
                  onClick={() =>
                    handleStripeCheckout(
                      price as Tables<"prices"> & {
                        type: "one_time" | "recurring";
                      }
                    )
                  }
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
      </div>
    </div>
  );
}
