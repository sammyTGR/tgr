import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

const title = "Contact Us";
const sub = "Get in touch with our team for any inquiries or support.";

export default function Component() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container grid gap-12 px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
            <TextGenerateEffect words={title} />
          </h1>
          <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
            <TextGenerateEffect words={sub} />
          </p>
        </div>
        <div className="grid gap-8 flex flex-col md:grid-cols-2 lg:grid-cols-3 mt-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">General Questions</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage alt="Main Phone" src="/placeholder-avatar.jpg" />
                  <AvatarFallback>TGR</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">The Gun Range</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    3479 Orange Grove Ave
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    sales@thegunrange.biz
                  </a>
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    (916) 972-1484
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Class Scheduling</h3>
            <div className="space-y-2">
              <div className="flex text-left gap-3">
                <Avatar>
                  <AvatarImage alt="Rod Ibey" src="/placeholder-avatar.jpg" />
                  <AvatarFallback>RI</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Rod Ibey</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Scheduling
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    rod@thegunrange.biz
                  </a>
                </p>
                {/* <p>
                  <span className="font-medium">Phone:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    (234) 567-890
                  </a>
                </p> */}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold">FFL Transfers</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    alt="Michelle Kahn"
                    src="/placeholder-avatar.jpg"
                  />
                  <AvatarFallback>MK</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Michelle Kahn</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Inventory Manager
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    michelle@thegunrange.biz
                  </a>
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    (916) 972-1484 EXT 4
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Special Orders</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    alt="Sam Yohannes"
                    src="/placeholder-avatar.jpg"
                  />
                  <AvatarFallback>SY</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Sam Yohannes</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    General Manager | Purchaser
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    sam@thegunrange.biz
                  </a>
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    (916) 972-1484 EXT 5
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Store Manager</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage alt="Jim Vu" src="/placeholder-avatar.jpg" />
                  <AvatarFallback>JV</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Jim Vu</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Store Manager
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    jim@thegunrange.biz
                  </a>
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    (916) 972-1484 EXT 8
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Operations Manager</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage alt="Sammy Lee" src="/placeholder-avatar.jpg" />
                  <AvatarFallback>SL</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Sammy</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Operations Manager
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    sammy@thegunrange.biz
                  </a>
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    (916) 972-1484 EXT 9
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
