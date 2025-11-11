async function downloadMyReport() {
    try {
        const response = await fetch('http://localhost:3000/api/reports/my-attendance', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to download report');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-attendance.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        alert(error.message || 'Failed to download report');
    }
}

async function downloadAllUsersReport() {
    try {
        const response = await fetch('http://localhost:3000/api/reports/all-users', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            const isUnauthorized = response.status === 403;
            if (isUnauthorized) {
                throw new Error('You do not have permission to access this report');
            }
            throw new Error('Failed to download report');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'all-users-attendance.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        alert(error.message || 'Failed to download report');
    }
}

async function downloadMyLeaveReport() {
    try {
        const response = await fetch('http://localhost:3000/api/reports/my-leaves', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to download leave report');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-leaves.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        alert(error.message || 'Failed to download leave report');
    }
}

async function downloadAllLeavesReport() {
    try {
        const response = await fetch('http://localhost:3000/api/reports/all-leaves', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        if (!response.ok) {
            const isUnauthorized = response.status === 403;
            if (isUnauthorized) {
                throw new Error('You do not have permission to access this report');
            }
            throw new Error('Failed to download leave report');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'all-leaves.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        alert(error.message || 'Failed to download leave report');
    }
}
