import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

// Base URL for the Spring Boot backend
const API_BASE_URL = "http://localhost:8080/api/subscriptions"; 

// --- Icon Components ---
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 17 2 13 22 2"></polygon></svg>
);
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
// <<< FIX: CloseIcon definition added here >>>
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

// --- Initial Lists (Exported for use in Layout.js) ---
export const initialNotifications = [
    { report: 'Ops_Reports', message: 'New operations report uploaded on 2025-10-09' },
    { report: 'Finance_Reports', message: 'Monthly finance report summary available' },
    { report: 'Compliance_Data', message: 'Compliance audit access restored' },
];


function SubscriberDashboard() {
    // Get shared state from Layout.js
    const { showNotifications, toggleNotifications, user } = useOutletContext();
    
    // State to hold the fetched data
    const [allGroups, setAllGroups] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTable, setActiveTable] = useState('subscribed');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    
    // --- Data Fetching Effect ---
    // Fetches the user's groups from the backend on load or when a request is made
    const fetchGroups = async () => {
        if (!user || !user.username) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${user.username}`);
            if (response.ok) {
                const data = await response.json();
                setAllGroups(data); // The backend returns groups with a status field
            } else {
                setMessage('Error fetching groups.');
                setAllGroups([]);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setMessage('Network error: Could not connect to the server.');
            setAllGroups([]);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchGroups();
    }, [user]); // Re-fetch when user object changes (though it shouldn't once logged in)

    // --- Interaction Handlers ---

    const handleNavigateClick = (groupName) => {
        console.log(`Navigating to Reports page for group: ${groupName}`);
        // Navigate logic (kept as in your original file)
        navigate(`/subscriber/reports/${groupName}`);
    };

    const handleNotificationClick = (groupName) => {
        console.log(`Notification for group ${groupName} clicked.`);
        navigate('/subscriber/reports'); // Navigate to a generic reports view
    };

    const handleSubscriptionRequest = async (group) => {
        setMessage(''); // Clear previous messages
        
        try {
            const response = await fetch(`${API_BASE_URL}/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: user.username, 
                    groupName: group.addgroup // Use the group name as the backend expects it
                }),
            });

            if (response.ok) {
                setMessage(`Subscription request sent for: ${group.addgroup}. Awaiting Admin approval.`);
                // Immediately re-fetch groups to update the state from Unsubscribed to Pending
                fetchGroups();
            } else {
                const errorText = await response.text();
                setMessage(`Request failed: ${errorText}`);
            }
        } catch (error) {
            console.error("Error sending request:", error);
            setMessage('Network error: Failed to send subscription request.');
        }
    };
    
    // --- Group Filtering ---
    const filterGroups = (groups) => {
        if (!searchTerm) return groups;
        const term = searchTerm.toLowerCase();
        return groups.filter(group => 
            group.addgroup.toLowerCase().includes(term) || 
            group.description.toLowerCase().includes(term)
        );
    };

    // Use Memo to efficiently split groups based on fetched status
    const subscribedGroups = useMemo(() => allGroups.filter(g => g.status === 'Subscribed'), [allGroups]);
    const unsubscribedGroups = useMemo(() => allGroups.filter(g => g.status === 'Unsubscribed'), [allGroups]);
    const pendingGroups = useMemo(() => allGroups.filter(g => g.status === 'Pending'), [allGroups]);

    // Apply search filter to the separated lists
    const filteredSubscribedGroups = useMemo(() => filterGroups(subscribedGroups), [subscribedGroups, searchTerm]);
    const filteredUnsubscribedGroups = useMemo(() => filterGroups(unsubscribedGroups), [unsubscribedGroups, searchTerm]);
    const filteredPendingGroups = useMemo(() => filterGroups(pendingGroups), [pendingGroups, searchTerm]);

    
    // --- UI Components: Tables ---

    // Renders the table for Subscribed Groups
    const SubscribedContentTable = () => (
        <div className="reports-area primary-table-card">
            <h2 className="report-title">Subscribed Groups ({filteredSubscribedGroups.length} items)</h2>
            <table className="data-table subscriber-table table-responsive">
                <thead>
                    <tr>
                        <th style={{ width: '30%' }}>Group Name</th>
                        <th style={{ width: '45%' }}>Description</th>
                        <th style={{ width: '15%' }}>Date</th>
                        <th style={{ width: '10%' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSubscribedGroups.length > 0 ? (
                        filteredSubscribedGroups.map(group => (
                            <tr key={group.id} onClick={() => handleNavigateClick(group.addgroup)}>
                                <td>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigateClick(group.addgroup); }}>
                                        {group.addgroup}
                                    </a>
                                    <p className="report-description">{group.description}</p>
                                </td>
                                <td>{group.description}</td> 
                                <td>{new Date().toLocaleDateString()}</td> {/* Date is hardcoded on backend save, but using current date here */}
                                <td>
                                    <span className={`status-tag status-${group.status.toLowerCase()}`}>{group.status}</span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="no-reports">No subscribed groups found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    // Renders the table for Unsubscribed Groups
    const UnsubscribedContentTable = () => (
        <div className="reports-area primary-table-card">
            <h2 className="report-title">New Groups Available ({filteredUnsubscribedGroups.length} items)</h2>
            <table className="data-table subscriber-table table-responsive">
                <thead>
                    <tr>
                        <th style={{ width: '30%' }}>Group</th>
                        <th style={{ width: '45%' }}>Description</th>
                        <th style={{ width: '25%' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUnsubscribedGroups.length > 0 ? (
                        filteredUnsubscribedGroups.map(group => (
                            <tr key={group.id}>
                                <td>{group.addgroup}</td>
                                <td><p className="report-description">{group.description}</p></td>
                                <td>
                                    <button 
                                        className="action-button subscribe-button"
                                        onClick={() => handleSubscriptionRequest(group)}
                                    >
                                        <SendIcon /> Send Request
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="no-reports">No new groups available.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
    
    // Renders the table for Pending Requests
    const PendingRequestsTable = () => (
        <div className="reports-area primary-table-card">
            <h2 className="report-title">Pending Subscription Requests ({filteredPendingGroups.length} items)</h2>
            <table className="data-table subscriber-table table-responsive">
                <thead>
                    <tr>
                        <th style={{ width: '30%' }}>Group Name</th>
                        <th style={{ width: '40%' }}>Description</th>
                        <th style={{ width: '30%' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPendingGroups.length > 0 ? (
                        filteredPendingGroups.map(group => (
                            <tr key={group.id}>
                                <td>{group.addgroup}</td>
                                <td>
                                    <p className="report-description">{group.description}</p>
                                </td>
                                <td>
                                    <span className={`status-tag status-${group.status.toLowerCase()}`}>{group.status}</span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="no-reports">No pending subscription requests.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );


    // --- Content Renderer (Renders the active tab) ---
    const ContentRenderer = () => {
        if (loading) {
            return <div className="p-5 text-center text-primary">Loading Groups...</div>;
        }
        
        switch (activeTable) {
            case 'subscribed':
                return <SubscribedContentTable />;
            case 'unsubscribed':
                return <UnsubscribedContentTable />;
            case 'pending':
                return <PendingRequestsTable />;
            default:
                return null;
        }
    };


    return (
        <div className="dashboard-content">
            
            {/* --- Search Bar --- */}
            <div className="search-bar-container mb-4">
                <div className="search-input-group">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search all Reports by Name or Description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="sc-search-input"
                    />
                </div>
            </div>
            
            {/* Feedback Message */}
            {message && (
                <div className="alert alert-info p-2 text-center my-3" role="alert">
                    {message}
                </div>
            )}
            
            {/* --- Tab Switcher (Controls Main Table) --- */}
            <div className="tab-switcher tab-bar-container mb-4">
                <button
                    className={`tab-button ${activeTable === 'subscribed' ? 'active' : ''}`}
                    onClick={() => setActiveTable('subscribed')}
                >
                    Subscribed Groups ({filteredSubscribedGroups.length})
                </button>
                <button
                    className={`tab-button ${activeTable === 'unsubscribed' ? 'active' : ''}`}
                    onClick={() => setActiveTable('unsubscribed')}
                >
                    New Groups Available ({filteredUnsubscribedGroups.length})
                </button>
                <button
                    className={`tab-button ${activeTable === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTable('pending')}
                >
                    Pending Requests ({filteredPendingGroups.length})
                </button>
            </div>

            {/* Render the selected content table */}
            <ContentRenderer />
            
            {/* Notification Sidebar (Kept separate from main content) */}
            {showNotifications && (
                <div className="notification-sidebar">
                    <div className="sidebar-header">
                        <h4>Notifications</h4>
                        <button onClick={toggleNotifications}>
                            {/* Line 320: CloseIcon is now defined above */}
                            <CloseIcon /> 
                        </button>
                    </div>
                    {initialNotifications.map((note, index) => (
                        <div key={index} className="notification-item" onClick={() => handleNotificationClick(note.report)}>
                            <strong>{note.report}:</strong> {note.message}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SubscriberDashboard;
