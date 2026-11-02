import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Link from 'next/link'
import { LogOut, LayoutDashboard, Plus, BookOpen, Settings } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Series', href: '/dashboard', icon: BookOpen },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 hidden lg:block">
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">Manga TL</h1>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-primary-600 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
          <Link
            href="/dashboard/series/new"
            className="flex items-center gap-3 px-3 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Series Baru
          </Link>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
              <LogOut className="w-5 h-5" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
