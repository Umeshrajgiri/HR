document.addEventListener('DOMContentLoaded', () => {
    // Check admin permission for rules page
    const currentUser = JSON.parse(sessionStorage.getItem('nexhr_currentUser'));
    const isUserAdmin = currentUser && (
        currentUser.role === 'Admin' || 
        currentUser.role === 'admin' ||
        currentUser.username === 'admin' ||
        currentUser.username === 'Admin'
    );
    
    if (!isUserAdmin) {
        alert('Access Denied: Only Administrators can access Rules & Perks.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // --- Company Rules & Policies Management ---
    const leavePolicyInput = document.getElementById('leavePolicy');
    const companyRulesInput = document.getElementById('companyRules');
    const saveCompanyRulesBtn = document.getElementById('saveCompanyRulesBtn');
    
    // --- Employee Perks & Benefits Management ---
    const employeeBenefitsInput = document.getElementById('employeeBenefits');
    const employeePerksInput = document.getElementById('employeePerks');
    const savePerksBtn = document.getElementById('savePerksBtn');
    
    // Load company rules
    function loadCompanyRules() {
        const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
        
        if (leavePolicyInput) {
            leavePolicyInput.value = settings.leavePolicy || '';
        }
        if (companyRulesInput) {
            companyRulesInput.value = settings.companyRules || '';
        }
    }
    
    // Load employee perks
    function loadEmployeePerks() {
        const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
        
        if (employeeBenefitsInput) {
            employeeBenefitsInput.value = settings.employeeBenefits || '';
        }
        if (employeePerksInput) {
            employeePerksInput.value = settings.employeePerks || '';
        }
    }
    
    // Save company rules
    if (saveCompanyRulesBtn) {
        saveCompanyRulesBtn.addEventListener('click', () => {
            if (!isUserAdmin) {
                if (typeof showToast === 'function') {
                    showToast('Access Denied: Only Administrators can save company rules.');
                } else {
                    alert('Access Denied: Only Administrators can save company rules.');
                }
                return;
            }
            
            const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
            
            settings.leavePolicy = leavePolicyInput ? leavePolicyInput.value : '';
            settings.companyRules = companyRulesInput ? companyRulesInput.value : '';
            
            localStorage.setItem('nexhr_settings', JSON.stringify(settings));
            
            if (typeof showToast === 'function') {
                showToast('Company rules saved successfully!');
            } else {
                alert('Company rules saved successfully!');
            }
        });
    }
    
    // Save employee perks
    if (savePerksBtn) {
        savePerksBtn.addEventListener('click', () => {
            if (!isUserAdmin) {
                if (typeof showToast === 'function') {
                    showToast('Access Denied: Only Administrators can save employee perks.');
                } else {
                    alert('Access Denied: Only Administrators can save employee perks.');
                }
                return;
            }
            
            const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
            
            settings.employeeBenefits = employeeBenefitsInput ? employeeBenefitsInput.value : '';
            settings.employeePerks = employeePerksInput ? employeePerksInput.value : '';
            
            localStorage.setItem('nexhr_settings', JSON.stringify(settings));
            
            if (typeof showToast === 'function') {
                showToast('Employee perks saved successfully!');
            } else {
                alert('Employee perks saved successfully!');
            }
        });
    }
    
    // Initialize
    loadCompanyRules();
    loadEmployeePerks();
});

