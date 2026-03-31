import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import HomePage from "./routes/HomePage.jsx";
import BrandsPage from "./routes/BrandsPage.jsx";
import SignInPage from "./routes/SignInPage.jsx";
import RegisterPage from "./routes/RegisterPage.jsx";
import AdminSetupPage from "./routes/AdminSetupPage.jsx";
import AdminDashboardPage from "./routes/AdminDashboardPage.jsx";
import CategoriesPage from "./routes/CategoriesPage.jsx";
import ShopPage from "./routes/ShopPage.jsx";
import ProductPage from "./routes/ProductPage.jsx";
import CartPage from "./routes/CartPage.jsx";
import CheckoutPage from "./routes/CheckoutPage.jsx";
import CheckoutCompletePage from "./routes/CheckoutCompletePage.jsx";
import PrivacyPage from "./routes/PrivacyPage.jsx";
import TermsPage from "./routes/TermsPage.jsx";
import ProfilePage from "./routes/ProfilePage.jsx";
import ContactPage from "./routes/ContactPage.jsx";
import SupportPage from "./routes/SupportPage.jsx";
import NotFoundPage from "./routes/NotFoundPage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import SiteConfigProvider from "./context/SiteConfigProvider.jsx";
import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { CartProvider } from "./cart/CartProvider.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import OAuthAccessBridge from "./auth/OAuthAccessBridge.jsx";
import { GuestOnly, RequireAuth, RequireStaffDashboard } from "./auth/RouteGuards.jsx";
import AppToasts from "./AppToasts.jsx";
import { SmoothCursor } from "@/components/ui/smooth-cursor";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <CartProvider>
        <SiteConfigProvider>
          <SmoothCursor />
          <BrowserRouter>
            <AuthProvider>
              <OAuthAccessBridge />
              <Routes>
                <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="shop" element={<ShopPage />} />
                <Route path="shop/product/:slug" element={<ProductPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="brands" element={<BrandsPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="checkout/complete" element={<CheckoutCompletePage />} />
                <Route
                  path="sign-in"
                  element={
                    <GuestOnly>
                      <SignInPage />
                    </GuestOnly>
                  }
                />
                <Route
                  path="register"
                  element={
                    <GuestOnly>
                      <RegisterPage />
                    </GuestOnly>
                  }
                />
                <Route
                  path="admin/setup"
                  element={
                    <RequireAuth>
                      <AdminSetupPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <RequireStaffDashboard>
                      <AdminDashboardPage />
                    </RequireStaffDashboard>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <RequireAuth>
                      <ProfilePage />
                    </RequireAuth>
                  }
                />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="support" element={<SupportPage />} />
                  <Route path="privacy" element={<PrivacyPage />} />
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </AuthProvider>
          </BrowserRouter>
          <AppToasts />
        </SiteConfigProvider>
      </CartProvider>
    </ThemeProvider>
  </StrictMode>,
);
