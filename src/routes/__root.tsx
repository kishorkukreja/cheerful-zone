import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { useAppStore, setCompact } from "@/store/app-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The screen you're looking for isn't part of the IDIE prototype.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Back to Dispatch Cockpit
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This screen didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong rendering the cockpit.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dispatch Cockpit · IDIE" },
      {
        name: "description",
        content:
          "Planner cockpit for Factory-to-DC replenishment: prioritized dispatch, manual indent workbench, stock analyser and lane analytics.",
      },
      { property: "og:title", content: "Dispatch Cockpit · IDIE" },
      {
        property: "og:description",
        content: "Standardized, service-driven dispatch prioritization for supply planners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Dispatch Cockpit · IDIE" },
      { name: "description", content: "Prioritized morning worklist of Factory-to-DC lanes with shortages, dispatch recommendations and indent triggers." },
      { property: "og:description", content: "Prioritized morning worklist of Factory-to-DC lanes with shortages, dispatch recommendations and indent triggers." },
      { name: "twitter:description", content: "Prioritized morning worklist of Factory-to-DC lanes with shortages, dispatch recommendations and indent triggers." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/1b429804-3131-45ed-94f7-f055a587a592" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/1b429804-3131-45ed-94f7-f055a587a592" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { compact } = useAppStore();
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center gap-3 border-b border-outline-variant bg-card px-3 md:px-5 sticky top-0 z-30">
              <SidebarTrigger />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Hindustan Unilever · Supply Chain Planning
                </div>
                <div className="text-sm font-semibold truncate">
                  Intelligent Dispatch &amp; Indent Engine
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-success" />
                Engine run: Today 06:00 IST
              </div>
              <label className="hidden lg:flex items-center gap-2 pl-3 border-l border-outline-variant text-xs text-muted-foreground cursor-pointer">
                <Switch checked={compact} onCheckedChange={setCompact} />
                Compact
              </label>
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-outline-variant">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">
                  PS
                </div>
                <div className="text-xs leading-tight">
                  <div className="font-semibold">Priya S.</div>
                  <div className="text-muted-foreground">Supply Planner</div>
                </div>
              </div>
            </header>
            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </SidebarProvider>
    </QueryClientProvider>
  );
}
