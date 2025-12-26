document.addEventListener('DOMContentLoaded', () => {

    // --- State ---
    // Leave balances - load from settings or use defaults
    function loadLeaveBalances() {
        const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
        const leavePolicy = settings.leavePolicy || '';
        
        // Try to extract leave balances from policy text
        let balances = {
            Annual: 0,
            Sick: 0,
            Casual: 0
        };
        
        // Parse leave policy to extract leave days
        if (leavePolicy) {
            // Look for patterns like "Annual Leave: 20 days" or "20 days per year"
            const annualMatch = leavePolicy.match(/Annual\s+Leave[:\-]?\s*(\d+)/i) || leavePolicy.match(/(\d+)\s*days?\s*.*Annual/i);
            const sickMatch = leavePolicy.match(/Sick\s+Leave[:\-]?\s*(\d+)/i) || leavePolicy.match(/(\d+)\s*days?\s*.*Sick/i);
            const casualMatch = leavePolicy.match(/Casual\s+Leave[:\-]?\s*(\d+)/i) || leavePolicy.match(/(\d+)\s*days?\s*.*Casual/i);
            
            if (annualMatch) balances.Annual = parseInt(annualMatch[1]) || 0;
            if (sickMatch) balances.Sick = parseInt(sickMatch[1]) || 0;
            if (casualMatch) balances.Casual = parseInt(casualMatch[1]) || 0;
        }
        
        // If no balances found in policy, check if stored separately
        if (balances.Annual === 0 && balances.Sick === 0 && balances.Casual === 0) {
            if (settings.annualLeaveBalance) balances.Annual = parseInt(settings.annualLeaveBalance) || 0;
            if (settings.sickLeaveBalance) balances.Sick = parseInt(settings.sickLeaveBalance) || 0;
            if (settings.casualLeaveBalance) balances.Casual = parseInt(settings.casualLeaveBalance) || 0;
        }
        
        return balances;
    }
    
    let balances = loadLeaveBalances();

    // Load or Init Requests
    let requests = JSON.parse(localStorage.getItem('nexhr_leaves')) || [];
    
    // Helper function to reload requests from storage
    function reloadRequests() {
        requests = JSON.parse(localStorage.getItem('nexhr_leaves')) || [];
        return requests;
    }

    // --- Elements ---
    const balAnnual = document.getElementById('balAnnual');
    const balSick = document.getElementById('balSick');
    const balCasual = document.getElementById('balCasual');
    const requestForm = document.getElementById('leaveRequestForm');
    const approvalQueueBody = document.getElementById('approvalQueueBody');
    const myHistoryBody = document.getElementById('myHistoryBody');

    // --- Functions ---
    // Calculate number of days between two dates (Nepali date format: YYYY-MM-DD)
    function calculateDays(startDate, endDate) {
        try {
            // Parse Nepali dates (format: YYYY-MM-DD)
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                // If date parsing fails, try to calculate manually
                const startParts = startDate.split('-');
                const endParts = endDate.split('-');
                if (startParts.length === 3 && endParts.length === 3) {
                    const startYear = parseInt(startParts[0]);
                    const startMonth = parseInt(startParts[1]);
                    const startDay = parseInt(startParts[2]);
                    const endYear = parseInt(endParts[0]);
                    const endMonth = parseInt(endParts[1]);
                    const endDay = parseInt(endParts[2]);
                    
                    // Simple calculation (approximate)
                    const daysDiff = (endYear - startYear) * 365 + (endMonth - startMonth) * 30 + (endDay - startDay);
                    return Math.max(1, daysDiff + 1); // At least 1 day
                }
                return 1; // Default to 1 day if parsing fails
            }
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return Math.max(1, diffDays + 1); // At least 1 day
        } catch (e) {
            return 1; // Default to 1 day on error
        }
    }
    
    function renderBalances() {
        // Reload balances from settings to get total leave days
        const totalBalances = loadLeaveBalances();
        
        // Get current user's employee ID
        const currentUserStr = sessionStorage.getItem('nexhr_currentUser');
        let currentUser = null;
        let currentUserEmployeeId = null;
        
        try {
            currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
            if (currentUser) {
                if (currentUser.employeeId) {
                    currentUserEmployeeId = currentUser.employeeId;
                } else {
                    const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
                    const userLogin = users.find(u => u.username === currentUser.username);
                    if (userLogin && userLogin.employeeId) {
                        currentUserEmployeeId = userLogin.employeeId;
                    }
                }
            }
        } catch (e) {
            console.error('Error parsing current user:', e);
        }
        
        // Calculate taken leaves (only approved leaves for current user)
        let takenAnnual = 0;
        let takenSick = 0;
        let takenCasual = 0;
        
        if (currentUserEmployeeId) {
            requests.forEach(req => {
                // Only count approved leaves for the current user
                if (parseInt(req.employeeId) === parseInt(currentUserEmployeeId) && 
                    req.status && req.status.toLowerCase() === 'approved') {
                    const days = calculateDays(req.start, req.end);
                    if (req.type === 'Annual') takenAnnual += days;
                    else if (req.type === 'Sick') takenSick += days;
                    else if (req.type === 'Casual') takenCasual += days;
                }
            });
        }
        
        // Calculate remaining balances
        balances.Annual = Math.max(0, totalBalances.Annual - takenAnnual);
        balances.Sick = Math.max(0, totalBalances.Sick - takenSick);
        balances.Casual = Math.max(0, totalBalances.Casual - takenCasual);
        
        if (balAnnual) balAnnual.innerText = balances.Annual;
        if (balSick) balSick.innerText = balances.Sick;
        if (balCasual) balCasual.innerText = balances.Casual;
    }

    function renderTables() {
        // Reload requests from storage to ensure we have the latest data
        reloadRequests();
        
        if (approvalQueueBody) approvalQueueBody.innerHTML = '';
        if (myHistoryBody) myHistoryBody.innerHTML = '';

        const currentUserStr = sessionStorage.getItem('nexhr_currentUser');
        let currentUser = null;
        try {
            currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
        } catch (e) {
            console.error('Error parsing current user:', e);
        }
        
        // Debug logging
        console.log('Leave requests:', requests);
        console.log('Pending requests:', requests.filter(r => (r.status || 'Pending').toLowerCase() === 'pending'));
        
        // Check if user is admin - be more lenient with admin detection
        const isAdmin = currentUser && (
            currentUser.role === 'Admin' || 
            currentUser.role === 'admin' ||
            currentUser.username === 'admin' ||
            currentUser.username === 'Admin'
        );
        
        // Always show approval section, but only show approve/reject buttons for admins
        const approvalSection = approvalQueueBody ? approvalQueueBody.closest('.content-card') : null;
        if (approvalSection) {
            approvalSection.style.display = 'block';
        }

        let pendingCount = 0;
        const currentUserName = currentUser ? currentUser.username : null;

        requests.forEach(req => {
            // My History - Show only the current user's requests
            // First, get the current user's employee ID
            let currentUserEmployeeId = null;
            if (currentUser) {
                // Check if currentUser has employeeId directly
                if (currentUser.employeeId) {
                    currentUserEmployeeId = currentUser.employeeId;
                } else {
                    // Try to find employee ID from users table
                    const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
                    const userLogin = users.find(u => u.username === currentUser.username);
                    if (userLogin && userLogin.employeeId) {
                        currentUserEmployeeId = userLogin.employeeId;
                    }
                }
            }
            
            // Match by employee ID (most reliable)
            let isMyRequest = false;
            if (currentUserEmployeeId && req.employeeId) {
                isMyRequest = parseInt(currentUserEmployeeId) === parseInt(req.employeeId);
            } else if (req.isMe && currentUser) {
                // Fallback: if isMe is true and we have a current user, check if it matches
                // Only trust isMe if we can verify it's actually the current user
                const employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
                const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
                const userLogin = users.find(u => u.username === currentUser.username);
                
                if (userLogin && userLogin.employeeId) {
                    isMyRequest = parseInt(userLogin.employeeId) === parseInt(req.employeeId);
                } else {
                    // Last resort: match by name (but be strict)
                    const emp = employees.find(e => e.name === req.name);
                    if (emp && userLogin && userLogin.employeeId) {
                        isMyRequest = emp.id === userLogin.employeeId;
                    }
                }
            }
            
            if (isMyRequest) {
                const statusClass = req.status === 'Approved' ? 'status-approved' : (req.status === 'Rejected' ? 'status-rejected' : 'status-pending');
                const reason = req.reason ? `<br><small style="color: var(--text-dim); font-size: 0.75rem;">Reason: ${req.reason}</small>` : '';
                const row = `
                    <tr>
                        <td>${req.type}</td>
                        <td>${req.start} to ${req.end}${reason}</td>
                        <td><span class="${statusClass}">${req.status || 'Pending'}</span></td>
                    </tr>
                `;
                if (myHistoryBody) myHistoryBody.insertAdjacentHTML('afterbegin', row);
            }

            // Approval Queue - Show ALL pending requests (admins can approve/reject, others can view)
            // Ensure status is 'Pending' (case-insensitive check)
            const status = req.status || 'Pending';
            const isPending = status.toLowerCase() === 'pending';
            
            if (isPending) {
                pendingCount++;
                const reqId = req.id;
                const row = `
                    <tr>
                        <td>${req.name || 'Unknown'}</td>
                        <td>${req.type}</td>
                        <td style="font-size:0.85rem">${req.start}<br>${req.end}${req.reason ? `<br><small style="color: var(--text-dim); font-size: 0.7rem;">Reason: ${req.reason}</small>` : ''}</td>
                        <td class="admin-actions">
                            ${isAdmin ? `
                                <button class="btn-approve" onclick="window.approveLeave(${reqId})" title="Approve" data-request-id="${reqId}">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="btn-reject" onclick="window.rejectLeave(${reqId})" title="Reject" data-request-id="${reqId}">
                                    <i class="fas fa-times"></i> Reject
                                </button>
                            ` : `
                                <span style="color: var(--text-dim); font-size: 0.85rem;">Pending Approval</span>
                            `}
                        </td>
                    </tr>
                `;
                if (approvalQueueBody) approvalQueueBody.insertAdjacentHTML('beforeend', row);
            }
        });

        // Empty State for pending requests
        if (pendingCount === 0 && approvalQueueBody) {
            approvalQueueBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-dim); padding:1rem;">No pending requests</td></tr>`;
        }
        
        // Empty State for My History
        if (myHistoryBody && myHistoryBody.children.length === 0) {
            myHistoryBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-dim); padding:1rem;">No leave requests found</td></tr>`;
        }
    }

    // Expose global functions for onclick
    window.approveLeave = function(id) {
        updateStatus(id, 'Approved');
    };

    window.rejectLeave = function(id) {
        if (!confirm('Are you sure you want to reject this leave request?')) return;
        updateStatus(id, 'Rejected');
    };

    function updateStatus(id, status) {
        // Convert id to number if it's a string
        const requestId = typeof id === 'string' ? parseInt(id) : id;
        
        // Try to find request by both numeric and original id
        let req = requests.find(r => r.id === requestId);
        if (!req) {
            req = requests.find(r => r.id === id);
        }
        if (!req) {
            req = requests.find(r => String(r.id) === String(id));
        }
        
        if (req) {
            req.status = status;
            localStorage.setItem('nexhr_leaves', JSON.stringify(requests));
            
            // Recalculate balances (will update based on approved leaves)
            renderBalances();
            // Re-render tables to reflect the change
            renderTables();
            
            // Show toast notification
            if (typeof showToast === 'function') {
                const action = status === 'Approved' ? 'approved' : 'rejected';
                showToast(`Leave request ${action} successfully!`);
            } else {
                // Fallback alert if toast not available
                alert(`Leave request ${status.toLowerCase()} successfully!`);
            }
        } else {
            console.error('Leave request not found:', id, 'Available IDs:', requests.map(r => r.id));
            if (typeof showToast === 'function') {
                showToast('Leave request not found!');
            } else {
                alert('Leave request not found!');
            }
        }
    }

    // Form Submit
    if (requestForm) {
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const leaveTypeEl = document.getElementById('leaveType');
            const startDateEl = document.getElementById('startDate');
            const endDateEl = document.getElementById('endDate');
            const reasonEl = document.getElementById('reason');
            
            // Null checks
            if (!leaveTypeEl || !startDateEl || !endDateEl) {
                if (typeof showToast === 'function') {
                    showToast('Error: Form fields not found. Please refresh the page.');
                } else {
                    alert('Error: Form fields not found. Please refresh the page.');
                }
                return;
            }
            
            const type = leaveTypeEl.value;
            const start = startDateEl.value;
            const end = endDateEl.value;

            // Validation
            if (!type) {
                if (typeof showToast === 'function') {
                    showToast('Please select a leave type!');
                } else {
                    alert('Please select a leave type!');
                }
                leaveTypeEl.focus();
                return;
            }
            
            if (!start || !end) {
                if (typeof showToast === 'function') {
                    showToast('Please select both start and end dates!');
                } else {
                    alert('Please select both start and end dates!');
                }
                return;
            }
            
            // Date validation: start date should be before or equal to end date
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            if (startDate > endDate) {
                if (typeof showToast === 'function') {
                    showToast('Start date must be before or equal to end date!');
                } else {
                    alert('Start date must be before or equal to end date!');
                }
                startDateEl.focus();
                return;
            }
            
            // Check if start date is in the past (optional - you might want to allow past dates)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (startDate < today) {
                if (typeof showToast === 'function') {
                    showToast('Warning: Start date is in the past. Please verify.');
                }
            }

            // Get current user name
            const currentUser = JSON.parse(sessionStorage.getItem('nexhr_currentUser'));
            let userName = 'Admin User';
            let employeeId = null;
            
            // Try to get employee name if user has employee login
            if (currentUser) {
                userName = currentUser.username || 'Admin User';
                const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
                const userLogin = users.find(u => u.username === userName && u.employeeId);
                
                if (userLogin) {
                    const employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
                    const emp = employees.find(e => e.id === userLogin.employeeId);
                    if (emp) {
                        userName = emp.name;
                        employeeId = emp.id;
                    }
                }
            }

            const newReq = {
                id: Date.now(),
                name: userName,
                employeeId: employeeId,
                type: type,
                start: start,
                end: end,
                reason: reasonEl ? reasonEl.value.trim() : '',
                status: 'Pending', // Explicitly set status
                isMe: true,
                createdAt: new Date().toISOString()
            };

            requests.push(newReq);
            localStorage.setItem('nexhr_leaves', JSON.stringify(requests));

            // Recalculate balances (will only deduct approved leaves)
            renderBalances();
            renderTables();
            
            // Reset form
            if (requestForm) {
                requestForm.reset();
                // Clear date fields explicitly
                if (startDateEl) startDateEl.value = '';
                if (endDateEl) endDateEl.value = '';
                if (reasonEl) reasonEl.value = '';
            }
            
            if (typeof showToast === 'function') {
                showToast('Leave request submitted successfully!');
            }
        });
    }

    // Load and display leave policy
    function loadLeavePolicy() {
        const leavePolicyDisplay = document.getElementById('leavePolicyDisplay');
        if (!leavePolicyDisplay) return;
        
        try {
            const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
            const leavePolicy = settings.leavePolicy || '';
            
            if (leavePolicy.trim()) {
                leavePolicyDisplay.innerHTML = leavePolicy.replace(/\n/g, '<br>');
            } else {
                leavePolicyDisplay.innerHTML = '<p style="color: var(--text-dim); font-style: italic;">No leave policy defined yet. Contact HR for details.</p>';
            }
        } catch (error) {
            console.error('Error loading leave policy:', error);
            leavePolicyDisplay.innerHTML = '<p style="color: var(--text-dim); font-style: italic;">Error loading leave policy.</p>';
        }
    }
    
    // Init
    renderBalances();
    renderTables();
});
