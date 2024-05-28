
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar"

export default function Component() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container grid gap-12 px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Contact Us</h1>
          <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
            Get in touch with our team for any inquiries or support.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Sales</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage alt="Rod Ibey" src="/placeholder-avatar.jpg" />
                  <AvatarFallback>RI</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Rod Ibey</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Scheduling</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    Rod@TheGunRange.Biz
                  </a>
                </p>
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    (234) 567-890
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold">FFL Transfers</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage alt="Michelle Kahn" src="/placeholder-avatar.jpg" />
                  <AvatarFallback>MK</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Michelle Kahn</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Inventory Manager</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    Michelle@TheGunRange.Biz
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
                  <AvatarImage alt="Sam Yohannes" src="/placeholder-avatar.jpg" />
                  <AvatarFallback>SY</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Sam Yohannes</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">General Manager | Purchaser</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  <a className="text-blue-500 hover:underline" href="#">
                    Sam@TheGunRange.Biz
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
        </div>
      </div>
    </section>
  )
}