import { Navigate, Route, Routes } from "react-router-dom"
import { ScrollToTop } from "@/components/ScrollToTop"
import { AppShell } from "@/components/layout/AppShell"
import { ProtectedRoute } from "@/auth/ProtectedRoute"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { CreateEventPage } from "@/pages/CreateEventPage"
import { EventGalleryPage } from "@/pages/EventGalleryPage"
import { QrInvitePage } from "@/pages/QrInvitePage"
import { AboutPage } from "@/pages/AboutPage"
import { PrivacyPage } from "@/pages/PrivacyPage"
import { TermsPage } from "@/pages/TermsPage"
import { CollectionsPage } from "@/pages/CollectionsPage"
import { SharedPage } from "@/pages/SharedPage"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { ArchivePage } from "@/pages/ArchivePage"
import { ProfilePage } from "@/pages/ProfilePage"

export const App = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/events" element={<CollectionsPage />} />
        <Route path="/events/new" element={<CreateEventPage />} />
        <Route path="/events/:eventId" element={<EventGalleryPage />} />
        <Route path="/events/:eventId/invite" element={<QrInvitePage />} />
        <Route path="/shared" element={<SharedPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
