import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// Ensure the path is correct based on your file structure
import logo from '../../subscriber/main_page/assets/logo.png'; 

// Base URL for the subscription API endpoint
const API_BASE_URL = "http://localhost:8080/api/subscriptions"; 

// --- Icon Components (Locally defined) ---
const LogOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const UndoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-rotate-ccw"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.5 15a9 9 0 1 0 .7-7.7L1 10"></path></svg>
);
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

// --- Static User Info for the Header (We will now get this from sessionStorage) ---
const getLoggedInUser = () => {
  const user = sessionStorage.getItem('loggedInUser');
  return user ? JSON.parse(user) : null;
};
const defaultAdmin = { username: "Admin User", role: "Admin" }; // Fallback

function AdminPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]); // All requests fetched from API
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const loggedInUser = getLoggedInUser() || defaultAdmin;

    // --- Data Fetching Effect ---
    const fetchRequests = async () => {
        setLoading(true);
        setMessage('');
        try {
            // Admin endpoint to get all pending requests
            const pendingResponse = await fetch(`${API_BASE_URL}/admin/requests`);
            
            // NOTE: Since the backend currently only has a service method for PENDING requests, 
            // we will need a second endpoint/service method to get *Approved* requests
            // to populate the 'Approved Subscriptions' table fully. 
            // For now, we will only show PENDING requests accurately.
            
            if (pendingResponse.ok) {
                const pendingData = await pendingResponse.json();
                
                // The API only returns pending requests. We will show these accurately.
                // We'll use a mock for approved requests until the backend is updated.
                setRequests(pendingData.map(req => ({
                    ...req,
                    status: 'Pending', // Add status for filtering
                    addgroup: req.groupName,
                    username: req.subscriberUsername,
                    dateRequested: req.requestedDate,
                    // Mocking other required fields from your original code
                    folder: 'Client Data A',
                    reportName: req.groupName.replace(/_/g, ' ') + ' Report'
                })));
                
                setMessage(`Successfully loaded ${pendingData.length} pending requests.`);
            } else {
                setMessage('Error loading pending requests from server.');
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
            setMessage('Network error: Could not connect to the backend server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // --- Action Handler (Approve/Deny/Revoke) ---
    const handleAction = async (requestId, action) => {
        setMessage(''); // Clear previous messages
        
        try {
            const response = await fetch(`${API_BASE_URL}/admin/process-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    requestId, 
                    action 
                }),
            });

            if (response.ok) {
                setMessage(`Request ID ${requestId} successfully ${action}d.`);
                // Re-fetch the data to update the UI
                fetchRequests();
            } else {
                const errorText = await response.text();
                setMessage(`Failed to process request: ${errorText}`);
            }
        } catch (error) {
            console.error("Error processing request:", error);
            setMessage('Network error: Failed to communicate with the server.');
        }
    };
    
    // --- Logout ---
    const handleLogout = () => {
        sessionStorage.removeItem('loggedInUser');
        console.log('Admin Logged out.');
        navigate('/'); // Navigate to login page
    };

    // --- Filtering Logic (Kept mostly intact, now using API data) ---
    const filteredRequests = useMemo(() => {
        if (!searchTerm) return requests;
        const term = searchTerm.toLowerCase();
        return requests.filter(req => (
            req.username.toLowerCase().includes(term) ||
            req.addgroup.toLowerCase().includes(term) ||
            req.reportName.toLowerCase().includes(term)
        ));
    }, [requests, searchTerm]);

    const pendingRequests = useMemo(() => 
        filteredRequests.filter(r => r.status === 'Pending'), 
        [filteredRequests]
    );

    // MOCK: Since the backend only fetches PENDING, approvedRequests is a mock for now
    // In a real implementation, you'd fetch this from a separate approved endpoint.
    const approvedRequests = []; // Currently no data source for this.

    return (
        <div className="app-container">
            {/* --- NAV-BAR / HEADER --- */}
            <header className="main-header" style={{ justifyContent: 'space-between' }}>
                <div className="header-left-content">
                    <div className="logo-section" onClick={() => navigate('/admin')}>
                        <img src={logo} alt="Standard Chartered logo" className="sc-logo" />
                    </div>
                    <div className="user-profile">
                        <h1 className="user-name">{loggedInUser.username}</h1>
                        <p className="user-email">Admin Approval</p>
                    </div>
                </div>
                
                <div className="header-actions">
                    {/* Log Out Button */}
                    <button 
                        className="action-button logout-button"
                        onClick={handleLogout}
                        title="Logout Admin"
                    >
                        <LogOutIcon />
                        Logout
                    </button>
                </div>
            </header>

            {/* --- MAIN DASHBOARD AREA --- */}
            <div className="dashboard-content admin-page-container">
                <h1 className="report-title">Subscription Request Management</h1>

                {/* --- Search Bar --- */}
                <div className="search-bar-container mb-4">
                    <div className="search-input-group">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search by User, Group, or Report Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="sc-search-input"
                        />
                    </div>
                </div>

                {/* Feedback Message */}
                {message && (
                    <div className={`alert alert-${message.includes('success') ? 'success' : 'danger'} p-2 text-center my-3`} role="alert">
                        {message}
                    </div>
                )}

                {/* --- PENDING REQUESTS TABLE --- */}
                <div className="reports-area admin-table-card pending-requests-area mb-5">
                    <h2 className="table-subtitle">Pending Requests ({pendingRequests.length} pending)</h2>
                    <div className="table-responsive">
                        <table className="data-table admin-request-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '15%' }}>User Name</th>
                                    <th style={{ width: '15%' }}>AD Group</th>
                                    <th style={{ width: '15%' }}>Folder</th>
                                    <th style={{ width: '18%' }}>Report Name</th>
                                    <th style={{ width: '10%' }}>Date</th>
                                    <th style={{ width: '27%' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingRequests.length > 0 ? (
                                    pendingRequests.map((req) => (
                                        <tr key={req.requestId} className="status-row">
                                            <td>{req.username}</td>
                                            <td>{req.addgroup}</td>
                                            <td><span className="destination-tag">{req.folder}</span></td>
                                            <td><p className="report-description">{req.reportName}</p></td>
                                            <td>{new Date(req.dateRequested).toLocaleDateString()}</td>
                                            <td className="admin-action-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {/* Approve Button */}
                                                <button
                                                    className="action-button admin-approve-button"
                                                    onClick={() => handleAction(req.requestId, 'approve')}
                                                    style={{ backgroundColor: 'green', color: 'white' }}
                                                >
                                                    <CheckIcon /> Approve
                                                </button>
                                                {/* Deny Button */}
                                                <button
                                                    className="action-button admin-deny-button"
                                                    onClick={() => handleAction(req.requestId, 'reject')} // Use 'reject' for backend
                                                    style={{ backgroundColor: 'red', color: 'white' }}
                                                >
                                                    <XIcon /> Deny
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-reports">No pending requests require action.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- APPROVED REQUESTS TABLE (With Revoke Option) --- */}
                <div className="reports-area admin-table-card approved-requests-area">
                    <h2 className="table-subtitle">Approved Subscriptions ({approvedRequests.length} active)</h2>
                    <div className="table-responsive">
                        <table className="data-table admin-request-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '15%' }}>User Name</th>
                                    <th style={{ width: '15%' }}>AD Group</th>
                                    <th style={{ width: '15%' }}>Folder</th>
                                    <th style={{ width: '25%' }}>Report Name</th>
                                    <th style={{ width: '10%' }}>Date</th>
                                    <th style={{ width: '20%' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* NOTE: This section is currently empty because the backend only provides PENDING requests.
                                    In a full implementation, you would fetch approved subscriptions here and map them out. */}
                                {approvedRequests.length > 0 ? (
                                    approvedRequests.map((req) => (
                                        <tr key={req.id} className="status-row">
                                            <td>{req.username}</td>
                                            <td>{req.addgroup}</td>
                                            <td><span className="destination-tag">{req.folder}</span></td>
                                            <td><p className="report-description">{req.reportName}</p></td>
                                            <td>{req.dateRequested}</td>
                                            <td>
                                                <button
                                                    className="action-button admin-revoke-button"
                                                    onClick={() => handleAction(req.id, 'deny')} // Revoke logic is typically 'deny'
                                                    style={{ backgroundColor: '#0087CE', color: 'white' }}
                                                >
                                                    <UndoIcon /> Revoke
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-reports">No currently approved subscriptions.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPage;
