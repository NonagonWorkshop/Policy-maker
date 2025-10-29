const POLICY_JSON_URL = 'https://raw.githubusercontent.com/NonagonWorkshop/Policy-maker/refs/heads/main/policy_templates.json';

let allPolicies = [];
let policyValues = {};

// Load policies from JSON
async function loadPolicies() {
  try {
    const response = await fetch(POLICY_JSON_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    allPolicies = [];
    policyValues = {};

    // The JSON you link uses single quotes and probably Python‑style, so might need preprocessing
    // But assuming it's valid JSON as retrieved
    for (const category of (data.policy_templates || [])) {
      if (!category.policies) continue;
      for (const policy of Object.values(category.policies)) {
        let defaultValue = null;
        const type = policy.type || '';

        if (type === 'list') {
          defaultValue = [];
        } else {
          defaultValue = null;
        }

        allPolicies.push({
          key: policy.name,
          type: type,
          desc: policy.desc || '',
          example: policy.items || '',
          value: defaultValue
        });

        policyValues[policy.name] = defaultValue;
      }
    }

    renderPolicies(allPolicies);
  } catch (err) {
    console.error('Failed to load policies:', err);
    document.getElementById('policyContainer').innerHTML = `<p style="color:red;">Failed to load policies. ${err.message}</p>`;
  }
}

// Render displayed policies
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

// Generate correct input type per policy type
function generateInput(policy) {
  const key = policy.key;
  switch (policy.type) {
    case 'bool':
    case 'main':  // treat main as boolean for user toggling
      return `<select data-key="${key}">
                <option value="">Null</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>`;
    case 'int':
    case 'int-enum':
      return `<input type="number" data-key="${key}" placeholder="Integer value">`;
    case 'string':
    case 'string-enum':
      return `<input type="text" data-key="${key}" placeholder="String value">`;
    case 'list':
      return `<textarea data-key="${key}" placeholder="Comma-separated values"></textarea>`;
    default:
      return `<input type="text" data-key="${key}" placeholder="Value">`;
  }
}

// Attach event listeners to inputs so changes reflect in policyValues
function attachChangeEvents() {
  const inputs = document.querySelectorAll('[data-key]');
  inputs.forEach(input => {
    input.addEventListener('input', e => {
      const key = input.dataset.key;
      if (input.tagName === 'SELECT') {
        const val = input.value;
        policyValues[key] = (val === '') ? null : (val === 'true' ? true : (val === 'false' ? false : val));
      } else if (input.tagName === 'TEXTAREA') {
        policyValues[key] = input.value ? input.value.split(',').map(v => v.trim()) : [];
      } else if (input.type === 'number') {
        policyValues[key] = input.value !== '' ? parseInt(input.value, 10) : null;
      } else {
        policyValues[key] = input.value || null;
      }
    });
  });
}

// Download policyValues as JSON file
function downloadPolicy() {
  const blob = new Blob([JSON.stringify(policyValues, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'policy.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Reset all policies to null or empty array
function resetAllPolicies() {
  for (const key in policyValues) {
    const elem = document.querySelector(`[data-key="${key}"]`);
    if (elem) {
      if (elem.tagName === 'SELECT') {
        elem.value = '';
      } else if (elem.tagName === 'TEXTAREA') {
        elem.value = '';
      } else {
        elem.value = '';
      }
    }
    if (Array.isArray(policyValues[key])) {
      policyValues[key] = [];
    } else {
      policyValues[key] = null;
    }
  }
}

// Search filter
document.getElementById('search').addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  const filtered = allPolicies.filter(p =>
    p.key.toLowerCase().includes(term) ||
    (p.desc && p.desc.toLowerCase().includes(term))
  );
  renderPolicies(filtered);
});

// Buttons
document.getElementById('downloadBtn').addEventListener('click', downloadPolicy);
document.getElementById('resetBtn').addEventListener('click', resetAllPolicies);

// Kick off loading
loadPolicies();
