import React from 'react';
import { useNavigate } from 'react-router-dom';
import './First.css';

export default function First() {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    if (role === 'OWNER') {
      // Send owners to the owner login page
      navigate('/owner-login');
    } else {
      // Send Cashiers and Kitchen staff to a staff login page 
      // (Create a '/staff-login' or '/login' route if you haven't already!)
      navigate('/staff-login', { state: { selectedRole: role.toLowerCase() } }); 
    }
  };

  return (
    <div className="first-container">
      {/* Background animated overlay */}
      <div className="overlay"></div>
      
      <div className="content-wrapper">
        <header className="first-header">
          <h1>Welcome to the Platform</h1>
          <p>Please select your workspace role to continue to the dashboard.</p>
        </header>
        
        <div className="roles-grid">
          
          {/* Owner Button Card */}
          <div className="role-card" onClick={() => handleRoleSelect('OWNER')}>
            <h2>OWNER</h2>
            <p>Manage the entire restaurant, view analytics, customize the shop, and control staff settings.</p>
          </div>

          {/* Kitchen Button Card */}
          <div className="role-card" onClick={() => handleRoleSelect('KITCHEN')}>
            <h2>KITCHEN</h2>
            <p>View incoming tickets, manage food preparation times, and update order statuses.</p>
          </div>

          {/* Cashier Button Card */}
          <div className="role-card" onClick={() => handleRoleSelect('CASHIER')}>
            <h2>CASHIER</h2>
            <p>Handle customer payments, manage table bills, and process new walk-in orders.</p>
          </div>

        </div>
      </div>
    </div>
  );
}