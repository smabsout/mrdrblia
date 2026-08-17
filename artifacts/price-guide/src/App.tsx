import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { Layout } from '@/components/layout';
import Home from '@/pages/home';
import Login from '@/pages/login';
import Register from '@/pages/register';
import TOS from '@/pages/tos';
import Watchlist from '@/pages/watchlist';
import ItemDetail from '@/pages/item-detail';
import AdminItemForm from '@/pages/admin/items/form';
import PendingItems from '@/pages/admin/items/pending';
import PendingSales from '@/pages/admin/sales/pending';
import AddSaleForm from '@/pages/admin/sales/form';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/items/:slug" component={ItemDetail} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/tos" component={TOS} />
          <Route path="/watchlist" component={Watchlist} />
          
          <Route path="/admin/items/new" component={AdminItemForm} />
          <Route path="/admin/items/:slug/edit" component={AdminItemForm} />
          <Route path="/admin/items/pending" component={PendingItems} />
          
          <Route path="/admin/sales/pending" component={PendingSales} />
          <Route path="/admin/items/:slug/sales/new" component={AddSaleForm} />
          
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Layout>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
