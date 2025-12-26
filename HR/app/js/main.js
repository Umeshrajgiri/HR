document.addEventListener('DOMContentLoaded', () => {

    // --- Employee Data ---
    // Load from localStorage, starts empty
    let employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];


    // --- DOM Elements ---
    const tableBody = document.querySelector('#employeesTable tbody');
    const totalCount = document.getElementById('totalCount');
    const searchInput = document.getElementById('employeeSearch');
    // Dashboard Header Elements
    const headerSearch = document.querySelector('.search-bar input');
    const headerSearchIcon = document.querySelector('.search-bar i');
    const headerNotifications = document.querySelector('.notifications');
    const headerProfile = document.querySelector('.user-profile');
    const viewAllActivity = document.querySelector('.view-all');

    const addModal = document.getElementById('addEmployeeModal');
    const openModalBtn = document.getElementById('openAddModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const addForm = document.getElementById('addEmployeeForm');

    // --- Functions ---
    function renderTable(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        // Check if user is admin
        const currentUser = JSON.parse(sessionStorage.getItem('nexhr_currentUser'));
        const isUserAdmin = currentUser && (
            currentUser.role === 'Admin' || 
            currentUser.role === 'admin' ||
            currentUser.username === 'admin' ||
            currentUser.username === 'Admin'
        );
        
        data.forEach(emp => {
            const statusClass = emp.status === 'Active' ? 'status-active' : 'status-leave';
            // Format joining date (Nepali date format: yyyy-mm-dd)
            let joiningDateDisplay = 'N/A';
            if (emp.joiningDate) {
                // If it's already in Nepali format (yyyy-mm-dd), display it
                if (emp.joiningDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // Format Nepali date: 2081-01-15 -> 2081/01/15 (BS)
                    const parts = emp.joiningDate.split('-');
                    joiningDateDisplay = `${parts[0]}/${parts[1]}/${parts[2]} (BS)`;
                } else {
                    // Fallback for old Gregorian dates
                    const date = new Date(emp.joiningDate);
                    joiningDateDisplay = date.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                }
            }
            
            // Format salary
            const salary = emp.salary || emp.baseSalary || 0;
            const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
            const currencySymbol = settings.currency || 'RS';
            const formattedSalary = `${currencySymbol} ${salary.toLocaleString('en-US')}`;
            
            const row = `
                <tr>
                    <td>
                        <div class="employee-profile">
                            <div class="employee-avatar">${emp.avatar}</div>
                            <span>${emp.name}</span>
                        </div>
                    </td>
                    <td>${emp.role}</td>
                    <td>${emp.dept}</td>
                    <td>${joiningDateDisplay}</td>
                    <td><strong>${formattedSalary}</strong></td>
                    <td><span class="status-badge ${statusClass}">${emp.status}</span></td>
                    <td style="position: relative;">
                        ${isUserAdmin ? `
                        <div class="action-menu-container">
                            <button class="action-menu-btn" data-emp-id="${emp.id}">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="action-menu" data-emp-id="${emp.id}">
                                <button class="action-menu-item edit-emp" data-emp-id="${emp.id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="action-menu-item delete-emp" data-emp-id="${emp.id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                        ` : '<span style="color: var(--text-dim); font-size: 0.85rem;">View Only</span>'}
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
        if (totalCount) totalCount.innerText = data.length;
    }

    // --- Event Listeners ---

    // Initial Render
    if (tableBody) {
        renderTable(employees);
    }

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = employees.filter(emp =>
                emp.name.toLowerCase().includes(term) ||
                emp.role.toLowerCase().includes(term)
            );
            renderTable(filtered);
        });
    }

    // Initialize Nepali Date Picker
    function initNepaliDatePicker() {
        const joiningDateInput = document.getElementById('joiningDate');
        if (joiningDateInput) {
            // Destroy existing instance if any
            try {
                if (joiningDateInput.nepaliDatePicker && typeof joiningDateInput.nepaliDatePicker === 'function') {
                    joiningDateInput.nepaliDatePicker('destroy');
                }
            } catch(e) {
                // Ignore errors
            }
            
            // Wait a bit for DOM to be ready
            setTimeout(() => {
                // Initialize Nepali date picker with year and month selection
                try {
                    // Check if the library is loaded
                    if (typeof window.nepaliDatePicker === 'undefined' && 
                        typeof joiningDateInput.nepaliDatePicker === 'undefined') {
                        console.warn('Nepali DatePicker library not loaded');
                        return;
                    }

                    // Method 1: Try direct function call (most common)
                    if (typeof joiningDateInput.nepaliDatePicker === 'function') {
                        joiningDateInput.nepaliDatePicker({
                            dateFormat: "yyyy-mm-dd",
                            language: "english",
                            ndpYear: true,        // CRITICAL: Enable year selection dropdown
                            ndpMonth: true,      // Enable month selection dropdown
                            ndpYearCount: 100,   // Number of years to show in dropdown
                            readOnlyInput: true,
                            disableDaysAfter: 0,  // Disable future dates
                            onChange: function() {
                                // Ensure year selector is visible after change
                                setTimeout(() => {
                                    const yearSelect = document.querySelector('.nepali-calendar .calendar-header select[name="year"], .nepali-calendar .calendar-header .year-select');
                                    if (yearSelect) {
                                        yearSelect.style.display = 'inline-block';
                                        yearSelect.style.visibility = 'visible';
                                    }
                                }, 100);
                            }
                        });
                    } 
                    // Method 2: Try window.nepaliDatePicker
                    else if (typeof window.nepaliDatePicker === 'function') {
                        window.nepaliDatePicker(joiningDateInput, {
                            dateFormat: "yyyy-mm-dd",
                            language: "english",
                            ndpYear: true,
                            ndpMonth: true,
                            ndpYearCount: 100,
                            readOnlyInput: true,
                            disableDaysAfter: 0
                        });
                    }
                    // Method 3: jQuery fallback
                    else if (typeof $ !== 'undefined' && typeof $.fn.nepaliDatePicker !== 'undefined') {
                        $(joiningDateInput).nepaliDatePicker({
                            dateFormat: "yyyy-mm-dd",
                            language: "english",
                            ndpYear: true,
                            ndpMonth: true,
                            ndpYearCount: 100,
                            readOnlyInput: true,
                            disableDaysAfter: 0
                        });
                    }
                    
                    // Force show year selector after initialization
                    setTimeout(() => {
                        const calendar = document.querySelector('.nepali-calendar');
                        if (calendar) {
                            const yearSelect = calendar.querySelector('select[name="year"], .year-select, select');
                            if (yearSelect) {
                                yearSelect.style.display = 'inline-block';
                                yearSelect.style.visibility = 'visible';
                                yearSelect.style.opacity = '1';
                            }
                        }
                    }, 300);
                } catch(error) {
                    console.error('Error initializing Nepali date picker:', error);
                }
            }, 200);
        }
    }

    // Load role configurations into dropdown
    function loadRoleConfigs() {
        const roleSelect = document.getElementById('role');
        const customRoleInput = document.getElementById('customRole');
        if (!roleSelect) return;
        
        const roleConfigs = JSON.parse(localStorage.getItem('nexhr_roleConfigs')) || [];
        roleSelect.innerHTML = '<option value="">Select Role or Enter Custom</option>';
        
        roleConfigs.forEach(config => {
            const option = document.createElement('option');
            option.value = config.roleName;
            option.textContent = config.roleName;
            option.setAttribute('data-config', JSON.stringify(config));
            roleSelect.appendChild(option);
        });
        
        // Add "Custom" option
        const customOption = document.createElement('option');
        customOption.value = '__custom__';
        customOption.textContent = '--- Enter Custom Role ---';
        roleSelect.appendChild(customOption);
    }
    
    // Load role configurations into salary template dropdown
    function loadSalaryTemplates() {
        const salaryTemplateSelect = document.getElementById('salaryTemplate');
        if (!salaryTemplateSelect) return;
        
        const roleConfigs = JSON.parse(localStorage.getItem('nexhr_roleConfigs')) || [];
        salaryTemplateSelect.innerHTML = '<option value="">-- Select Role Template or Define Custom --</option>';
        
        roleConfigs.forEach(config => {
            const option = document.createElement('option');
            option.value = config.roleName;
            // Show salary info in the option text
            const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
            const currencySymbol = settings.currency || 'RS';
            const baseSalary = config.baseSalary || 0;
            option.textContent = `${config.roleName} - ${currencySymbol} ${baseSalary.toLocaleString('en-US')} (HRA: ${config.hra || 0}%, PF: ${config.pf || 0}%)`;
            option.setAttribute('data-config', JSON.stringify(config));
            salaryTemplateSelect.appendChild(option);
        });
        
        // Add "Custom" option
        const customOption = document.createElement('option');
        customOption.value = '__custom__';
        customOption.textContent = '--- Define Custom Salary ---';
        salaryTemplateSelect.appendChild(customOption);
    }
    
    // Setup salary template selection handler
    function setupSalaryTemplateSelection() {
        const salaryTemplateSelect = document.getElementById('salaryTemplate');
        
        if (salaryTemplateSelect) {
            salaryTemplateSelect.addEventListener('change', (e) => {
                if (e.target.value === '__custom__') {
                    // Clear all salary fields for custom entry
                    document.getElementById('baseSalary').value = '';
                    document.getElementById('hra').value = 0;
                    document.getElementById('pf').value = 0;
                    document.getElementById('allowance').value = 0;
                    document.getElementById('baseSalary').focus();
                } else if (e.target.value) {
                    // Auto-populate salary fields from selected template
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    const configData = selectedOption.getAttribute('data-config');
                    if (configData) {
                        try {
                            const config = JSON.parse(configData);
                            document.getElementById('baseSalary').value = config.baseSalary || '';
                            document.getElementById('hra').value = config.hra || 0;
                            document.getElementById('pf').value = config.pf || 0;
                            document.getElementById('allowance').value = config.allowance || 0;
                            
                            // Show success message
                            if (typeof showToast === 'function') {
                                showToast(`Salary template "${config.roleName}" applied. You can edit the values if needed.`);
                            }
                        } catch(err) {
                            console.error('Error parsing salary template config:', err);
                        }
                    }
                }
            });
        }
    }
    
    // Auto-populate salary fields when role is selected
    function setupRoleSelection() {
        const roleSelect = document.getElementById('role');
        const customRoleInput = document.getElementById('customRole');
        
        if (roleSelect && customRoleInput) {
            roleSelect.addEventListener('change', (e) => {
                if (e.target.value === '__custom__') {
                    customRoleInput.style.display = 'block';
                    customRoleInput.value = '';
                    customRoleInput.focus();
                } else {
                    customRoleInput.style.display = 'none';
                    customRoleInput.value = '';
                    
                    // Don't auto-populate salary from role selection
                    // Salary must be explicitly defined via salary template dropdown or manual entry
                }
            });
            
            // Handle custom role input
            customRoleInput.addEventListener('input', (e) => {
                if (e.target.value) {
                    roleSelect.value = '__custom__';
                }
            });
        }
    }

    // Modal
    if (openModalBtn && addModal) {
        openModalBtn.addEventListener('click', () => {
            // Reset form
            const form = document.getElementById('addEmployeeForm');
            if (form) {
                form.reset();
                form.removeAttribute('data-edit-id');
                const modalTitle = addModal.querySelector('.modal-header h2');
                const submitBtn = form.querySelector('button[type="submit"]');
                if (modalTitle) modalTitle.innerText = 'Add New Employee';
                if (submitBtn) submitBtn.innerText = 'Add Employee';
                
                // Reset custom role input
                const customRoleInput = document.getElementById('customRole');
                if (customRoleInput) {
                    customRoleInput.style.display = 'none';
                    customRoleInput.value = '';
                }
            }
            
            // Load role configs
            loadRoleConfigs();
            
            // Load salary templates
            loadSalaryTemplates();
            
            // Clear all salary fields (no defaults)
            const baseSalaryInput = document.getElementById('baseSalary');
            const hraInput = document.getElementById('hra');
            const pfInput = document.getElementById('pf');
            const allowanceInput = document.getElementById('allowance');
            
            if (baseSalaryInput) baseSalaryInput.value = '';
            if (hraInput) hraInput.value = '';
            if (pfInput) pfInput.value = '';
            if (allowanceInput) allowanceInput.value = '';
            
            // Reset salary template dropdown
            const salaryTemplateSelect = document.getElementById('salaryTemplate');
            if (salaryTemplateSelect) {
                salaryTemplateSelect.value = '';
            }
            
            // Initialize Nepali date picker
            setTimeout(() => {
                initNepaliDatePicker();
            }, 100);
            
            addModal.classList.add('active');
        });
    }
    
    // Initialize role selection and salary templates on page load
    if (document.getElementById('role')) {
        loadRoleConfigs();
        setupRoleSelection();
    }
    
    if (document.getElementById('salaryTemplate')) {
        loadSalaryTemplates();
        setupSalaryTemplateSelection();
    }

    if (closeModalBtn && addModal) {
        closeModalBtn.addEventListener('click', () => {
            resetModal();
        });
    }

    if (addModal) {
        addModal.addEventListener('click', (e) => {
            if (e.target === addModal) {
                resetModal();
            }
        });
    }

    // Reset modal function
    function resetModal() {
        const addModal = document.getElementById('addEmployeeModal');
        const addForm = document.getElementById('addEmployeeForm');
        if (addModal && addForm) {
            addModal.classList.remove('active');
            addForm.reset();
            addForm.removeAttribute('data-edit-id');
            
            // Reset custom role input
            const customRoleInput = document.getElementById('customRole');
            if (customRoleInput) {
                customRoleInput.style.display = 'none';
                customRoleInput.value = '';
            }
            
            // Reset salary template dropdown
            const salaryTemplateSelect = document.getElementById('salaryTemplate');
            if (salaryTemplateSelect) {
                salaryTemplateSelect.value = '';
            }
            
            // Clear all salary fields (no defaults)
            const baseSalaryInput = document.getElementById('baseSalary');
            const hraInput = document.getElementById('hra');
            const pfInput = document.getElementById('pf');
            const allowanceInput = document.getElementById('allowance');
            
            if (baseSalaryInput) baseSalaryInput.value = '';
            if (hraInput) hraInput.value = '';
            if (pfInput) pfInput.value = '';
            if (allowanceInput) allowanceInput.value = '';
            
            // Reset modal title and button
            const modalTitle = addModal.querySelector('.modal-header h2');
            const submitBtn = addForm.querySelector('button[type="submit"]');
            if (modalTitle) modalTitle.innerText = 'Add New Employee';
            if (submitBtn) submitBtn.innerText = 'Add Employee';
        }
    }

    // Add/Edit Employee Form
    if (addForm) {
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Check admin permission
            const currentUser = JSON.parse(sessionStorage.getItem('nexhr_currentUser'));
            const isUserAdmin = currentUser && (
                currentUser.role === 'Admin' || 
                currentUser.role === 'admin' ||
                currentUser.username === 'admin' ||
                currentUser.username === 'Admin'
            );
            
            if (!isUserAdmin) {
                showToast('Access Denied: Only Administrators can add or edit employees.');
                return;
            }
            
            // Get form fields with null checks
            const nameInput = document.getElementById('fullName');
            const roleSelect = document.getElementById('role');
            const customRoleInput = document.getElementById('customRole');
            const deptSelect = document.getElementById('department');
            const joiningDateInput = document.getElementById('joiningDate');
            
            // Null checks
            if (!nameInput || !roleSelect || !deptSelect || !joiningDateInput) {
                showToast('Error: Form fields not found. Please refresh the page.');
                return;
            }
            
            const name = nameInput.value.trim();
            const dept = deptSelect.value;
            const joiningDate = joiningDateInput.value;
            
            // Validation
            if (!name || name.length < 2) {
                showToast('Please enter a valid employee name (at least 2 characters).');
                nameInput.focus();
                return;
            }
            
            if (!joiningDate) {
                showToast('Please select a joining date.');
                joiningDateInput.focus();
                return;
            }
            
            // Get role (from dropdown or custom input)
            let role = '';
            if (roleSelect && roleSelect.value === '__custom__' && customRoleInput) {
                role = customRoleInput.value.trim();
            } else if (roleSelect) {
                role = roleSelect.value;
            }
            
            if (!role) {
                showToast('Please select or enter a role.');
                return;
            }
            
            // Get salary fields - Base Salary is required
            const baseSalaryInput = document.getElementById('baseSalary');
            const hraInput = document.getElementById('hra');
            const pfInput = document.getElementById('pf');
            const allowanceInput = document.getElementById('allowance');
            
            // Null checks
            if (!baseSalaryInput) {
                showToast('Error: Base salary field not found. Please refresh the page.');
                return;
            }
            
            const baseSalaryValue = baseSalaryInput.value.trim();
            
            if (!baseSalaryValue || baseSalaryValue === '') {
                showToast('Please enter a base salary for the employee.');
                baseSalaryInput.focus();
                return;
            }
            
            const baseSalary = parseFloat(baseSalaryValue);
            if (isNaN(baseSalary) || baseSalary <= 0) {
                showToast('Base salary must be a valid positive number.');
                baseSalaryInput.focus();
                return;
            }
            
            // Other fields are optional, default to 0 if empty
            let hra = parseFloat(hraInput ? hraInput.value : 0) || 0;
            let pf = parseFloat(pfInput ? pfInput.value : 0) || 0;
            const allowance = parseFloat(allowanceInput ? allowanceInput.value : 0) || 0;
            
            // Validate percentages (0-100)
            if (hra < 0 || hra > 100) {
                showToast('HRA percentage must be between 0 and 100.');
                if (hraInput) hraInput.focus();
                return;
            }
            
            if (pf < 0 || pf > 100) {
                showToast('PF percentage must be between 0 and 100.');
                if (pfInput) pfInput.focus();
                return;
            }
            
            // Validate allowance (non-negative)
            if (allowance < 0) {
                showToast('Allowance cannot be negative.');
                if (allowanceInput) allowanceInput.focus();
                return;
            }
            
            // Calculate gross salary
            const hraAmount = (baseSalary * hra) / 100;
            const pfAmount = (baseSalary * pf) / 100;
            const grossSalary = baseSalary + hraAmount + allowance;
            const netSalary = grossSalary - pfAmount;
            
            const editId = addForm.getAttribute('data-edit-id');

            if (editId) {
                // Update existing employee
                const empIndex = employees.findIndex(e => e.id === parseInt(editId));
                if (empIndex !== -1) {
                    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                    employees[empIndex] = {
                        ...employees[empIndex],
                        name: name,
                        role: role,
                        dept: dept,
                        joiningDate: joiningDate,
                        avatar: initials,
                        baseSalary: baseSalary,
                        salary: baseSalary, // For backward compatibility
                        hra: hra,
                        pf: pf,
                        allowance: allowance,
                        grossSalary: grossSalary,
                        netSalary: netSalary
                    };
                    localStorage.setItem('nexhr_employees', JSON.stringify(employees));
                    renderTable(employees);
                    showToast(`${name} has been updated successfully.`);
                    
                    // Update dashboard stats if on dashboard
                    if (typeof updateDashboardStats === 'function') {
                        updateDashboardStats();
                    }
                }
            } else {
                // Create new employee
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                const maxId = employees.length > 0 ? Math.max(...employees.map(e => e.id || 0)) : 0;
                const newEmp = {
                    id: maxId + 1,
                    name: name,
                    role: role,
                    dept: dept,
                    joiningDate: joiningDate,
                    status: 'Active',
                    avatar: initials,
                    baseSalary: baseSalary,
                    salary: baseSalary, // For backward compatibility
                    hra: hra,
                    pf: pf,
                    allowance: allowance,
                    grossSalary: grossSalary,
                    netSalary: netSalary
                };

                employees.push(newEmp);
                localStorage.setItem('nexhr_employees', JSON.stringify(employees));
                renderTable(employees);
                showToast(`${name} has been added successfully.`);
                
                // Update dashboard stats if on dashboard
                if (typeof updateDashboardStats === 'function') {
                    updateDashboardStats();
                }
            }

            // Reset form and modal
            resetModal();
        });
    }

    // ---------------------------------------------------------
    // Role-Based Access Control (RBAC) Logic
    // ---------------------------------------------------------
    function checkRBAC() {
        // Skip on login page
        if (window.location.href.includes('login.html')) return;

        const currentUser = JSON.parse(sessionStorage.getItem('nexhr_currentUser'));

        // If not logged in, redirect to login (Simple Guard)
        if (!currentUser && !window.location.href.includes('index.html')) {
            // Uncomment to enforce login: window.location.href = '../app/login.html';
            return;
        }

        // Check if user is admin
        const isUserAdmin = currentUser && (
            currentUser.role === 'Admin' || 
            currentUser.role === 'admin' ||
            currentUser.username === 'admin' ||
            currentUser.username === 'Admin'
        );

        if (!isUserAdmin) {
            // RESTRICT ACCESS TO:
            // 1. Settings Page
            if (window.location.href.includes('settings.html')) {
                alert('Access Denied: Admins Only');
                window.location.href = 'dashboard.html';
                return;
            }
            // 2. Payroll Page
            if (window.location.href.includes('payroll.html')) {
                alert('Access Denied: Admins Only');
                window.location.href = 'dashboard.html';
                return;
            }
            // 3. Rules Page
            if (window.location.href.includes('rules.html')) {
                alert('Access Denied: Admins Only');
                window.location.href = 'dashboard.html';
                return;
            }

            // HIDE UI ELEMENTS
            // Sidebar Links: Employees (Manage), Payroll, Settings, Rules
            document.querySelectorAll('.sidebar-nav li a').forEach(link => {
                const text = link.innerText.trim();
                if (['Payroll', 'Settings', 'Employees', 'Rules & Perks'].includes(text)) {
                    link.parentElement.style.display = 'none';
                }
            });

            // Dashboard Buttons
            document.querySelectorAll('.action-btn').forEach(btn => btn.style.display = 'none');
            
            // Hide/disable all edit/add buttons
            document.querySelectorAll('button[onclick*="edit"], button[onclick*="add"], button[onclick*="Add"], .btn-primary:not(.action-btn)').forEach(btn => {
                if (btn.textContent.toLowerCase().includes('add') || 
                    btn.textContent.toLowerCase().includes('edit') ||
                    btn.textContent.toLowerCase().includes('save') ||
                    btn.textContent.toLowerCase().includes('create') ||
                    btn.textContent.toLowerCase().includes('update') ||
                    btn.textContent.toLowerCase().includes('delete')) {
                    btn.style.display = 'none';
                }
            });
        }

        // Update Profile Name if element exists
        const profileName = document.querySelector('.user-profile span');
        if (profileName && currentUser) {
            profileName.innerText = currentUser.username;
        }
    }

    checkRBAC();

    // ---------------------------------------------------------
    // Shared Logic (Sidebar & Login)
    // ---------------------------------------------------------

    // Login Form Handling
    // Login Form Handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password'); // Assume id="password" exists

            // For this mock, we treat email as username for simplicity or just check username part
            // Real app would separate them. Let's assume input id="email" is actually username for now or parse it.
            // But to match the Settings page "Username" field, let's treat the value as username.
            // But to match the Settings page "Username" field, let's treat the value as username.
            const username = emailInput.value.split('@')[0].trim().toLowerCase(); // Simple fallback if user enters email
            const password = passwordInput.value;

            // Loading state
            btn.innerText = 'Signing In...';
            btn.style.opacity = '0.7';

            // Check credentials
            const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
            const user = users.find(u => u.username === username && u.password === password);

            // Default Admin Backdoor (for safety during dev)
            if (username === 'admin' && password === 'admin') {
                sessionStorage.setItem('nexhr_currentUser', JSON.stringify({ username: 'admin', role: 'Admin' }));
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
                return;
            }

            if (user) {
                // Include employeeId in session if available
                const userSession = { ...user };
                if (user.employeeId) {
                    userSession.employeeId = user.employeeId;
                } else {
                    // Try to find employee ID from users table (in case it's stored there)
                    const allUsers = JSON.parse(localStorage.getItem('nexhr_users')) || [];
                    const userWithEmpId = allUsers.find(u => u.username === user.username && u.employeeId);
                    if (userWithEmpId && userWithEmpId.employeeId) {
                        userSession.employeeId = userWithEmpId.employeeId;
                    }
                }
                sessionStorage.setItem('nexhr_currentUser', JSON.stringify(userSession));
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                btn.innerText = 'Sign In';
                btn.style.opacity = '1';
                if (typeof showToast === 'function') showToast('Invalid credentials!');
                else alert('Invalid credentials! Try admin/admin or create a user in Settings.');
            }
        });
    }

    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('active');
                if (sidebar.style.display === 'none' || sidebar.style.display === '') {
                    sidebar.style.display = 'flex';
                    sidebar.style.position = 'absolute';
                    sidebar.style.height = '100%';
                    sidebar.style.zIndex = '100';
                } else {
                    sidebar.style.display = 'none';
                }
            } else {
                console.log('Toggle sidebar');
            }
        });
    }

    // ---------------------------------------------------------
    // Dashboard Stats (Dynamic)
    // ---------------------------------------------------------
    function updateDashboardStats() {
        // Update Total Employees
        const totalEmpEl = document.getElementById('statTotalEmployees');
        if (totalEmpEl) {
            const totalEmployees = employees.length;
            totalEmpEl.innerText = totalEmployees;
            const trendEl = totalEmpEl.nextElementSibling;
            if (trendEl && totalEmployees > 0) {
                trendEl.innerHTML = '<i class="fas fa-check"></i> Active employees';
                trendEl.className = 'stat-trend positive';
            }
        }

        // Update On Leave Today
        const onLeaveEl = document.getElementById('statOnLeave');
        if (onLeaveEl) {
            const leaves = JSON.parse(localStorage.getItem('nexhr_leaves')) || [];
            const today = new Date().toISOString().split('T')[0];
            const onLeaveToday = leaves.filter(l => 
                l.status === 'Approved' && 
                l.start <= today && 
                l.end >= today
            ).length;
            onLeaveEl.innerText = onLeaveToday;
        }

        // Update New Hires (employees added in last 7 days - mock logic)
        const newHiresEl = document.getElementById('statNewHires');
        if (newHiresEl) {
            // Since we don't track creation date, show 0
            newHiresEl.innerText = '0';
        }

        // Update Pending Tasks (pending leave requests)
        const pendingTasksEl = document.getElementById('statPendingTasks');
        if (pendingTasksEl) {
            const leaves = JSON.parse(localStorage.getItem('nexhr_leaves')) || [];
            // Case-insensitive check for pending status
            const pendingLeaves = leaves.filter(l => {
                const status = (l.status || 'Pending').toString().toLowerCase();
                return status === 'pending';
            }).length;
            pendingTasksEl.innerText = pendingLeaves;
            
            // Update trend text
            const trendEl = pendingTasksEl.nextElementSibling;
            if (trendEl) {
                if (pendingLeaves > 0) {
                    trendEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${pendingLeaves} leave request${pendingLeaves !== 1 ? 's' : ''} pending`;
                    trendEl.className = 'stat-trend warning';
                } else {
                    trendEl.innerHTML = '<i class="fas fa-check"></i> No pending tasks';
                    trendEl.className = 'stat-trend positive';
                }
            }
        }

        // Update Recent Activity
        const activityList = document.getElementById('recentActivityList');
        if (activityList) {
            const leaves = JSON.parse(localStorage.getItem('nexhr_leaves')) || [];
            const recentLeaves = leaves
                .filter(l => l.status === 'Pending')
                .slice(0, 3);
            
            if (recentLeaves.length === 0) {
                activityList.innerHTML = '<li style="text-align: center; padding: 2rem; color: var(--text-dim);"><p>No recent activity</p></li>';
            } else {
                activityList.innerHTML = recentLeaves.map(leave => `
                    <li>
                        <div class="activity-icon bg-purple"><i class="fas fa-umbrella-beach"></i></div>
                        <div class="activity-details">
                            <h4>${leave.name} requested ${leave.type} leave</h4>
                            <p>${leave.start} to ${leave.end}</p>
                        </div>
                    </li>
                `).join('');
            }
        }
    }

    // Update dashboard stats on load
    if (window.location.href.includes('dashboard.html')) {
        updateDashboardStats();
        // Also update periodically to catch changes from other tabs
        setInterval(updateDashboardStats, 5000); // Update every 5 seconds
    }

    // ---------------------------------------------------------
    // Quick Actions (Dashboard)
    // ---------------------------------------------------------
    const qaAddEmp = document.getElementById('qa-add-employee');
    const qaPayroll = document.getElementById('qa-run-payroll');
    const qaLeave = document.getElementById('qa-approve-leave');
    const qaJob = document.getElementById('qa-post-job');

    if (qaAddEmp) {
        qaAddEmp.addEventListener('click', () => {
            window.location.href = 'employees.html';
        });
    }

    if (qaPayroll) {
        qaPayroll.addEventListener('click', () => {
            window.location.href = 'payroll.html';
        });
    }

    if (qaLeave) {
        qaLeave.addEventListener('click', () => {
            window.location.href = 'leave.html';
        });
    }

    if (qaJob) {
        qaJob.addEventListener('click', () => {
            alert('Recruitment Module is coming soon!');
        });
    }

    // ---------------------------------------------------------
    // Toast Notification System
    // ---------------------------------------------------------
    function showToast(message) {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.innerText = message;
        toast.className = 'toast show';

        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    }

    // ---------------------------------------------------------
    // Global Interactions & Placeholders
    // ---------------------------------------------------------

    // Handle all href="#" links
    // Handle all href="#" links
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const text = link.innerText.trim();

            // Special handling for Settings - allow it to work via main.js redirection if not updated in HTML
            if (text === 'Settings') {
                e.preventDefault();
                window.location.href = 'settings.html';
                return;
            }

            e.preventDefault();
            if (text === 'View All') {
                showToast('Viewing all recent activity... (Mock Action)');
            } else if (text === 'Forgot password?') {
                showToast('Password reset link sent to your email (Mock).');
            } else if (text === 'Contact Sales') {
                showToast('Thank you! Our sales team will contact you shortly.');
            } else {
                showToast('Feature coming soon!');
            }
        });
    });

    // Dashboard Header Search (Mock)
    if (headerSearch) {
        headerSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                showToast(`Searching for: "${headerSearch.value}" ...`);
            }
        });
    }
    if (headerSearchIcon) {
        headerSearchIcon.addEventListener('click', () => {
            showToast('Search bar focused (Mock Search)');
        });
    }

    // Notifications
    if (headerNotifications) {
        headerNotifications.addEventListener('click', () => {
            // Simple hack to show multiple lines in one toast for now
            showToast('3 New Notifications: Payroll, Leave, System Update');
        });
    }

    // Profile
    if (headerProfile) {
        headerProfile.style.cursor = 'pointer';
        headerProfile.addEventListener('click', () => {
            const logout = confirm('Admin User Profile\n\nDo you want to logout?');
            if (logout) {
                window.location.href = 'login.html';
            }
        });
    }

    // Employee Table Actions (Delegation)
    if (tableBody) {
        // Close all menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.action-menu-container') && !e.target.closest('.action-menu')) {
                document.querySelectorAll('.action-menu').forEach(menu => {
                    menu.style.display = 'none';
                    menu.style.top = '';
                    menu.style.right = '';
                });
            }
        });

        tableBody.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('.action-menu-btn');
            const editBtn = e.target.closest('.edit-emp');
            const deleteBtn = e.target.closest('.delete-emp');

            // Toggle action menu
            if (actionBtn) {
                e.stopPropagation();
                const empId = parseInt(actionBtn.getAttribute('data-emp-id'));
                const menu = document.querySelector(`.action-menu[data-emp-id="${empId}"]`);
                
                // Close all other menus
                document.querySelectorAll('.action-menu').forEach(m => {
                    if (m !== menu) {
                        m.style.display = 'none';
                        m.style.top = '';
                        m.style.right = '';
                    }
                });
                
                // Toggle current menu
                if (menu) {
                    if (menu.style.display === 'none' || !menu.style.display) {
                        // Calculate position
                        const rect = actionBtn.getBoundingClientRect();
                        menu.style.display = 'block';
                        menu.style.top = (rect.bottom + 4) + 'px';
                        menu.style.right = (window.innerWidth - rect.right) + 'px';
                    } else {
                        menu.style.display = 'none';
                        menu.style.top = '';
                        menu.style.right = '';
                    }
                }
            }

            // Edit employee
            if (editBtn) {
                e.stopPropagation();
                const empId = parseInt(editBtn.getAttribute('data-emp-id'));
                const menu = document.querySelector(`.action-menu[data-emp-id="${empId}"]`);
                if (menu) {
                    menu.style.display = 'none';
                    menu.style.top = '';
                    menu.style.right = '';
                }
                editEmployee(empId);
            }

            // Delete employee
            if (deleteBtn) {
                e.stopPropagation();
                const empId = parseInt(deleteBtn.getAttribute('data-emp-id'));
                const menu = document.querySelector(`.action-menu[data-emp-id="${empId}"]`);
                if (menu) {
                    menu.style.display = 'none';
                    menu.style.top = '';
                    menu.style.right = '';
                }
                deleteEmployee(empId);
            }
        });
    }

    // Edit Employee Function
    function editEmployee(empId) {
        // Check admin permission
        const currentUser = JSON.parse(sessionStorage.getItem('nexhr_currentUser'));
        const isUserAdmin = currentUser && (
            currentUser.role === 'Admin' || 
            currentUser.role === 'admin' ||
            currentUser.username === 'admin' ||
            currentUser.username === 'Admin'
        );
        
        if (!isUserAdmin) {
            if (typeof showToast === 'function') {
                showToast('Access Denied: Only Administrators can edit employees.');
            } else {
                alert('Access Denied: Only Administrators can edit employees.');
            }
            return;
        }
        
        const emp = employees.find(e => e.id === empId);
        if (!emp) return;

        // Close action menu
        document.querySelectorAll('.action-menu').forEach(m => m.style.display = 'none');

        // Load role configs and salary templates first
        loadRoleConfigs();
        loadSalaryTemplates();

        // Populate form with employee data
        document.getElementById('fullName').value = emp.name;
        document.getElementById('department').value = emp.dept;
        
        // Set role (check if it exists in role configs, otherwise use custom)
        const roleSelect = document.getElementById('role');
        const customRoleInput = document.getElementById('customRole');
        const roleConfigs = JSON.parse(localStorage.getItem('nexhr_roleConfigs')) || [];
        const roleExists = roleConfigs.some(config => config.roleName === emp.role);
        
        if (roleExists && roleSelect) {
            roleSelect.value = emp.role;
            if (customRoleInput) customRoleInput.style.display = 'none';
        } else {
            if (roleSelect) roleSelect.value = '__custom__';
            if (customRoleInput) {
                customRoleInput.style.display = 'block';
                customRoleInput.value = emp.role;
            }
        }
        
        // Set salary template dropdown (try to match with existing role config, otherwise set to custom)
        const salaryTemplateSelect = document.getElementById('salaryTemplate');
        if (salaryTemplateSelect) {
            // Check if employee's salary matches any role config
            const matchingConfig = roleConfigs.find(config => {
                return config.roleName === emp.role &&
                       Math.abs((config.baseSalary || 0) - (emp.baseSalary || emp.salary || 0)) < 1 &&
                       Math.abs((config.hra || 0) - (emp.hra || 0)) < 1 &&
                       Math.abs((config.pf || 0) - (emp.pf || 0)) < 1 &&
                       Math.abs((config.allowance || 0) - (emp.allowance || 0)) < 1;
            });
            
            if (matchingConfig) {
                salaryTemplateSelect.value = matchingConfig.roleName;
            } else {
                salaryTemplateSelect.value = '__custom__';
            }
        }
        
        // Populate salary fields
        document.getElementById('baseSalary').value = emp.baseSalary || emp.salary || 0;
        document.getElementById('hra').value = emp.hra || 0;
        document.getElementById('pf').value = emp.pf || 0;
        document.getElementById('allowance').value = emp.allowance || 0;
        
        // Set Nepali date
        const joiningDateInput = document.getElementById('joiningDate');
        if (joiningDateInput && emp.joiningDate) {
            joiningDateInput.value = emp.joiningDate;
        }

        // Change modal title and button
        const modal = document.getElementById('addEmployeeModal');
        const modalTitle = modal.querySelector('.modal-header h2');
        const submitBtn = modal.querySelector('button[type="submit"]');
        const form = document.getElementById('addEmployeeForm');

        modalTitle.innerText = 'Edit Employee';
        submitBtn.innerText = 'Update Employee';
        
        // Store employee ID for update
        form.setAttribute('data-edit-id', empId);

        // Open modal
        modal.classList.add('active');
        
        // Initialize Nepali date picker with existing date
        setTimeout(() => {
            initNepaliDatePicker();
            if (emp.joiningDate) {
                joiningDateInput.value = emp.joiningDate;
            }
        }, 100);
    }

    // Delete Employee Function
    function deleteEmployee(empId) {
        // Check admin permission
        const currentUser = JSON.parse(sessionStorage.getItem('nexhr_currentUser'));
        const isUserAdmin = currentUser && (
            currentUser.role === 'Admin' || 
            currentUser.role === 'admin' ||
            currentUser.username === 'admin' ||
            currentUser.username === 'Admin'
        );
        
        if (!isUserAdmin) {
            if (typeof showToast === 'function') {
                showToast('Access Denied: Only Administrators can delete employees.');
            } else {
                alert('Access Denied: Only Administrators can delete employees.');
            }
            return;
        }
        
        const emp = employees.find(e => e.id === empId);
        if (!emp) return;

        if (confirm(`Are you sure you want to delete ${emp.name}? This action cannot be undone.`)) {
            employees = employees.filter(e => e.id !== empId);
            localStorage.setItem('nexhr_employees', JSON.stringify(employees));
            renderTable(employees);
            showToast(`${emp.name} has been deleted.`);
            
            // Update dashboard stats if on dashboard
            if (typeof updateDashboardStats === 'function') {
                updateDashboardStats();
            }
        }
    }

    // Quick Actions (Dashboard)
    if (qaJob) {
        qaJob.addEventListener('click', () => {
            showToast('Recruitment Module is coming soon!');
        });
    }
});
