document.getElementById('policyForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Get the policy name and value from the form
    const policyName = document.getElementById('policyName').value;
    const policyValue = document.getElementById('policyValue').value;

    // Create the policy object
    const policy = {};
    policy[policyName] = policyValue;

    // Convert to JSON string
    const policyJson = JSON.stringify(policy, null, 2);

    // Display the JSON in the UI
    document.getElementById('jsonOutput').textContent = policyJson;

    // Enable the download button
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.disabled = false;

    // Handle downloading the file
    downloadBtn.onclick = function() {
        const blob = new Blob([policyJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'policy.json';
        a.click();
        URL.revokeObjectURL(url);
    };
});
