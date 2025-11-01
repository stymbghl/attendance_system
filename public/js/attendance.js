checkAuth();

// Set today's date as default
const dateInput = document.getElementById('attendanceDate');
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;

function goBack() {
    const user = getUserInfo();
    const isAdmin = user && user.isAdmin === 1;
    const dashboardPage = isAdmin ? '/admin.html' : '/home.html';
    window.location.href = dashboardPage;
}

function showMessage(text, isSuccess) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = text;
    messageElement.className = isSuccess ? 'message success' : 'message error';
    messageElement.style.display = 'block';

    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}

document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const date = dateInput.value;
    const hasConsent = document.getElementById('hasConsent').checked;

    if (!date) {
        showMessage('Please select a date', false);
        return;
    }

    if (!hasConsent) {
        showMessage('Please provide consent to continue', false);
        return;
    }

    try {
        await apiCall('/attendance', {
            method: 'POST',
            body: JSON.stringify({ date, hasConsent })
        });

        showMessage('Attendance marked successfully!', true);

        // Reset form
        document.getElementById('attendanceForm').reset();
        dateInput.value = today;

    } catch (error) {
        const isDuplicateError = error.message.includes('already marked');
        if (isDuplicateError) {
            showMessage('You have already marked attendance for this date', false);
        } else {
            showMessage(error.message || 'Failed to mark attendance', false);
        }
    }
});
