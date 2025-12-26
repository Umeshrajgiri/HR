document.addEventListener('DOMContentLoaded', () => {

    // --- State ---
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const d = new Date();
    const currentMonthStr = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

    // --- Helper Functions ---
    function getCurrencySymbol() {
        const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
        return settings.currency || 'RS';
    }
    
    function formatCurrency(amount) {
        const symbol = getCurrencySymbol();
        if (symbol === 'RS') {
            return `${symbol} ${parseFloat(amount).toLocaleString('en-US')}`;
        }
        return `${symbol}${parseFloat(amount).toLocaleString('en-US')}`;
    }

    // Load Employees
    let employees = JSON.parse(localStorage.getItem('nexhr_employees')) || [];
    // Load Payroll State (who is paid this month)
    let payrollState = JSON.parse(localStorage.getItem('nexhr_payroll')) || {};

    // --- Elements ---
    const tableBody = document.getElementById('payrollTableBody');
    const runBtn = document.getElementById('runPayrollBtn');
    const displayMonth = document.getElementById('currentMonth');
    const totalCostEl = document.getElementById('totalCost');
    const totalEmpEl = document.getElementById('totalEmpPayroll');

    // Modal Elements
    const modal = document.getElementById('payslipModal');
    const closeModal = document.querySelector('.close-modal');

    // --- Functions ---

    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        // Month Header
        if (displayMonth) displayMonth.innerText = currentMonthStr;
        if (totalEmpEl) totalEmpEl.innerText = employees.length;

        let totalForMonth = 0;
        const isPaidMonth = payrollState[currentMonthStr] === true;

        if (isPaidMonth) {
            runBtn.disabled = true;
            runBtn.innerHTML = '<i class="fas fa-check"></i> Payroll Processed';
            runBtn.style.background = '#10b981'; // Green
        }

        employees.forEach(emp => {
            const isPaid = isPaidMonth; // Simple logic: All driven by one button for MVP
            const statusBadge = isPaid
                ? '<span class="status-paid">Paid</span>'
                : '<span class="status-unpaid">Pending</span>';

            const empSalary = emp.salary || emp.baseSalary || 0;
            totalForMonth += empSalary;

            const row = `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                             <img src="https://ui-avatars.com/api/?name=${emp.name}&background=random" style="width:30px;height:30px;border-radius:50%">
                             ${emp.name}
                        </div>
                    </td>
                    <td>${emp.role}</td>
                    <td>${formatCurrency(empSalary)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="viewPayslip(${emp.id})">
                             View Payslip
                        </button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        if (totalCostEl) totalCostEl.innerText = formatCurrency(totalForMonth);
    }

    // Global for onClick
    window.viewPayslip = (empId) => {
        const emp = employees.find(e => e.id === empId);
        if (!emp) return;

        // Populate Modal
        document.getElementById('slipMonth').innerText = currentMonthStr;
        document.getElementById('slipName').innerText = emp.name;
        document.getElementById('slipRole').innerText = emp.role;
        document.getElementById('slipDept').innerText = emp.dept;
        document.getElementById('slipDate').innerText = new Date().toLocaleDateString();

        // Calcs
        const basic = emp.baseSalary || emp.salary || 0;
        const hra = emp.hra || 0;
        const allowance = emp.allowance || 0;
        const pf = emp.pf || 0;
        
        // Calculate salary components
        const hraAmount = (basic * hra) / 100;
        const pfAmount = (basic * pf) / 100;
        const gross = basic + hraAmount + allowance;
        
        // Get tax rate from settings (default 10%)
        const settings = JSON.parse(localStorage.getItem('nexhr_settings')) || {};
        const taxRate = settings.taxRate || 10;
        const tax = (gross * taxRate) / 100;
        const deductions = pfAmount + tax;
        const net = gross - deductions;

        document.getElementById('earnBasic').innerText = formatCurrency(basic);
        document.getElementById('earnHRA').innerText = formatCurrency(hraAmount);
        document.getElementById('earnAllow').innerText = formatCurrency(allowance);
        document.getElementById('valGross').innerText = formatCurrency(gross);

        document.getElementById('dedTax').innerText = formatCurrency(tax);
        document.getElementById('dedPF').innerText = formatCurrency(pfAmount);
        document.getElementById('valDed').innerText = formatCurrency(deductions);

        document.getElementById('valNet').innerText = formatCurrency(net);

        // Show
        modal.classList.add('active');
    };

    // Events
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            payrollState[currentMonthStr] = true;
            localStorage.setItem('nexhr_payroll', JSON.stringify(payrollState));
            renderTable();
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Init
    renderTable();

});
