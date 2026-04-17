'use client'

import HeroSection from '@/components/layout/hero-section'
import HomeServices from '@/components/home/home-services'
import ContentViewer from '@/components/content/content-viewer'
import AdminPanel from '@/components/admin/admin-panel'
import AdminUsersPanel from '@/components/admin/admin-users'
import ProfilePanel from '@/components/auth/profile-panel'
import { useAppStore } from '@/stores/app-store'

export default function Home() {
  const view = useAppStore((s) => s.view)

  return (
    <div className="w-full min-h-[70vh]">
      {view === 'home' && (
        <div className="animate-in fade-in duration-500">
          <HeroSection />
          <HomeServices />
        </div>
      )}
      {view === 'content' && (
        <div className="animate-in fade-in duration-500">
          <ContentViewer />
        </div>
      )}
      {(view === 'admin' || view === 'admin-edit') && (
        <div className="animate-in fade-in duration-500">
          <AdminPanel />
        </div>
      )}
      {view === 'admin-users' && (
        <div className="animate-in fade-in duration-500">
          <AdminUsersPanel />
        </div>
      )}
      {(view === 'profile' || view === 'settings') && (
        <div className="animate-in fade-in duration-500">
          <ProfilePanel />
        </div>
      )}
    </div>
  )
}
