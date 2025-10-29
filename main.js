const POLICY_JSON_URL = 'policy_templates.json';

let allPolicies = [];
let policyValues = {};

async function loadPolicies() {
  const response = await fetch(POLICY_JSON_URL);
  const data = await response.json();

  allPolicies = [];

  for (const category of data.policy_templates) {
    if (!category.policies) continue;
    for (const policy of Object.values(category.policies)) {
      // Determine default value based on type
      let defaultValue = null;
      const type = policy.type || '';

      if (type === 'list') defaultValue = [];
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
}

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

function downloadPolicy() {
  const blob = new Blob([JSON.stringify(policyValues, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'policy.json';
  a.click();
  URL.revokeObjectURL(url);
}

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

document.getElementById('search').addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  const filtered = allPolicies.filter(p => p.key.toLowerCase().includes(term) || p.desc.toLowerCase().includes(term));
  renderPolicies(filtered);
});

document.getElementById('downloadBtn').addEventListener('click', downloadPolicy);
document.getElementById('resetBtn').addEventListener('click', resetAllPolicies);

loadPolicies();
