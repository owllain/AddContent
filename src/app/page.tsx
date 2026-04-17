'use client'

import FloatingNav from '@/components/layout/floating-nav'
import HeroSection from '@/components/layout/hero-section'
import Footer from '@/components/layout/footer'
import AuthModals from '@/components/auth/auth-modals'
import HomeServices from '@/components/home/home-services'
import ContentViewer from '@/components/content/content-viewer'
import AdminPanel from '@/components/admin/admin-panel'
import AdminUsersPanel from '@/components/admin/admin-users'
import ProfilePanel from '@/components/auth/profile-panel'
import { useAppStore } from '@/stores/app-store'

export default function Home() {
  const view = useAppStore((s) => s.view)

  return (
    <div className="flex min-h-screen flex-col">
      <FloatingNav />
      <main className="flex-1">
        {view === 'home' && (
          <>
            <HeroSection />
            <HomeServices />
          </>
        )}
        {view === 'content' && <ContentViewer />}
        {(view === 'admin' || view === 'admin-edit') && <AdminPanel />}
        {view === 'admin-users' && <AdminUsersPanel />}
        {(view === 'profile' || view === 'settings') && <ProfilePanel />}
      </main>
      <Footer />
      <AuthModals />
    </div>
  )
}
