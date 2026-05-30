import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { 
  Layout, 
  Door, 
  ClockCounterClockwise, 
  UserCircle, 
  SignOut, 
  MagnifyingGlass,
  CalendarBlank,
  Scroll,
  SquaresFour
} from '@phosphor-icons/react';
import logoIPBSpace from '../../../assets/icons/logo.png';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuSearch, setMenuSearch] = React.useState('');

  const handleLogout = () => {
    if (logout) logout();
    navigate('/');
  };

  const menuItems = [
    {
      to: "/admin/facility/overview",
      label: "Dashboard Utama",
      icon: SquaresFour,
    },
    {
      to: "/admin/facility/validations",
      label: "Dashboard Validasi",
      icon: Layout,
    },
    {
      to: "/admin/facility/dashboard",
      label: "Manajemen Ruangan",
      icon: Door,
    },
    {
      to: "/admin/facility/calendar",
      label: "Kalender Jadwal",
      icon: CalendarBlank,
    },
    {
      to: "/admin/facility/history",
      label: "Riwayat Peminjaman",
      icon: ClockCounterClockwise,
    },
    {
      to: "/admin/facility/logs",
      label: "Log Audit Sistem",
      icon: Scroll,
    },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(menuSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar (Fixed Desktop) */}
      <aside className="w-64 fixed left-0 top-0 h-screen hidden md:flex flex-col bg-[#02275D] text-white shadow-xl z-50">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Link to="/" className="bg-white p-1 rounded-xl hover:scale-105 transition-transform shrink-0">
            <img src={logoIPBSpace} alt="IPB Space" className="h-8 drop-shadow-md" />
          </Link>
          <div className="flex flex-col overflow-hidden">
            <span className="text-lg font-black tracking-tight italic leading-none truncate">IPB Space</span>
            <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase mt-0.5 truncate">
              Panel Admin
            </span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {/* Search Container Pattern from Figma */}
          <div className="mb-8 relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200/50" />
            <input 
              type="text" 
              placeholder="Cari menu..." 
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-blue-200/50 focus:outline-none focus:ring-1 focus:ring-accent focus:bg-white/10 transition-all" 
            />
          </div>

          <p className="text-xs font-bold text-blue-200/50 uppercase tracking-wider mb-3 px-3">Menu Utama</p>

          {filteredMenuItems.map((item) => (
            <NavLink 
              key={item.to}
              to={item.to} 
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white border-l-4 md:border-l-0 md:border-r-4 border-[#00BCD4]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
            >
              {({ isActive }) => {
                const Icon = item.icon;
                return (
                  <>
                    <Icon size={20} weight={isActive ? "fill" : "regular"} /> 
                    {item.label}
                  </>
                );
              }}
            </NavLink>
          ))}

          {filteredMenuItems.length === 0 && (
            <p className="text-xs text-blue-200/40 italic px-3 py-2">Menu tidak ditemukan</p>
          )}
        </nav>
        
        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-white/10">
          <NavLink 
            to="/admin/facility/profile"
            className="flex items-center gap-3 px-3 py-3 mb-2 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
          >
            <UserCircle size={36} weight="fill" className="text-blue-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{user?.fullname || 'Memuat...'}</p>
              <p className="text-xs text-blue-300 truncate">{user?.work_unit || 'Facility Admin'}</p>
            </div>
          </NavLink>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all border border-transparent hover:border-red-500/20"
          >
            <SignOut size={20} weight="fill" /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">
        
        {/* Fixed Responsive Top Navbar */}
        <header className="fixed right-0 top-0 z-40 bg-white border-b border-slate-200 shadow-sm w-full md:w-[calc(100%-16rem)] flex items-center justify-between px-6 py-4 h-16">
          <div className="flex items-center gap-4">
            {/* Mobile Header Branding (Hidden on Desktop) */}
            <div className="md:hidden flex items-center gap-3">
              <img src={logoIPBSpace} alt="IPB Space" className="h-7" />
              <span className="text-base font-black tracking-tight italic text-[#02275D]">IPB Space</span>
            </div>
            
            {/* Desktop Page Context (Hidden on Mobile) */}
            <h2 className="hidden md:block font-bold text-slate-800 text-lg">Manajemen Fasilitas</h2>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Action buttons removed per user request for minimalist aesthetic */}
            {/* Mobile Logout Button */}
            <button 
              onClick={handleLogout}
              className="md:hidden p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
            >
              <SignOut size={20} weight="bold" />
            </button>
          </div>
        </header>
        
        {/* Content Render Outlet (padded top to avoid fixed header overlap) */}
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-24 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
