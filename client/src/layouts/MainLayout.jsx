import { useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import Footer from '../components/Footer/Footer';

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="page-wrapper">
      <Navbar onMenuToggle={() => setMobileOpen(o => !o)} />
      <div className="main-layout">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <main
          className={`page-content ${collapsed ? 'sidebar-collapsed' : ''}`}
          id="main-content"
        >
          {children}
        </main>
      </div>
      <Footer inApp />
    </div>
  );
};

export default MainLayout;
