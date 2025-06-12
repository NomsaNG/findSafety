"use client";

import Link from "next/link";
import { Shield, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { ApiStatusIndicator } from "./api-status-indicator";
import { authAPI } from "@/lib/auth-service";

interface MainNavProps {
  className?: string;
}

export function MainNav({ className }: MainNavProps) {
  const handleSignOut = () => {
    authAPI.logout();
  };

  return (
    <div className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      <Link href="/dashboard" className="flex items-center space-x-2">
        <Shield className="h-6 w-6" />
        <span className="font-bold text-xl hidden md:inline-block">FindSafety</span>
      </Link>
      <nav className="flex items-center space-x-4">
        <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
          Dashboard
        </Link>
        <Link href="/dashboard/explore" className="text-sm font-medium transition-colors hover:text-primary">
          Explore
        </Link>
        <Link href="/dashboard/community" className="text-sm font-medium transition-colors hover:text-primary">
          Community
        </Link>
        <Link href="/dashboard/chat" className="text-sm font-medium transition-colors hover:text-primary">
          Chat
        </Link>
        <Link href="/dashboard/alerts" className="text-sm font-medium transition-colors hover:text-primary">
          Alerts
        </Link>
      </nav>
      <div className="ml-auto flex items-center space-x-4">
        <ApiStatusIndicator />
        <ModeToggle />
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}