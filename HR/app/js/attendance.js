document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');
    const statusMessage = document.getElementById('statusMessage');
    const logsBody = document.getElementById('logsBody');

    // State
    // In a real app, we'd fetch the current user's session.
    // Here we simulate "Admin User" attendance.
    const currentUser = "Admin User";
    let attendanceState = JSON.parse(localStorage.getItem('nexhr_attendance_state')) || {
        checkedIn: false,
        startTime: null,
        logs: []
    };

    // Update Clock
    function updateClock() {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('en-US', { hour12: false });
        dateEl.innerText = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Render Logic
    function renderState() {
        if (attendanceState.checkedIn) {
            checkInBtn.disabled = true;
            checkOutBtn.disabled = false;
            checkInBtn.style.opacity = '0.5';
            checkOutBtn.style.opacity = '1';
            const startTime = new Date(attendanceState.startTime);
            statusMessage.innerText = `Checked in at ${startTime.toLocaleTimeString()}`;
            statusMessage.style.color = 'var(--success)';
        } else {
            checkInBtn.disabled = false;
            checkOutBtn.disabled = true;
            checkInBtn.style.opacity = '1';
            checkOutBtn.style.opacity = '0.5';
            statusMessage.innerText = 'Ready to check in';
            statusMessage.style.color = 'var(--text-dim)';
        }
        renderLogs();
    }

    function renderLogs() {
        logsBody.innerHTML = '';
        // Combine today's active session + history
        const logs = [...attendanceState.logs];

        // If currently checked in, show that row too
        if (attendanceState.checkedIn && attendanceState.startTime) {
            logs.unshift({
                name: currentUser,
                checkIn: attendanceState.startTime,
                checkOut: null
            });
        }

        logs.forEach(log => {
            const inTime = new Date(log.checkIn);
            const outTime = log.checkOut ? new Date(log.checkOut) : null;

            // Late logic: If check-in is after 9:00 AM
            const threshold = new Date(inTime);
            threshold.setHours(9, 0, 0); // 9:00 AM today
            const isLate = inTime > threshold;

            // Duration
            let duration = '-';
            if (outTime) {
                const diffMs = outTime - inTime;
                const hrs = Math.floor(diffMs / 3600000);
                const mins = Math.floor((diffMs % 3600000) / 60000);
                duration = `${hrs}h ${mins}m`;
            }

            const row = `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                             <img src="https://ui-avatars.com/api/?name=${log.name}&background=random" style="width:30px;height:30px;border-radius:50%">
                             ${log.name}
                        </div>
                    </td>
                    <td>${inTime.toLocaleTimeString()}</td>
                    <td>${outTime ? outTime.toLocaleTimeString() : '<span style="color:var(--secondary)">Active...</span>'}</td>
                    <td>${duration}</td>
                    <td>${isLate ? '<span class="badge-late">Late</span>' : '<span class="badge-ontime">On Time</span>'}</td>
                </tr>
            `;
            logsBody.insertAdjacentHTML('afterbegin', row);
        });
    }

    // Actions
    checkInBtn.addEventListener('click', () => {
        const now = new Date();
        attendanceState.checkedIn = true;
        attendanceState.startTime = now.toISOString();
        localStorage.setItem('nexhr_attendance_state', JSON.stringify(attendanceState));
        renderState();
    });

    checkOutBtn.addEventListener('click', () => {
        const now = new Date();
        if (attendanceState.checkedIn && attendanceState.startTime) {
            // Archive the log
            attendanceState.logs.push({
                name: currentUser,
                checkIn: attendanceState.startTime,
                checkOut: now.toISOString()
            });
            attendanceState.checkedIn = false;
            attendanceState.startTime = null;
            localStorage.setItem('nexhr_attendance_state', JSON.stringify(attendanceState));
            renderState();
        }
    });

    // Init
    renderState();

});
