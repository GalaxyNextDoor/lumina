import { User, Shield, Bell, Key, Database, Globe, Smartphone, Palette } from "lucide-react"

export function SettingsPage() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-slate-400">Manage your account settings and application preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        {/* Settings Navigation */}
        <nav className="flex flex-col gap-2">
          <a href="#" className="flex items-center gap-3 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-cyan-400">
            <User className="h-4 w-4" />
            Account
          </a>
          <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-slate-50">
            <Shield className="h-4 w-4" />
            Security
          </a>
          <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-slate-50">
            <Bell className="h-4 w-4" />
            Notifications
          </a>
          <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-slate-50">
            <Palette className="h-4 w-4" />
            Appearance
          </a>
          <div className="my-2 h-px bg-slate-800" />
          <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-slate-50">
            <Key className="h-4 w-4" />
            API Keys
          </a>
          <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-slate-50">
            <Database className="h-4 w-4" />
            Data Retention
          </a>
        </nav>

        {/* Settings Content */}
        <div className="flex flex-col gap-8">
          {/* Profile Section */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Profile Information</h2>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-300">Name</label>
                  <input
                    id="name"
                    type="text"
                    defaultValue="Admin User"
                    className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    defaultValue="admin@luminalog.io"
                    className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="col-span-full flex flex-col gap-2">
                  <label htmlFor="bio" className="text-sm font-medium text-slate-300">Department</label>
                  <input
                    id="bio"
                    type="text"
                    defaultValue="Platform Engineering"
                    className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end border-t border-slate-800 pt-6">
                <button className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-slate-50 transition-colors hover:bg-cyan-500">
                  Save Changes
                </button>
              </div>
            </div>
          </section>

          {/* Integration Section */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Log Sources</h2>
            <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-800 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Web Application</h3>
                    <p className="text-xs text-slate-400">Main frontend services (active)</p>
                  </div>
                </div>
                <button className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white">
                  Configure
                </button>
              </div>
              
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Mobile API</h3>
                    <p className="text-xs text-slate-400">iOS and Android backend endpoints</p>
                  </div>
                </div>
                <button className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white">
                  Configure
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
