import { useEffect, useRef, lazy, Suspense } from "react";
import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from '@/components/layout';
import Home from '@/pages/home';
import NotFound from '@/pages/not-found';

const TOS = lazy(() => import('@/pages/tos'));
const Watchlist = lazy(() => import('@/pages/watchlist'));
const ItemDetail = lazy(() => import('@/pages/item-detail'));
const CollectionForm = lazy(() => import('@/pages/collection-form'));
const Analytics = lazy(() => import('@/pages/analytics'));
const AdminItemForm = lazy(() => import('@/pages/admin/items/form'));
const PendingItems = lazy(() => import('@/pages/admin/items/pending'));
const PendingSales = lazy(() => import('@/pages/admin/sales/pending'));
const AddSaleForm = lazy(() => import('@/pages/admin/sales/form'));

function LazyRoute({ component: Component }: { component: React.LazyExoticComponent<React.ComponentType> }) {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading...</div>}>
      <Component />
    </Suspense>
  );
}

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#b91c1c",
    colorForeground: "#e8ddd0",
    colorMutedForeground: "#8a7e72",
    colorDanger: "#dc2626",
    colorBackground: "#141110",
    colorInput: "#1c1917",
    colorInputForeground: "#e8ddd0",
    colorNeutral: "#292524",
    fontFamily: "'Inter', system-ui, sans-serif",
    borderRadius: "0.375rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#141110] rounded-lg w-[440px] max-w-full overflow-hidden border border-[#292524] shadow-sm",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#e8ddd0] font-bold",
    headerSubtitle: "text-[#8a7e72]",
    socialButtonsBlockButtonText: "text-[#c4b8a8] font-medium",
    formFieldLabel: "text-[#c4b8a8] text-sm font-medium",
    footerActionLink: "text-[#b91c1c] hover:text-[#dc2626] font-medium",
    footerActionText: "text-[#8a7e72]",
    dividerText: "text-[#6b6158] text-xs",
    identityPreviewEditButton: "text-[#b91c1c]",
    formFieldSuccessText: "text-emerald-400",
    alertText: "text-[#c4b8a8]",
    logoBox: "flex justify-center",
    logoImage: "h-10",
    socialButtonsBlockButton: "border border-[#292524] hover:bg-[#1c1917]",
    formButtonPrimary: "bg-[#b91c1c] hover:bg-[#991b1b] text-white font-medium",
    formFieldInput: "border-[#292524] bg-[#1c1917] text-[#e8ddd0] focus:border-[#b91c1c] focus:ring-[#b91c1c]",
    footerAction: "bg-[#0f0e0d] border-t border-[#292524]",
    dividerLine: "bg-[#292524]",
    alert: "border border-red-900/50 bg-red-950/30",
    otpCodeFieldInput: "border-[#292524] text-[#e8ddd0]",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);
  return null;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function AuthenticatedRoutes() {
  return (
    <Layout>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/items/:slug">{() => <LazyRoute component={ItemDetail} />}</Route>
          <Route path="/tos">{() => <LazyRoute component={TOS} />}</Route>
          <Route path="/watchlist">{() => <LazyRoute component={Watchlist} />}</Route>
          <Route path="/analytics">{() => <LazyRoute component={Analytics} />}</Route>
          <Route path="/collection/add">{() => <LazyRoute component={CollectionForm} />}</Route>
          <Route path="/collection/:slug/edit">{() => <LazyRoute component={CollectionForm} />}</Route>
          <Route path="/admin/items/new">{() => <LazyRoute component={AdminItemForm} />}</Route>
          <Route path="/admin/items/:slug/edit">{() => <LazyRoute component={AdminItemForm} />}</Route>
          <Route path="/admin/items/pending">{() => <LazyRoute component={PendingItems} />}</Route>
          <Route path="/admin/sales/pending">{() => <LazyRoute component={PendingSales} />}</Route>
          <Route path="/admin/items/:slug/sales/new">{() => <LazyRoute component={AddSaleForm} />}</Route>
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Layout>
  );
}

function UnauthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/tos">{() => <LazyRoute component={TOS} />}</Route>
      <Route><Redirect to="/sign-in" /></Route>
    </Switch>
  );
}

function AuthGate() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">TP</span>
          </div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return isSignedIn ? <AuthenticatedRoutes /> : <UnauthenticatedRoutes />;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to your collection" } },
        signUp: { start: { title: "Create your account", subtitle: "Start tracking your collection" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AuthGate />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
