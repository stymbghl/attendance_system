function escapeCSVValue(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);
    const needsEscaping = stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n');

    if (needsEscaping) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

function generateUserCSV(records) {
    const headers = ['Date', 'Consent Given', 'Submitted At'];
    const csvRows = [headers.join(',')];

    for (const record of records) {
        const consentText = record.hasConsent === 1 ? 'Yes' : 'No';
        const row = [
            escapeCSVValue(record.date),
            escapeCSVValue(consentText),
            escapeCSVValue(record.createdAt)
        ];
        csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
}

function generateAllUsersCSV(records) {
    const headers = ['User Name', 'Email', 'Date', 'Consent Given', 'Submitted At'];
    const csvRows = [headers.join(',')];

    for (const record of records) {
        const consentText = record.hasConsent === 1 ? 'Yes' : 'No';
        const row = [
            escapeCSVValue(record.name),
            escapeCSVValue(record.email),
            escapeCSVValue(record.date),
            escapeCSVValue(consentText),
            escapeCSVValue(record.createdAt)
        ];
        csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
}

module.exports = {
    generateUserCSV,
    generateAllUsersCSV
};
