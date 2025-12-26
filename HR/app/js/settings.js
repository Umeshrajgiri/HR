document.addEventListener('DOMContentLoaded', () => {
    // Check admin permission for settings page
    const currentUser = JSON.parse(sessionStorage.getItem('nexhr_currentUser'));
    const isUserAdmin = currentUser && (
        currentUser.role === 'Admin' || 
        currentUser.role === 'admin' ||
        currentUser.username === 'admin' ||
        currentUser.username === 'Admin'
    );
    
    if (!isUserAdmin) {
        alert('Access Denied: Only Administrators can access Settings.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // --- Selectors ---
    const form = document.getElementById('settingsForm');
    const companyNameInput = document.getElementById('companyName');
    const prefixInput = document.getElementById('staffIdPrefix');
    const taxInput = document.getElementById('taxRate');
    const currencyInput = document.getElementById('currency');

    // --- Load Settings ---
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};

        if (settings.companyName) companyNameInput.value = settings.companyName;
        if (settings.staffIdPrefix) prefixInput.value = settings.staffIdPrefix;
        if (settings.taxRate) taxInput.value = settings.taxRate;
        // Set default to RS if no currency is set
        if (settings.currency) {
            currencyInput.value = settings.currency;
        } else {
            currencyInput.value = 'RS';
            // Save default currency
            const newSettings = {
                ...settings,
                currency: 'RS'
            };
            localStorage.setItem('nexhr_settings', JSON.stringify(newSettings));
        }
    }

    // --- Save Settings ---
    function saveSettings(e) {
        e.preventDefault();

        // 1. Check for pending User Add
        const username = newUsername.value.trim();
        const password = newPassword.value.trim();
        const role = newRole.value;

        if (username && password) {
            const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
            users.push({ username, password, role });
            localStorage.setItem('nexhr_users', JSON.stringify(users));

            // Clear inputs
            newUsername.value = '';
            newPassword.value = '';
            loadUsers();

            if (typeof showToast === 'function') showToast(`User ${username} added and settings saved!`);
        } else if (username || password) {
            // Partial input warning
            if (typeof showToast === 'function') showToast('Warning: Incomplete user details ignored.');
        }

        // 2. Save General Settings
        const newSettings = {
            companyName: companyNameInput.value,
            staffIdPrefix: prefixInput.value,
            taxRate: taxInput.value,
            currency: currencyInput.value || 'RS' // Default to RS
        };

        localStorage.setItem('nexhr_settings', JSON.stringify(newSettings));

        // Use the global toast function from main.js if available
        if (typeof showToast === 'function') {
            // Only show if we didn't already show the "User added" message
            if (!username || !password) showToast('Settings Saved Successfully!');
        } else {
            alert('Settings Saved Successfully!');
        }
    }

    // --- User Management Logic ---
    const addUserBtn = document.getElementById('addUserBtn');
    const userList = document.getElementById('userList');
    const newUsername = document.getElementById('newUsername');
    const newPassword = document.getElementById('newPassword');
    const newRole = document.getElementById('newRole');

    function loadUsers() {
        const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
        userList.innerHTML = '';
        users.forEach((user, index) => {
            const li = document.createElement('li');
            li.style.cssText = 'padding: 0.8rem; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; background: #f9fafb;';
            li.innerHTML = `
                <div>
                    <span style="font-weight: 600; color: var(--text-light); margin-right: 0.5rem;">${user.username}</span>
                    <span style="background: ${user.role === 'Admin' ? 'var(--primary)' : 'var(--secondary)'}; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${user.role}</span>
                </div>
                <button onclick="deleteUser(${index})" style="background: none; border: none; color: var(--danger); cursor: pointer;"><i class="fas fa-trash"></i></button>
            `;
            userList.appendChild(li);
        });
    }

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            if (!isUserAdmin) {
                if (typeof showToast === 'function') showToast('Access Denied: Only Administrators can add users.');
                else alert('Access Denied: Only Administrators can add users.');
                return;
            }
            
            const username = newUsername.value.trim();
            const password = newPassword.value.trim();
            const role = newRole.value;

            if (!username || !password) {
                if (typeof showToast === 'function') showToast('Please enter both username and password.');
                else alert('Please enter both username and password.');
                return;
            }

            const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
            users.push({ username, password, role }); // In real app, hash password!
            localStorage.setItem('nexhr_users', JSON.stringify(users));

            newUsername.value = '';
            newPassword.value = '';
            loadUsers();
            if (typeof showToast === 'function') showToast(`User ${username} added!`);
        });
    }

    // Expose deleteUser globally properly
    window.deleteUser = function (index) {
        if (!isUserAdmin) {
            if (typeof showToast === 'function') showToast('Access Denied: Only Administrators can delete users.');
            else alert('Access Denied: Only Administrators can delete users.');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
        users.splice(index, 1);
        localStorage.setItem('nexhr_users', JSON.stringify(users));
        loadUsers();
        if (typeof showToast === 'function') showToast('User removed.');
    };

    // --- Role-wise Salary & Benefits Management ---
    const addRoleConfigBtn = document.getElementById('addRoleConfigBtn');
    const roleConfigList = document.getElementById('roleConfigList');
    const roleNameInput = document.getElementById('roleName');
    const roleBaseSalaryInput = document.getElementById('roleBaseSalary');
    const roleHRAInput = document.getElementById('roleHRA');
    const roleAllowanceInput = document.getElementById('roleAllowance');
    const rolePFInput = document.getElementById('rolePF');

    function loadRoleConfigs() {
        const roleConfigs = JSON.parse(localStorage.getItem('nexhr_roleConfigs')) || [];
        roleConfigList.innerHTML = '';

        // Update count
        const countElement = document.getElementById('roleConfigCount');
        if (countElement) {
            countElement.textContent = roleConfigs.length;
        }

        if (roleConfigs.length === 0) {
            roleConfigList.innerHTML = `
                <div class="role-config-empty">
                    <i class="fas fa-briefcase"></i>
                    <p>No role configurations added yet</p>
                    <small>Add your first role configuration above to get started</small>
                </div>
            `;
            return;
        }

        roleConfigs.forEach((config, index) => {
            const configCard = document.createElement('div');
            configCard.className = 'role-config-card';
            configCard.innerHTML = `
                <div class="role-config-header">
                    <div class="role-config-title">
                        <i class="fas fa-briefcase"></i>
                        <span>${config.roleName}</span>
                    </div>
                    <div class="role-config-actions">
                        <button onclick="editRoleConfig(${index})" class="role-config-btn role-config-btn-edit">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="deleteRoleConfig(${index})" class="role-config-btn role-config-btn-delete">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="role-config-details">
                    <div class="role-config-detail-item">
                        <div class="role-config-detail-label">
                            <i class="fas fa-coins"></i> Base Salary
                        </div>
                        <div class="role-config-detail-value">
                            ${formatNepaliCurrency(config.baseSalary || 0)}
                        </div>
                    </div>
                    <div class="role-config-detail-item">
                        <div class="role-config-detail-label">
                            <i class="fas fa-home"></i> HRA
                        </div>
                        <div class="role-config-detail-value">
                            ${config.hra || 0}%
                        </div>
                    </div>
                    <div class="role-config-detail-item">
                        <div class="role-config-detail-label">
                            <i class="fas fa-money-bill-wave"></i> Allowance
                        </div>
                        <div class="role-config-detail-value">
                            ${formatNepaliCurrency(config.allowance || 0)}
                        </div>
                    </div>
                    <div class="role-config-detail-item">
                        <div class="role-config-detail-label">
                            <i class="fas fa-piggy-bank"></i> Provident Fund
                        </div>
                        <div class="role-config-detail-value">
                            ${config.pf || 0}%
                        </div>
                    </div>
                </div>
                <div class="role-config-gross">
                    <div class="role-config-gross-label">Estimated Gross Salary</div>
                    <div class="role-config-gross-value">
                        <i class="fas fa-calculator"></i>
                        ${formatNepaliCurrency(calculateGrossSalary(config))}
                    </div>
                </div>
            `;
            roleConfigList.appendChild(configCard);
        });
    }

    function getCurrencySymbol() {
        const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
        return settings.currency || 'RS';
    }
    
    function formatNepaliCurrency(amount) {
        const symbol = getCurrencySymbol();
        // Format currency
        if (symbol === 'RS') {
            return `${symbol} ${parseFloat(amount).toLocaleString('en-US')}`;
        }
        return `${symbol}${parseFloat(amount).toLocaleString('en-US')}`;
    }

    function calculateGrossSalary(config) {
        const base = parseFloat(config.baseSalary || 0);
        const hra = parseFloat(config.hra || 0) / 100;
        const allowance = parseFloat(config.allowance || 0);
        return Math.round(base + (base * hra) + allowance);
    }

    function addRoleConfig() {
        // Null checks
        if (!roleNameInput || !roleBaseSalaryInput || !roleHRAInput || !roleAllowanceInput || !rolePFInput) {
            if (typeof showToast === 'function') {
                showToast('Error: Form fields not found. Please refresh the page.');
            } else {
                alert('Error: Form fields not found. Please refresh the page.');
            }
            return;
        }
        
        const roleName = roleNameInput.value.trim();
        const baseSalaryValue = roleBaseSalaryInput.value.trim();
        const hraValue = roleHRAInput.value.trim();
        const allowanceValue = roleAllowanceInput.value.trim();
        const pfValue = rolePFInput.value.trim();

        // Validation
        if (!roleName || roleName.length < 2) {
            if (typeof showToast === 'function') {
                showToast('Role name must be at least 2 characters long!');
            } else {
                alert('Role name must be at least 2 characters long!');
            }
            roleNameInput.focus();
            return;
        }
        
        if (!baseSalaryValue) {
            if (typeof showToast === 'function') {
                showToast('Base salary is required!');
            } else {
                alert('Base salary is required!');
            }
            roleBaseSalaryInput.focus();
            return;
        }
        
        const baseSalary = parseFloat(baseSalaryValue);
        if (isNaN(baseSalary) || baseSalary <= 0) {
            if (typeof showToast === 'function') {
                showToast('Base salary must be a valid positive number!');
            } else {
                alert('Base salary must be a valid positive number!');
            }
            roleBaseSalaryInput.focus();
            return;
        }
        
        let hra = parseFloat(hraValue) || 0;
        let pf = parseFloat(pfValue) || 0;
        const allowance = parseFloat(allowanceValue) || 0;
        
        // Validate percentages (0-100)
        if (hra < 0 || hra > 100) {
            if (typeof showToast === 'function') {
                showToast('HRA percentage must be between 0 and 100!');
            } else {
                alert('HRA percentage must be between 0 and 100!');
            }
            roleHRAInput.focus();
            return;
        }
        
        if (pf < 0 || pf > 100) {
            if (typeof showToast === 'function') {
                showToast('PF percentage must be between 0 and 100!');
            } else {
                alert('PF percentage must be between 0 and 100!');
            }
            rolePFInput.focus();
            return;
        }
        
        // Validate allowance (non-negative)
        if (allowance < 0) {
            if (typeof showToast === 'function') {
                showToast('Allowance cannot be negative!');
            } else {
                alert('Allowance cannot be negative!');
            }
            roleAllowanceInput.focus();
            return;
        }
        
        const roleConfigs = JSON.parse(localStorage.getItem('nexhr_roleConfigs')) || [];
        
        // Check if role already exists (only if not editing)
        if (!isEditingRole) {
            const existingIndex = roleConfigs.findIndex(c => c.roleName.toLowerCase() === roleName.toLowerCase());
            if (existingIndex !== -1) {
                if (typeof showToast === 'function') {
                    showToast('Role configuration already exists. Please edit the existing one.');
                } else {
                    alert('Role configuration already exists. Please edit the existing one.');
                }
                roleNameInput.focus();
                return;
            }
        }

        const newConfig = {
            roleName: roleName,
            baseSalary: parseFloat(baseSalary) || 0,
            hra: parseFloat(hra) || 0,
            allowance: parseFloat(allowance) || 0,
            pf: parseFloat(pf) || 0
        };

        roleConfigs.push(newConfig);
        localStorage.setItem('nexhr_roleConfigs', JSON.stringify(roleConfigs));

        // Clear inputs
        roleNameInput.value = '';
        roleBaseSalaryInput.value = '';
        roleHRAInput.value = '';
        roleAllowanceInput.value = '';
        rolePFInput.value = '';

        loadRoleConfigs();
        if (typeof showToast === 'function') {
            showToast(`Role configuration for "${roleName}" added successfully!`);
        }
    }

    window.editRoleConfig = function(index) {
        if (!isUserAdmin) {
            if (typeof showToast === 'function') showToast('Access Denied: Only Administrators can edit role configurations.');
            else alert('Access Denied: Only Administrators can edit role configurations.');
            return;
        }
        
        const roleConfigs = JSON.parse(localStorage.getItem('nexhr_roleConfigs')) || [];
        const config = roleConfigs[index];
        
        if (!config) return;

        // Populate form
        roleNameInput.value = config.roleName;
        roleBaseSalaryInput.value = config.baseSalary;
        roleHRAInput.value = config.hra;
        roleAllowanceInput.value = config.allowance;
        rolePFInput.value = config.pf;

        // Remove old config
        roleConfigs.splice(index, 1);
        localStorage.setItem('nexhr_roleConfigs', JSON.stringify(roleConfigs));

        // Update button to show it's in edit mode
        const btnText = document.getElementById('addRoleConfigBtnText');
        if (btnText) {
            btnText.textContent = 'Update Role Configuration';
        }
        addRoleConfigBtn.querySelector('i').className = 'fas fa-save';
        addRoleConfigBtn.setAttribute('data-edit-index', index);

        // Scroll to form
        roleNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        roleNameInput.focus();
    };

    window.deleteRoleConfig = function(index) {
        if (!isUserAdmin) {
            if (typeof showToast === 'function') showToast('Access Denied: Only Administrators can delete role configurations.');
            else alert('Access Denied: Only Administrators can delete role configurations.');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this role configuration?')) {
            return;
        }

        const roleConfigs = JSON.parse(localStorage.getItem('nexhr_roleConfigs')) || [];
        const deletedRole = roleConfigs[index].roleName;
        roleConfigs.splice(index, 1);
        localStorage.setItem('nexhr_roleConfigs', JSON.stringify(roleConfigs));

        loadRoleConfigs();
        if (typeof showToast === 'function') {
            showToast(`Role configuration for "${deletedRole}" deleted.`);
        }
    };

    if (addRoleConfigBtn) {
        addRoleConfigBtn.addEventListener('click', () => {
            const editIndex = addRoleConfigBtn.getAttribute('data-edit-index');
            
            if (editIndex !== null) {
                // Update existing config
                const roleConfigs = JSON.parse(localStorage.getItem('nexhr_roleConfigs')) || [];
                const roleName = roleNameInput.value.trim();
                const baseSalary = roleBaseSalaryInput.value;
                const hra = roleHRAInput.value;
                const allowance = roleAllowanceInput.value;
                const pf = rolePFInput.value;

                if (!roleName || !baseSalary) {
                    if (typeof showToast === 'function') {
                        showToast('Please enter role name and base salary.');
                    }
                    return;
                }

                const updatedConfig = {
                    roleName: roleName,
                    baseSalary: parseFloat(baseSalary) || 0,
                    hra: parseFloat(hra) || 0,
                    allowance: parseFloat(allowance) || 0,
                    pf: parseFloat(pf) || 0
                };

                roleConfigs.push(updatedConfig);
                localStorage.setItem('nexhr_roleConfigs', JSON.stringify(roleConfigs));

                // Reset form
                roleNameInput.value = '';
                roleBaseSalaryInput.value = '';
                roleHRAInput.value = '';
                roleAllowanceInput.value = '';
                rolePFInput.value = '';
                const btnText = document.getElementById('addRoleConfigBtnText');
                if (btnText) {
                    btnText.textContent = 'Add Role Configuration';
                }
                addRoleConfigBtn.querySelector('i').className = 'fas fa-plus';
                addRoleConfigBtn.removeAttribute('data-edit-index');

                loadRoleConfigs();
                if (typeof showToast === 'function') {
                    showToast(`Role configuration for "${roleName}" updated successfully!`);
                }
            } else {
                // Add new config
                addRoleConfig();
            }
        });
    }

    // --- Employee Management ---
    const selectDeptForEdit = document.getElementById('selectDeptForEdit');
    const selectEmployeeForEdit = document.getElementById('selectEmployeeForEdit');
    const employeeSelectContainer = document.getElementById('employeeSelectContainer');
    const employeeEditFormContainer = document.getElementById('employeeEditFormContainer');
    const employeeEditForm = document.getElementById('employeeEditForm');
    const employeeEmptyState = document.getElementById('employeeEmptyState');
    
    // Load unique departments from employees
    function loadDepartmentsForEdit() {
        if (!selectDeptForEdit) {
            console.warn('selectDeptForEdit element not found');
            return;
        }
        
        try {
            const employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
            
            if (employees.length === 0) {
                if (employeeEmptyState) employeeEmptyState.style.display = 'block';
                if (selectDeptForEdit) {
                    selectDeptForEdit.innerHTML = '<option value="">-- Select Department --</option>';
                }
                return;
            }
            
            if (employeeEmptyState) employeeEmptyState.style.display = 'none';
            
            // Get unique departments
            const departments = [...new Set(employees.map(emp => emp.dept).filter(dept => dept && dept.trim()))];
            departments.sort();
            
            selectDeptForEdit.innerHTML = '<option value="">-- Select Department --</option>';
            if (departments.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No departments available';
                option.disabled = true;
                selectDeptForEdit.appendChild(option);
            } else {
                departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept;
                    option.textContent = dept;
                    selectDeptForEdit.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading departments:', error);
            if (typeof showToast === 'function') {
                showToast('Error loading departments. Please refresh the page.');
            }
        }
    }
    
    // Load employees for selected department
    function loadEmployeesForDept(selectedDept) {
        if (!selectEmployeeForEdit) {
            console.warn('selectEmployeeForEdit element not found');
            return;
        }
        
        if (!selectedDept || selectedDept.trim() === '') {
            if (employeeSelectContainer) employeeSelectContainer.style.display = 'none';
            if (employeeEditFormContainer) employeeEditFormContainer.style.display = 'none';
            return;
        }
        
        try {
            const employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
            const filteredEmployees = employees.filter(emp => emp.dept === selectedDept);
            
            selectEmployeeForEdit.innerHTML = '<option value="">-- Select Employee --</option>';
            
            if (filteredEmployees.length === 0) {
                if (employeeSelectContainer) employeeSelectContainer.style.display = 'none';
                if (employeeEditFormContainer) employeeEditFormContainer.style.display = 'none';
                if (typeof showToast === 'function') {
                    showToast('No employees found in this department.');
                }
                return;
            }
            
            filteredEmployees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = `${emp.name || 'Unknown'} (${emp.role || 'N/A'})`;
                selectEmployeeForEdit.appendChild(option);
            });
            
            if (employeeSelectContainer) employeeSelectContainer.style.display = 'block';
        } catch (error) {
            console.error('Error loading employees for department:', error);
            if (typeof showToast === 'function') {
                showToast('Error loading employees. Please try again.');
            }
        }
    }
    
    // Load employee edit form
    function loadEmployeeEditForm(empId) {
        if (!employeeEditForm || !employeeEditFormContainer) return;
        
        const employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
        const emp = employees.find(e => e.id === parseInt(empId));
        
        if (!emp) {
            if (typeof showToast === 'function') showToast('Employee not found!');
            return;
        }
        
        const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
        const currencySymbol = settings.currency || 'RS';
        
        const baseSalary = emp.baseSalary || emp.salary || 0;
        const hra = emp.hra || 0;
        const pf = emp.pf || 0;
        const allowance = emp.allowance || 0;
        
        employeeEditForm.innerHTML = `
            <div class="employee-edit-grid">
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem;">Name <span style="color: var(--primary);">*</span></label>
                    <input type="text" id="edit-name-${emp.id}" value="${emp.name}" 
                        style="width: 100%; padding: 0.7rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem;">Role</label>
                    <input type="text" id="edit-role-${emp.id}" value="${emp.role || ''}" 
                        style="width: 100%; padding: 0.7rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem;">Department</label>
                    <select id="edit-dept-${emp.id}" 
                        style="width: 100%; padding: 0.7rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem;">
                        <option value="Engineering" ${emp.dept === 'Engineering' ? 'selected' : ''}>Engineering</option>
                        <option value="Operations" ${emp.dept === 'Operations' ? 'selected' : ''}>Operations</option>
                        <option value="Marketing" ${emp.dept === 'Marketing' ? 'selected' : ''}>Marketing</option>
                        <option value="HR" ${emp.dept === 'HR' ? 'selected' : ''}>HR</option>
                        <option value="Finance" ${emp.dept === 'Finance' ? 'selected' : ''}>Finance</option>
                        <option value="Sales" ${emp.dept === 'Sales' ? 'selected' : ''}>Sales</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem;">Base Salary (${currencySymbol}) <span style="color: var(--primary);">*</span></label>
                    <input type="number" id="edit-salary-${emp.id}" value="${baseSalary}" min="0" 
                        style="width: 100%; padding: 0.7rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem;">HRA (%)</label>
                    <input type="number" id="edit-hra-${emp.id}" value="${hra}" min="0" max="100" 
                        style="width: 100%; padding: 0.7rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem;">PF (%)</label>
                    <input type="number" id="edit-pf-${emp.id}" value="${pf}" min="0" max="100" 
                        style="width: 100%; padding: 0.7rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem;">Allowance (${currencySymbol})</label>
                    <input type="number" id="edit-allowance-${emp.id}" value="${allowance}" min="0" 
                        style="width: 100%; padding: 0.7rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 0.85rem;">Status</label>
                    <select id="edit-status-${emp.id}" 
                        style="width: 100%; padding: 0.7rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 6px; font-size: 0.9rem;">
                        <option value="Active" ${emp.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="On Leave" ${emp.status === 'On Leave' ? 'selected' : ''}>On Leave</option>
                    </select>
                </div>
            </div>
            <div class="employee-edit-actions">
                <button class="btn-primary" onclick="saveEmployeeFromSettings(${emp.id})" style="padding: 0.7rem 1.5rem; font-size: 0.9rem;">
                    <i class="fas fa-save"></i> Save Changes
                </button>
                <button class="btn-secondary" onclick="resetEmployeeEdit()" style="padding: 0.7rem 1.5rem; font-size: 0.9rem;">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        `;
        
        employeeEditFormContainer.style.display = 'block';
    }
    
    // Reset employee edit
    window.resetEmployeeEdit = function() {
        if (selectDeptForEdit) selectDeptForEdit.value = '';
        if (selectEmployeeForEdit) selectEmployeeForEdit.value = '';
        if (employeeSelectContainer) employeeSelectContainer.style.display = 'none';
        if (employeeEditFormContainer) employeeEditFormContainer.style.display = 'none';
    };
    
    // Event listeners for department and employee selection
    if (selectDeptForEdit) {
        selectDeptForEdit.addEventListener('change', (e) => {
            const selectedDept = e.target.value;
            if (selectedDept && selectedDept.trim() !== '') {
                loadEmployeesForDept(selectedDept);
                if (employeeEditFormContainer) employeeEditFormContainer.style.display = 'none';
                if (selectEmployeeForEdit) selectEmployeeForEdit.value = '';
            } else {
                if (employeeSelectContainer) employeeSelectContainer.style.display = 'none';
                if (employeeEditFormContainer) employeeEditFormContainer.style.display = 'none';
                if (selectEmployeeForEdit) selectEmployeeForEdit.innerHTML = '<option value="">-- Select Employee --</option>';
            }
        });
    } else {
        console.warn('selectDeptForEdit element not found - event listener not attached');
    }
    
    if (selectEmployeeForEdit) {
        selectEmployeeForEdit.addEventListener('change', (e) => {
            const selectedEmpId = e.target.value;
            if (selectedEmpId && selectedEmpId.trim() !== '') {
                loadEmployeeEditForm(parseInt(selectedEmpId));
            } else {
                if (employeeEditFormContainer) employeeEditFormContainer.style.display = 'none';
            }
        });
    } else {
        console.warn('selectEmployeeForEdit element not found - event listener not attached');
    }
    
    // Save employee changes from settings
    window.saveEmployeeFromSettings = function(empId) {
        if (!isUserAdmin) {
            if (typeof showToast === 'function') showToast('Access Denied: Only Administrators can edit employees.');
            else alert('Access Denied: Only Administrators can edit employees.');
            return;
        }
        
        const employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
        const empIndex = employees.findIndex(e => e.id === parseInt(empId));
        
        if (empIndex === -1) {
            if (typeof showToast === 'function') showToast('Employee not found!');
            return;
        }
        
        // Get updated values with null checks
        const nameEl = document.getElementById(`edit-name-${empId}`);
        const roleEl = document.getElementById(`edit-role-${empId}`);
        const deptEl = document.getElementById(`edit-dept-${empId}`);
        const salaryEl = document.getElementById(`edit-salary-${empId}`);
        const hraEl = document.getElementById(`edit-hra-${empId}`);
        const pfEl = document.getElementById(`edit-pf-${empId}`);
        const allowanceEl = document.getElementById(`edit-allowance-${empId}`);
        const statusEl = document.getElementById(`edit-status-${empId}`);
        
        // Null checks
        if (!nameEl || !roleEl || !deptEl || !salaryEl || !hraEl || !pfEl || !allowanceEl || !statusEl) {
            if (typeof showToast === 'function') {
                showToast('Error: Form fields not found. Please refresh the page.');
            } else {
                alert('Error: Form fields not found. Please refresh the page.');
            }
            return;
        }
        
        const name = nameEl.value.trim();
        const role = roleEl.value.trim();
        const dept = deptEl.value;
        const baseSalary = parseFloat(salaryEl.value) || 0;
        let hra = parseFloat(hraEl.value) || 0;
        let pf = parseFloat(pfEl.value) || 0;
        const allowance = parseFloat(allowanceEl.value) || 0;
        const status = statusEl.value;
        
        // Validation
        if (!name || name.length < 2) {
            if (typeof showToast === 'function') showToast('Employee name is required (at least 2 characters)!');
            if (nameEl) nameEl.focus();
            return;
        }
        
        if (baseSalary <= 0) {
            if (typeof showToast === 'function') showToast('Base salary must be greater than 0!');
            if (salaryEl) salaryEl.focus();
            return;
        }
        
        // Validate percentages (0-100)
        if (hra < 0 || hra > 100) {
            if (typeof showToast === 'function') showToast('HRA percentage must be between 0 and 100!');
            if (hraEl) hraEl.focus();
            return;
        }
        
        if (pf < 0 || pf > 100) {
            if (typeof showToast === 'function') showToast('PF percentage must be between 0 and 100!');
            if (pfEl) pfEl.focus();
            return;
        }
        
        // Validate allowance (non-negative)
        if (allowance < 0) {
            if (typeof showToast === 'function') showToast('Allowance cannot be negative!');
            if (allowanceEl) allowanceEl.focus();
            return;
        }
        
        // Calculate gross and net salary
        const hraAmount = (baseSalary * hra) / 100;
        const pfAmount = (baseSalary * pf) / 100;
        const grossSalary = baseSalary + hraAmount + allowance;
        const netSalary = grossSalary - pfAmount;
        
        // Update employee initials
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        // Update employee
        employees[empIndex] = {
            ...employees[empIndex],
            name: name,
            role: role,
            dept: dept,
            baseSalary: baseSalary,
            salary: baseSalary, // For backward compatibility
            hra: hra,
            pf: pf,
            allowance: allowance,
            grossSalary: grossSalary,
            netSalary: netSalary,
            status: status,
            avatar: initials
        };
        
        localStorage.setItem('nexhr_employees', JSON.stringify(employees));
        
        // Reload departments and reset form
        loadDepartmentsForEdit();
        loadEmployeeManagementList();
        resetEmployeeEdit();
        
        if (typeof showToast === 'function') {
            showToast(`${name}'s details updated successfully!`);
        }
    };

    // --- Employee Login Management ---
    const selectEmployeeForLogin = document.getElementById('selectEmployeeForLogin');
    const employeeLoginFormContainer = document.getElementById('employeeLoginFormContainer');
    const empLoginUsername = document.getElementById('empLoginUsername');
    const empLoginPassword = document.getElementById('empLoginPassword');
    const empLoginAccess = document.getElementById('empLoginAccess');
    const createEmployeeLoginBtn = document.getElementById('createEmployeeLoginBtn');
    const selectedEmployeeLoginInfo = document.getElementById('selectedEmployeeLoginInfo');
    const employeeLoginInfoCard = document.getElementById('employeeLoginInfoCard');
    
    // Load all employees for login creation
    function loadEmployeesForLogin() {
        if (!selectEmployeeForLogin) {
            console.warn('selectEmployeeForLogin element not found');
            return;
        }
        
        try {
            const employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
            
            selectEmployeeForLogin.innerHTML = '<option value="">-- Select Employee --</option>';
            
            if (employees.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No employees available';
                option.disabled = true;
                selectEmployeeForLogin.appendChild(option);
                return;
            }
            
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = `${emp.name || 'Unknown'} - ${emp.dept || 'N/A'} (${emp.role || 'N/A'})`;
                selectEmployeeForLogin.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading employees for login:', error);
            if (typeof showToast === 'function') {
                showToast('Error loading employees. Please refresh the page.');
            }
        }
    }
    
    // Load selected employee's login info
    function loadSelectedEmployeeLogin(empId) {
        if (!employeeLoginInfoCard || !selectedEmployeeLoginInfo) return;
        
        const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
        const employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
        
        const emp = employees.find(e => e.id === parseInt(empId));
        const login = users.find(u => u.employeeId === parseInt(empId));
        
        if (!emp) {
            selectedEmployeeLoginInfo.style.display = 'none';
            return;
        }
        
        if (login) {
            // Employee has login - show info
            employeeLoginInfoCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: var(--text-light); font-size: 1rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-user" style="margin-right: 0.5rem; color: var(--primary);"></i>${emp.name}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.75rem;">
                            <span style="margin-right: 1rem;"><i class="fas fa-building" style="margin-right: 0.3rem;"></i>${emp.dept || 'N/A'}</span>
                            <span><i class="fas fa-briefcase" style="margin-right: 0.3rem;"></i>${emp.role || 'N/A'}</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.3rem; text-transform: uppercase;">Username</div>
                                <div style="font-weight: 600; color: var(--text-light);">${login.username}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.3rem; text-transform: uppercase;">Access Level</div>
                                <div>
                                    <span style="background: ${login.role === 'Admin' ? 'var(--primary)' : login.role === 'Manager' ? 'var(--secondary)' : '#10b981'}; color: white; padding: 0.3rem 0.7rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${login.role}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="editEmployeeLogin(${emp.id})" class="btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.85rem;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="deleteEmployeeLogin(${emp.id})" style="background: var(--danger); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Employee doesn't have login yet
            employeeLoginInfoCard.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: var(--text-dim);">
                    <i class="fas fa-user-lock" style="font-size: 2rem; opacity: 0.3; margin-bottom: 0.5rem;"></i>
                    <p style="margin: 0.5rem 0;">No login ID created for this employee</p>
                    <small>Fill in the form above to create login credentials</small>
                </div>
            `;
        }
        
        selectedEmployeeLoginInfo.style.display = 'block';
    }
    
    // Event listener for employee selection
    if (selectEmployeeForLogin) {
        selectEmployeeForLogin.addEventListener('change', (e) => {
            const selectedEmpId = e.target.value;
            if (selectedEmpId && selectedEmpId.trim() !== '') {
                try {
                    const employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
                    const emp = employees.find(e => e.id === parseInt(selectedEmpId));
                    
                    if (emp) {
                        // Check if employee already has a login
                        const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
                        const existingLogin = users.find(u => u.employeeId === parseInt(selectedEmpId));
                        
                        if (existingLogin) {
                            // Pre-fill form with existing login
                            if (empLoginUsername) empLoginUsername.value = existingLogin.username;
                            if (empLoginPassword) empLoginPassword.value = '';
                            if (empLoginAccess) empLoginAccess.value = existingLogin.role;
                            if (createEmployeeLoginBtn) {
                                createEmployeeLoginBtn.innerHTML = '<i class="fas fa-save"></i> Update Login ID';
                                createEmployeeLoginBtn.setAttribute('data-update-id', selectedEmpId);
                            }
                        } else {
                            // New login - suggest username from employee name
                            const suggestedUsername = (emp.name || 'user').toLowerCase().replace(/\s+/g, '.');
                            if (empLoginUsername) empLoginUsername.value = suggestedUsername;
                            if (empLoginPassword) empLoginPassword.value = '';
                            if (empLoginAccess) empLoginAccess.value = 'Employee';
                            if (createEmployeeLoginBtn) {
                                createEmployeeLoginBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Login ID';
                                createEmployeeLoginBtn.removeAttribute('data-update-id');
                            }
                        }
                        
                        if (employeeLoginFormContainer) employeeLoginFormContainer.style.display = 'block';
                        
                        // Load and show selected employee's login info
                        loadSelectedEmployeeLogin(selectedEmpId);
                    } else {
                        if (typeof showToast === 'function') {
                            showToast('Employee not found!');
                        }
                    }
                } catch (error) {
                    console.error('Error handling employee selection:', error);
                    if (typeof showToast === 'function') {
                        showToast('Error loading employee details. Please try again.');
                    }
                }
            } else {
                if (employeeLoginFormContainer) employeeLoginFormContainer.style.display = 'none';
                if (selectedEmployeeLoginInfo) selectedEmployeeLoginInfo.style.display = 'none';
            }
        });
    } else {
        console.warn('selectEmployeeForLogin element not found - event listener not attached');
    }
    
    // Create/Update employee login
    if (createEmployeeLoginBtn) {
        createEmployeeLoginBtn.addEventListener('click', () => {
            const selectedEmpId = selectEmployeeForLogin ? selectEmployeeForLogin.value : null;
            const username = empLoginUsername ? empLoginUsername.value.trim() : '';
            const password = empLoginPassword ? empLoginPassword.value.trim() : '';
            const access = empLoginAccess ? empLoginAccess.value : 'Employee';
            const isUpdate = createEmployeeLoginBtn.getAttribute('data-update-id');
            
            if (!selectedEmpId) {
                if (typeof showToast === 'function') showToast('Please select an employee first.');
                return;
            }
            
            // Validation
            if (!username || username.length < 3) {
                if (typeof showToast === 'function') showToast('Username must be at least 3 characters long!');
                if (empLoginUsername) empLoginUsername.focus();
                return;
            }
            
            // Username validation (alphanumeric and dots/underscores only)
            if (!/^[a-zA-Z0-9._]+$/.test(username)) {
                if (typeof showToast === 'function') showToast('Username can only contain letters, numbers, dots, and underscores!');
                if (empLoginUsername) empLoginUsername.focus();
                return;
            }
            
            if (!isUpdate && !password) {
                if (typeof showToast === 'function') showToast('Password is required for new logins!');
                if (empLoginPassword) empLoginPassword.focus();
                return;
            }
            
            if (!isUpdate && password.length < 4) {
                if (typeof showToast === 'function') showToast('Password must be at least 4 characters long!');
                if (empLoginPassword) empLoginPassword.focus();
                return;
            }
            
            if (isUpdate && password && password.length > 0 && password.length < 4) {
                if (typeof showToast === 'function') showToast('Password must be at least 4 characters long!');
                if (empLoginPassword) empLoginPassword.focus();
                return;
            }
            
            const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
            
            // Check if username already exists (for different employee)
            const usernameExists = users.find(u => u.username === username && u.employeeId !== parseInt(selectedEmpId));
            if (usernameExists) {
                if (typeof showToast === 'function') showToast('Username already exists!');
                return;
            }
            
            if (isUpdate) {
                // Update existing login
                const loginIndex = users.findIndex(u => u.employeeId === parseInt(selectedEmpId));
                if (loginIndex !== -1) {
                    users[loginIndex].username = username;
                    users[loginIndex].role = access;
                    if (password) {
                        users[loginIndex].password = password; // In real app, hash password!
                    }
                    localStorage.setItem('nexhr_users', JSON.stringify(users));
                    if (typeof showToast === 'function') showToast('Employee login updated successfully!');
                }
            } else {
                // Create new login
                users.push({
                    username: username,
                    password: password, // In real app, hash password!
                    role: access,
                    employeeId: parseInt(selectedEmpId)
                });
                localStorage.setItem('nexhr_users', JSON.stringify(users));
                if (typeof showToast === 'function') showToast(`Login ID created for employee successfully!`);
            }
            
            // Reset form and reload selected employee's info
            const savedEmpId = selectEmployeeForLogin ? selectEmployeeForLogin.value : null;
            resetEmployeeLoginForm();
            loadAllEmployeeLoginsList();
            if (savedEmpId) {
                // Reload the selected employee's login info
                setTimeout(() => {
                    if (selectEmployeeForLogin) selectEmployeeForLogin.value = savedEmpId;
                    loadSelectedEmployeeLogin(savedEmpId);
                    if (employeeLoginFormContainer) employeeLoginFormContainer.style.display = 'block';
                }, 100);
            }
        });
    }
    
    // Reset employee login form
    window.resetEmployeeLoginForm = function() {
        if (selectEmployeeForLogin) selectEmployeeForLogin.value = '';
        if (empLoginUsername) empLoginUsername.value = '';
        if (empLoginPassword) empLoginPassword.value = '';
        if (empLoginAccess) empLoginAccess.value = 'Employee';
        if (employeeLoginFormContainer) employeeLoginFormContainer.style.display = 'none';
        if (selectedEmployeeLoginInfo) selectedEmployeeLoginInfo.style.display = 'none';
        if (createEmployeeLoginBtn) {
            createEmployeeLoginBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Login ID';
            createEmployeeLoginBtn.removeAttribute('data-update-id');
        }
    };
    
    // Edit employee login
    window.editEmployeeLogin = function(empId) {
        if (!isUserAdmin) {
            if (typeof showToast === 'function') showToast('Access Denied: Only Administrators can edit employee logins.');
            else alert('Access Denied: Only Administrators can edit employee logins.');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
        const login = users.find(u => u.employeeId === parseInt(empId));
        
        if (!login) {
            if (typeof showToast === 'function') showToast('Login not found!');
            return;
        }
        
        if (selectEmployeeForLogin) selectEmployeeForLogin.value = empId;
        if (empLoginUsername) empLoginUsername.value = login.username;
        if (empLoginPassword) empLoginPassword.value = '';
        if (empLoginAccess) empLoginAccess.value = login.role;
        if (createEmployeeLoginBtn) {
            createEmployeeLoginBtn.innerHTML = '<i class="fas fa-save"></i> Update Login ID';
            createEmployeeLoginBtn.setAttribute('data-update-id', empId);
        }
        if (employeeLoginFormContainer) employeeLoginFormContainer.style.display = 'block';
        
        // Reload selected employee's login info
        loadSelectedEmployeeLogin(empId);
        
        // Scroll to form
        employeeLoginFormContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    
    // Delete employee login
    window.deleteEmployeeLogin = function(empId) {
        if (!isUserAdmin) {
            if (typeof showToast === 'function') showToast('Access Denied: Only Administrators can delete employee logins.');
            else alert('Access Denied: Only Administrators can delete employee logins.');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this employee login?')) return;
        
        const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
        const updatedUsers = users.filter(u => u.employeeId !== parseInt(empId));
        localStorage.setItem('nexhr_users', JSON.stringify(updatedUsers));
        
        // Reload selected employee's login info and all logins list
        loadSelectedEmployeeLogin(empId);
        loadAllEmployeeLoginsList();
        if (typeof showToast === 'function') showToast('Employee login deleted successfully!');
    };
    

    // --- Employee Management List ---
    const employeeManagementList = document.getElementById('employeeManagementList');
    const totalEmployeesCount = document.getElementById('totalEmployeesCount');
    
    function loadEmployeeManagementList() {
        if (!employeeManagementList) return;
        
        try {
            const employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
            const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
            const currencySymbol = settings.currency || 'RS';
            
            if (totalEmployeesCount) {
                totalEmployeesCount.textContent = employees.length;
            }
            
            if (employees.length === 0) {
                employeeManagementList.innerHTML = `
                    <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--text-dim);">
                        <i class="fas fa-users" style="font-size: 2rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                        <p>No employees found</p>
                        <small>Add employees from the Employees page</small>
                    </div>
                `;
                return;
            }
            
            employeeManagementList.innerHTML = '';
            
            employees.forEach(emp => {
                const baseSalary = emp.baseSalary || emp.salary || 0;
                const empCard = document.createElement('div');
                empCard.className = 'employee-item';
                empCard.style.cssText = 'padding: 1rem; margin-bottom: 0.75rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px;';
                
                empCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div style="flex: 1; min-width: 200px;">
                            <div style="font-weight: 700; color: var(--text-light); font-size: 0.95rem; margin-bottom: 0.3rem;">
                                <i class="fas fa-user" style="margin-right: 0.5rem; color: var(--primary);"></i>${emp.name || 'Unknown'}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.5rem;">
                                <span style="margin-right: 1rem;"><i class="fas fa-building" style="margin-right: 0.3rem;"></i>${emp.dept || 'N/A'}</span>
                                <span style="margin-right: 1rem;"><i class="fas fa-briefcase" style="margin-right: 0.3rem;"></i>${emp.role || 'N/A'}</span>
                                <span><i class="fas fa-coins" style="margin-right: 0.3rem;"></i>${currencySymbol} ${baseSalary.toLocaleString()}</span>
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-dim);">
                                <span style="background: ${emp.status === 'Active' ? '#dcfce7' : '#fee2e2'}; color: ${emp.status === 'Active' ? '#166534' : '#991b1b'}; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem;">
                                    ${emp.status || 'Active'}
                                </span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="selectEmployeeForEditFromList('${emp.dept || ''}', ${emp.id})" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </div>
                    </div>
                `;
                
                employeeManagementList.appendChild(empCard);
            });
        } catch (error) {
            console.error('Error loading employee management list:', error);
            employeeManagementList.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--danger);">
                    <p>Error loading employees. Please refresh the page.</p>
                </div>
            `;
        }
    }
    
    // Function to select employee from list
    window.selectEmployeeForEditFromList = function(dept, empId) {
        if (selectDeptForEdit && dept) {
            selectDeptForEdit.value = dept;
            // Trigger change event to load employees for that department
            const event = new Event('change');
            selectDeptForEdit.dispatchEvent(event);
            
            // Wait a bit for the employee dropdown to populate, then select the employee
            setTimeout(() => {
                if (selectEmployeeForEdit) {
                    selectEmployeeForEdit.value = empId;
                    const empEvent = new Event('change');
                    selectEmployeeForEdit.dispatchEvent(empEvent);
                }
            }, 300);
        }
    };
    
    // --- All Employee Logins List ---
    const allEmployeeLoginsList = document.getElementById('allEmployeeLoginsList');
    const totalLoginsCount = document.getElementById('totalLoginsCount');
    
    function loadAllEmployeeLoginsList() {
        if (!allEmployeeLoginsList) return;
        
        try {
            const users = JSON.parse(localStorage.getItem('nexhr_users')) || [];
            const employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
            
            // Filter users that have employee IDs (employee logins)
            const employeeLogins = users.filter(user => user.employeeId);
            
            if (totalLoginsCount) {
                totalLoginsCount.textContent = employeeLogins.length;
            }
            
            if (employeeLogins.length === 0) {
                allEmployeeLoginsList.innerHTML = `
                    <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--text-dim);">
                        <i class="fas fa-user-lock" style="font-size: 2rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                        <p>No employee logins created yet</p>
                        <small>Select an employee above to create a login ID</small>
                    </div>
                `;
                return;
            }
            
            allEmployeeLoginsList.innerHTML = '';
            
            employeeLogins.forEach((login, index) => {
                const emp = employees.find(e => e.id === login.employeeId);
                const empName = emp ? emp.name : 'Unknown Employee';
                const empDept = emp ? emp.dept : 'N/A';
                const empRole = emp ? emp.role : 'N/A';
                
                const loginCard = document.createElement('div');
                loginCard.className = 'employee-item';
                loginCard.style.cssText = 'padding: 1rem; margin-bottom: 0.75rem; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px;';
                
                loginCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div style="flex: 1; min-width: 200px;">
                            <div style="font-weight: 700; color: var(--text-light); font-size: 0.95rem; margin-bottom: 0.3rem;">
                                <i class="fas fa-user" style="margin-right: 0.5rem; color: var(--primary);"></i>${empName}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.5rem;">
                                <span style="margin-right: 1rem;"><i class="fas fa-building" style="margin-right: 0.3rem;"></i>${empDept}</span>
                                <span style="margin-right: 1rem;"><i class="fas fa-briefcase" style="margin-right: 0.3rem;"></i>${empRole}</span>
                            </div>
                            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem;">
                                <span style="font-size: 0.8rem; color: var(--text-dim);">
                                    <i class="fas fa-user" style="margin-right: 0.3rem;"></i>Username: <strong>${login.username}</strong>
                                </span>
                                <span style="font-size: 0.8rem; color: var(--text-dim);">
                                    <i class="fas fa-shield-alt" style="margin-right: 0.3rem;"></i>Access: 
                                    <span style="background: ${login.role === 'Admin' ? 'var(--primary)' : login.role === 'Manager' ? 'var(--secondary)' : '#10b981'}; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.3rem;">${login.role}</span>
                                </span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="editEmployeeLogin(${login.employeeId})" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="deleteEmployeeLogin(${login.employeeId})" style="background: var(--danger); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer;">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
                
                allEmployeeLoginsList.appendChild(loginCard);
            });
        } catch (error) {
            console.error('Error loading all employee logins list:', error);
            allEmployeeLoginsList.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--danger);">
                    <p>Error loading employee logins. Please refresh the page.</p>
                </div>
            `;
        }
    }
    
    // --- Init ---
    loadSettings();
    loadUsers();
    loadRoleConfigs();
    loadDepartmentsForEdit();
    loadEmployeesForLogin();
    loadEmployeeManagementList();
    loadAllEmployeeLoginsList();
    if (form) {
        form.addEventListener('submit', saveSettings);
    }
});
