import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// Assuming logo is available at this path
import logo from "../../assets/logo.png"; 

// Base URL for the Spring Boot backend
const API_BASE_URL = "http://localhost:8080/api/auth"; 

const LoginPage = () => {
  const [role, setRole] = useState("admin"); // Default to 'admin' as in your original code
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      if (response.ok) {
        // SUCCESS: Save user details to sessionStorage
        // This is crucial for Layout.js and Dashboard.js to know the logged-in user
        const loggedInUser = { username, role };
        sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));

        // Navigate based on the role submitted.
        navigate(`/${role.toLowerCase()}`); 
      } else {
        // Handle invalid credentials or role mismatch
        const errorMessage = await response.text();
        setError(errorMessage || "Invalid Username or Password for the selected role.");
      }
    } catch (err) {
      console.error("Network error during login:", err);
      setError("Could not connect to the server. Please check your backend.");
    }
  };

  const roles = ["admin", "ops", "subscriber"];

  return (
    <div className="d-flex justify-content-center align-items-center bg-light vh-100" 
         style={{ background: 'linear-gradient(to right, #ece9e6, #ffffff)' }}>
      <div className="card shadow-lg p-4 text-center" style={{ width: "700px", borderRadius: "10px", background: 'white' }}>
        <center>
          {/* Replace with a fallback image/logo if needed */}
          <img style={{ height: "75px", width: "40%" }} src={logo} alt="Logo" />
        </center>
        <h3 className="text-center text-primary mb-5">Login</h3>

        {/* Role selection buttons */}
        <div className="btn-group w-100 mb-3 justify-content-center">
          {roles.map((r) => (
            <button
              key={r}
              className={`btn btn-outline-primary text-center ${role === r ? "active" : ""}`}
              onClick={() => {
                setRole(r);
                setUsername("");
                setPassword("");
                setError("");
              }}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin}>
          {/* Username Input */}
          <div className="mb-3 text-start">
            <label className="form-label fw-semibold">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div className="mb-4 text-start">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-danger text-center">{error}</p>}

          <button type="submit" className="btn btn-primary w-100 py-2">
            Login
          </button>
        </form>

        <div className="text-center mt-3">
          <small>
            New user? (" ")
            <Link to="/register" className="text-decoration-none text-primary fw-semibold">
              Register
            </Link>
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
