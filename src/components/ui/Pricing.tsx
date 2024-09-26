"use client";

import { Button } from "@/components/ui/button";
import type { Tables } from "@/types_db";
import { getStripe } from "@/utils/stripe/client";
import { checkoutWithStripe } from "@/utils/stripe/server";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useTransition } from "react";

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
    useState<BillingInterval>("one_time");
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleStripeCheckout = async (
    price: Tables<"prices"> & { type: "one_time" | "recurring" },
    product: Product
  ) => {
    if (!user) {
      return router.push("/sign-in");
    }
    startTransition(async () => {
      try {
        const { sessionId } = await checkoutWithStripe(price, {
          productId: product.id,
          productName: product.name,
          billingInterval:
            price.type === "recurring"
              ? (price.interval as "year" | "month" | "one_time")
              : "one_time",
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

  if (!products.length) {
    return <p>No subscription pricing plans found. Please contact support.</p>;
  }

  const intervals = [
    { value: "one_time", label: "Products" },
    { value: "month", label: "Monthly" },
    { value: "year", label: "Annual" },
  ];

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  ? "relative w-1/3 border-zinc-800 shadow-sm text-muted-foreground ring-2 ring-pink-600 ring-opacity-50" // Added ring styles here
                  : "ml-0.5 relative w-1/3 border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900"
              } rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>
      {/* Add search input for Products tab */}
      <div className="flex justify-start">
        {billingInterval === "one_time" && (
          <div className="mt-6">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md mx-auto"
            />
          </div>
        )}
      </div>
      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 md:max-w-4xl md:grid-cols-3md:mx-auto lg:max-w-none lg:mx-auto lg:grid-cols-4">
        {(billingInterval === "one_time" ? filteredProducts : products).map(
          (product) => {
            const price = product.prices.find(
              (price) =>
                price.type ===
                  (billingInterval === "one_time" ? "one_time" : "recurring") &&
                (billingInterval === "one_time" ||
                  price.interval === billingInterval)
            );

            // If no matching price is found, don't render this product
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
                        },
                        product
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
          }
        )}
      </div>
    </div>
  );
}
