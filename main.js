const POLICY_JSON_URL = 'https://chromium.googlesource.com/chromium/chromium/+/refs/heads/main/chrome/app/policy/policy_templates.json?format=TEXT';

let allPolicies = [];
let policyValues = {};

// Fetch and load policies
async function loadPolicies() {
  try {
    const response = await fetch(POLICY_JSON_URL);
    const base64Text = await response.text();
    
    // Decode base64 (Googlesource serves content in base64)
    const decodedText = atob(base64Text.replace(/\s/g,''));
    const data = JSON.parse(decodedText);

    allPolicies = [];

    for (const category of data.policy_templates) {
      if (!category.policies) continue;
      for (const policy of Object.values(category.policies)) {
        let defaultValue = null;
        const type = policy.type || '';

        if (type === 'list') defaultValue = [];
        else if (type === 'int') defaultValue = null;
        else if (type === 'string') defaultValue = null;
        else if (type === 'bool') defaultValue = null;
        else defaultValue = null;

        const policyObj = {
          key: policy.name,
          type: type,
          desc: policy.desc || '',
          example: policy.items || '',
          value: defaultValue
        };

        allPolicies.push(policyObj);
        policyValues[policy.name] = defaultValue;
      }
    }

    renderPolicies(allPolicies);
  } catch (err) {
    console.error('Failed to load policies:', err);
    document.getElementById('policyContainer').innerHTML = '<p style="color:red;">Failed to load policies.</p>';
  }
}

// Render policy cards
function renderPolicies(policies) {
  const container = document.getElementById('policyContainer');
  container.innerHTML = '';

  for (const policy of policies) {
    const card = document.createElement('div');
    card.className = 'policy-card';
    card.innerHTML = `
      <h3>${policy.key}</h3>
      <p>${policy.desc}</p>
      <p>Type: ${policy.type}</p>
      ${generateInput(policy)}
    `;
    container.appendChild(card);
  }

  attachChangeEvents();
}

// Generate input fields based on type
function generateInput(policy) {
  const key = policy.key;
  switch(policy.type) {
    case 'bool':
      return `<select data-key="${key}">
        <option value="">Null</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>`;
    case 'int':
      return `<input type="number" data-key="${key}" placeholder="Integer value">`;
    case 'string':
      return `<input type="text" data-key="${key}" placeholder="String value">`;
    case 'list':
      return `<textarea data-key="${key}" placeholder="Comma-separated values"></textarea>`;
    default:
      return `<input type="text" data-key="${key}" placeholder="Value">`;
  }
}

// Attach input events to update policyValues
function attachChangeEvents() {
  const inputs = document.querySelectorAll('[data-key]');
  inputs.forEach(input => {
    input.addEventListener('input', e => {
      const key = input.dataset.key;
      if (input.tagName === 'SELECT') {
        const val = input.value;
        policyValues[key] = val === '' ? null : (val === 'true' ? true : val === 'false' ? false : val);
      } else if (input.tagName === 'TEXTAREA') {
        policyValues[key] = input.value ? input.value.split(',').map(v => v.trim()) : [];
      } else if (input.type === 'number') {
        policyValues[key] = input.value ? parseInt(input.value) : null;
      } else {
        policyValues[key] = input.value || null;
      }
    });
  });
}

// Download policy.json
function downloadPolicy() {
  const blob = new Blob([JSON.stringify(policyValues, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'policy.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Reset all policies to null/empty
function resetAllPolicies() {
  for (const key in policyValues) {
    const elem = document.querySelector(`[data-key="${key}"]`);
    if (elem) {
      if (elem.tagName === 'SELECT') elem.value = '';
      else if (elem.tagName === 'TEXTAREA') elem.value = '';
      else elem.value = '';
    }
    if (Array.isArray(policyValues[key])) policyValues[key] = [];
    else policyValues[key] = null;
  }
}

// Search functionality
document.getElementById('search').addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  const filtered = allPolicies.filter(p => p.key.toLowerCase().includes(term) || p.desc.toLowerCase().includes(term));
  renderPolicies(filtered);
});

// Buttons
document.getElementById('downloadBtn').addEventListener('click', downloadPolicy);
document.getElementById('resetBtn').addEventListener('click', resetAllPolicies);

// Initialize
loadPolicies();
