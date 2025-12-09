
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Home, Plus, Users, Gift, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const avatarEmojis = {
  bear: "🐻",
  cat: "🐱",
  dog: "🐶",
  rabbit: "🐰",
  fox: "🦊",
  lion: "🦁",
  panda: "🐼",
  unicorn: "🦄"
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const childSession = sessionStorage.getItem('child_session');
      if (childSession) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const user = await base44.auth.me();
        setCurrentUser(user);
      }
      
      setIsLoading(false);

      if (!authenticated && !['Welcome', 'ChildLogin', 'ChildView', 'ChildDeviceSetup'].includes(currentPageName)) {
        navigate(createPageUrl("Welcome"));
      }
    };

    checkAuth();
  }, [currentPageName, navigate]);

  const navigationItems = [
    {
      title: "Forældreoversigt",
      url: createPageUrl("ParentDashboard"),
      icon: Calendar,
    },
    {
      title: "Administrer Børn",
      url: createPageUrl("ManageChildren"),
      icon: Users,
    },
    {
      title: "Opret Aktivitet",
      url: createPageUrl("CreateActivity"),
      icon: Plus,
    },
    {
      title: "Administrer Præmier",
      url: createPageUrl("ManageRewards"),
      icon: Gift,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Indlæser...</p>
        </div>
      </div>
    );
  }

  if (['Welcome', 'ChildLogin', 'ChildView', 'ChildDeviceSetup'].includes(currentPageName)) {
    return children;
  }

  if (!isAuthenticated) {
    return children;
  }

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary-blue: #E3F2FD;
          --primary-orange: #FFE0B2;
          --primary-purple: #F3E5F5;
          --primary-green: #E8F5E9;
          --primary-yellow: #FFF9C4;
          --primary-pink: #FCE4EC;
          --accent: #64B5F6;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Sidebar className="border-r-2 border-white/50 backdrop-blur-sm">
          <SidebarHeader className="border-b-2 border-white/50 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-800">Min Dagsplan</h2>
                <p className="text-xs text-gray-500">For forældre</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-white/60 transition-all duration-300 rounded-2xl mb-2 h-14 ${
                          location.pathname === item.url ? 'bg-white shadow-md' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-4 px-4 py-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            location.pathname === item.url 
                              ? 'bg-gradient-to-br from-blue-400 to-purple-400' 
                              : 'bg-gray-100'
                          }`}>
                            <item.icon className={`w-5 h-5 ${
                              location.pathname === item.url ? 'text-white' : 'text-gray-600'
                            }`} />
                          </div>
                          <span className="font-semibold text-base">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/40 backdrop-blur-md border-b-2 border-white/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden hover:bg-white/60 p-2 rounded-xl transition-colors duration-200" />
                <h1 className="text-xl font-bold text-gray-800 hidden md:block">Min Dagsplan</h1>
              </div>
              
              {currentUser && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {currentUser.full_name?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block">
                      <p className="font-semibold text-sm text-gray-800">
                        {currentUser.full_name || currentUser.email}
                      </p>
                      <p className="text-xs text-gray-500">Forælder</p>
                    </div>
                  </div>
                  <button
                    onClick={() => base44.auth.logout(createPageUrl("Welcome"))}
                    className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-md hover:bg-white/80 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-gray-600" />
                    <span className="hidden sm:block text-sm font-medium text-gray-600">Log ud</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
