import Layout from "./Layout.jsx";

import ChildView from "./ChildView";

import ParentDashboard from "./ParentDashboard";

import CreateActivity from "./CreateActivity";

import ManageChildren from "./ManageChildren";

import ChildLogin from "./ChildLogin";

import Welcome from "./Welcome";

import ChildDeviceSetup from "./ChildDeviceSetup";

import DeviceSelection from "./DeviceSelection";

import ManageRewards from "./ManageRewards";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    ChildView: ChildView,
    
    ParentDashboard: ParentDashboard,
    
    CreateActivity: CreateActivity,
    
    ManageChildren: ManageChildren,
    
    ChildLogin: ChildLogin,
    
    Welcome: Welcome,
    
    ChildDeviceSetup: ChildDeviceSetup,
    
    DeviceSelection: DeviceSelection,
    
    ManageRewards: ManageRewards,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<ChildView />} />
                
                
                <Route path="/ChildView" element={<ChildView />} />
                
                <Route path="/ParentDashboard" element={<ParentDashboard />} />
                
                <Route path="/CreateActivity" element={<CreateActivity />} />
                
                <Route path="/ManageChildren" element={<ManageChildren />} />
                
                <Route path="/ChildLogin" element={<ChildLogin />} />
                
                <Route path="/Welcome" element={<Welcome />} />
                
                <Route path="/ChildDeviceSetup" element={<ChildDeviceSetup />} />
                
                <Route path="/DeviceSelection" element={<DeviceSelection />} />
                
                <Route path="/ManageRewards" element={<ManageRewards />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}