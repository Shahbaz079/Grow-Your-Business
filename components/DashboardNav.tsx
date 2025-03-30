import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Megaphone, LogOut } from "lucide-react";

export default function DashboardNav() {
  return (
    <nav className="h-screen w-64 bg-gray-900 text-gray-100 border-r border-gray-800 p-4 flex flex-col sm:w-56 md:w-64 transition-width duration-300 fixed z-10">
      {/* Navigation Links */}
      <div className="flex-1 space-y-4">
        <Link href="/" className="block">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-100 hover:bg-gray-800 hover:text-white"
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </Button>
        </Link>

        <Link href="/customers" className="block">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-100 hover:bg-gray-800 hover:text-white"
          >
            <Users className="mr-3 h-5 w-5" />
            Customers
          </Button>
        </Link>

        <Link href="/campaigns" className="block">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-100 hover:bg-gray-800 hover:text-white"
          >
            <Megaphone className="mr-3 h-5 w-5" />
            Campaigns
          </Button>
        </Link>
      </div>

      
      
    </nav>
  );
}
