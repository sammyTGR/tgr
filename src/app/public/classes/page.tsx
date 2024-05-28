"use client";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { JSX, SVGProps } from "react";

export default function Component() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Available Classes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className=" rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">May 2023</h2>
            <div className="flex items-center space-x-4">
              <button className=" hover: focus:outline-none" title="Next Month">
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-4">
            <div className=" font-medium text-center">Sun</div>
            <div className=" font-medium text-center">Mon</div>
            <div className=" font-medium text-center">Tue</div>
            <div className=" font-medium text-center">Wed</div>
            <div className=" font-medium text-center">Thu</div>
            <div className=" font-medium text-center">Fri</div>
            <div className=" font-medium text-center">Sat</div>
            <div className="text-center ">1</div>
            <div className="text-center ">2</div>
            <div className="text-center ">3</div>
            <div className="text-center ">4</div>
            <div className="text-center ">5</div>
            <div className="text-center ">6</div>
            <div className="text-center ">7</div>
            <div className="text-center ">8</div>
            <div className="text-center ">9</div>
            <div className="text-center ">10</div>
            <div className="text-center ">11</div>
            <div className="text-center bg-primary-500  rounded-full w-8 h-8 leading-8 cursor-pointer relative">
              <span className="font-bold">12</span>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500" />
            </div>
            <div className="text-center ">13</div>
            <div className="text-center ">14</div>
            <div className="text-center ">15</div>
            <div className="text-center ">16</div>
            <div className="text-center ">17</div>
            <div className="text-center ">18</div>
            <div className="text-center ">19</div>
            <div className="text-center bg-primary-500  rounded-full w-8 h-8 leading-8 cursor-pointer relative">
              <span className="font-bold">20</span>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500" />
            </div>
            <div className="text-center ">21</div>
            <div className="text-center ">22</div>
            <div className="text-center ">23</div>
            <div className="text-center ">24</div>
            <div className="text-center ">25</div>
            <div className="text-center ">26</div>
            <div className="text-center bg-primary-500  rounded-full w-8 h-8 leading-8 cursor-pointer relative">
              <span className="font-bold">27</span>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500" />
            </div>
            <div className="text-center ">28</div>
            <div className="text-center ">29</div>
            <div className="text-center ">30</div>
            <div className="text-center ">31</div>
          </div>
        </div>
        <div className=" rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Available Classes</h2>
            <div className="relative">
              <Input
                className="pr-10"
                placeholder="Search by class name"
                type="search"
              />
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 " />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className=" rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">
                  16 Hour Placer County Renewal
                </h3>
                <p className="">May 12, 2023 - 6:00 PM</p>
              </div>
              <Link
                className="bg-primary-500  rounded-lg px-4 py-2 hover:bg-primary-600 focus:outline-none"
                href="#"
              >
                Pay Now
              </Link>
            </div>
            <div className=" rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">
                  16 Hour Sacramento CCW Initial
                </h3>
                <p className="">May 19, 2023 - 7:00 PM</p>
              </div>
              <Link
                className="bg-primary-500  rounded-lg px-4 py-2 hover:bg-primary-600 focus:outline-none"
                href="#"
              >
                Pay Now
              </Link>
            </div>
            <div className=" rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">
                  8 Hour Sacramento Renewal
                </h3>
                <p className="">May 26, 2023 - 5:30 PM</p>
              </div>
              <Link
                className="bg-primary-500  rounded-lg px-4 py-2 hover:bg-primary-600 focus:outline-none"
                href="#"
              >
                Pay Now
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <div className=" rounded-lg shadow-md p-6 hidden">
          <h2 className="text-2xl font-bold mb-4">Class Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-2">
                16 Hour Placer County Renewal
              </h3>
              <p className=" mb-4">May 12, 2023 - 6:00 PM</p>
              <p className=" mb-4">Text for class description.</p>
              <p className=" mb-4">
                The class is suitable for all levels, and our experienced
                instructors will guide you through with clear instructions and
                modifications to ensure your safety and comfort.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Class Details</h3>
              <ul className="list-disc pl-4 mb-4">
                <li>Duration: 16 Hour</li>
                <li>Level: Advanced</li>
                <li>Class Size: Maximum 10 students</li>
                <li>
                  What to Bring: Current CCW, all firearms you want listed, 150
                  rounds of ammo
                </li>
              </ul>
              <h3 className="text-lg font-medium mb-2">Price</h3>
              <p className=" mb-4">$225 per seat</p>
              <Link
                className="bg-primary-500  rounded-lg px-4 py-2 hover:bg-primary-600 focus:outline-none"
                href="#"
              >
                Buy A Seat
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRightIcon(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function SearchIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
