import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Privacy from "@/pages/Privacy";
import LegalNotice from "@/pages/LegalNotice";
import Tracking from "@/pages/Tracking";
import { CartProvider } from "@/lib/cart";
import Login from "@/pages/Login";
import MyOrders from "@/pages/MyOrders";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
  <Route path="/" component={Home} />
  <Route path="/admin" component={Admin} />
  <Route path="/privacidad" component={Privacy} />
  <Route path="/aviso-legal" component={LegalNotice} />
  <Route path="/seguimiento/:token" component={Tracking} />
  <Route path="/tracking/:token" component={Tracking} />
  <Route path="/login" component={Login} />
  <Route path="/mis-pedidos" component={MyOrders} />

  {/* SIEMPRE AL FINAL */}
  <Route component={NotFound} />
</Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </CartProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
