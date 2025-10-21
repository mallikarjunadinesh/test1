import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { initialNotifications } from '../SubscriberDashboard'; // Ensure this path is correct
// import 'CommonStyles.css'; // Assuming this provides necessary styling
import logo from '/assets/logo.png'; // Assuming logo is available at this path

// Base URL for the Spring Boot backend
const API_BASE_URL = "http://localhost:8080/api/auth";

// --- Icon Components ---
const NotificationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-bell"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

// We need a context mechanism to store the logged-in user details
const UserContext = React.createContext();

// Function to safely parse user data from session storage (where we'll save it)
const getLoggedInUser = () => {
  const user = sessionStorage.getItem('loggedInUser');
  return user ? JSON.parse(user) : null;
};

// Replace alert with simple state for user feedback
const useMessage = () => {
  const [message, setMessage] = useState(null);
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000); // Clear after 3 seconds
  };
  return [message, showMessage];
};


function Layout() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [user, setUser] = useState(getLoggedInUser());
    const navigate = useNavigate();
    const notificationCount = initialNotifications.length;
    const [logoutMessage, showLogoutMessage] = useMessage();
    
    // useEffect to enforce authentication check
    useEffect(() => {
        if (!user || user.role.toLowerCase() !== 'subscriber') {
            navigate("/", { replace: true }); // Redirect to login if no subscriber user found
        }
    }, [user, navigate]);

    const toggleNotifications = () => {
        setShowNotifications(prev => !prev);
    };

    const handleLogout = () => {
        // Clear session storage data
        sessionStorage.removeItem('loggedInUser');
        setUser(null);
        showLogoutMessage('Logged out successfully.'); // Show message instead of alert
        navigate("/", { replace: true });
    };
    
    // If user is null (not yet redirected), don't render content to prevent errors
    if (!user) {
        return null;
    }

    return (
        <UserContext.Provider value={{ user }}>
            <div className="app-container">
                {/* --- NAV-BAR / HEADER --- */}
                <header className="main-header">
                    <div className="logo-section" onClick={() => navigate('/subscriber')}>
                        {/* Ensure logo path is correct */}
                        <img src={logo} alt="Standard Chartered logo" className="sc-logo" />
                    </div>
                    <div className="header-actions">
                        <div className="user-profile">
                            <h1 className="user-name">Welcome {user.username}</h1>
                            <p className="user-email">Role: {user.role}</p>
                        </div>
                        
                        {/* Notification Toggle */}
                        <div className="notification-toggle-container">
                            <button
                                className={`notification-toggle-button ${showNotifications ? 'active' : ''}`}
                                onClick={toggleNotifications}
                                title={showNotifications ? "Hide Notifications" : "Show Notifications"}
                            >
                                {showNotifications ? <CloseIcon /> : <NotificationIcon />}
                                {notificationCount > 0 && (
                                    <span className="notification-badge">{notificationCount}</span>
                                )}
                            </button>
                        </div>
                        
                        {/* Log Out Button */}
                        <button 
                            className="action-button logout-button"
                            onClick={handleLogout}
                            title="Logout"
                        >
                            <LogOutIcon />
                            Logout
                        </button>
                    </div>
                </header>
                
                {/* Logout Message Display */}
                {logoutMessage && (
                    <div className="logout-message bg-success text-white p-2 text-center fixed-top">
                        {logoutMessage}
                    </div>
                )}
                
                {/* --- MAIN CONTENT AREA: Pass state/setter via context to Dashboard --- */}
                <main className="main-content-area">
                    <Outlet context={{ showNotifications, toggleNotifications, user }} />
                </main>
            </div>
        </UserContext.Provider>
    );
}

export default Layout;
