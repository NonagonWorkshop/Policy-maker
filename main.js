const POLICY_JSON_URL = "https://raw.githubusercontent.com/NonagonWorkshop/Policy-maker/refs/heads/main/policy_templates.json";

let policies = {}; // To store processed policy data

// Fetch and parse the Python-style JSON
async function loadPolicies() {
  try {
    const response = await fetch(POLICY_JSON_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    let text = await response.text();

    // Convert Python-style to proper JSON
    text = text
      .replace(/'/g, '"')         // single quotes → double quotes
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      .replace(/"""(.*?)"""/gs, '"$1"') // remove triple quotes
      .replace(/\\n/g, ''); // optional: remove literal newline chars

    const data = JSON.parse(text);

    // Flatten policies
    policies = flattenPolicies(data);
    renderPolicies(policies);

  } catch (err) {
    console.error('Failed to load policies:', err);
    document.getElementById('policyContainer').innerHTML =
      `<p style="color:red;">Failed to load policies: ${err.message}</p>`;
  }
}

// Flatten the nested Python-style structure
function flattenPolicies(data) {
  let result = {};

  if (Array.isArray(data)) {
    data.forEach(group => {
      if (group.policies) {
        group.policies.forEach(p => {
          result[p.name] = {
            type: p.type || 'string',
            value: p.example_value !== undefined ? p.example_value : null,
            caption: p.caption || '',
            desc: p.desc || ''
          };
        });
      }
    });
  }

  return result;
}

// Render the policy editor UI
function renderPolicies(policies) {
  const container = document.getElementById('policyContainer');
  container.innerHTML = '';

  Object.keys(policies).forEach(key => {
    const p = policies[key];

    const wrapper = document.createElement('div');
    wrapper.className = 'policy-item';

    const label = document.createElement('label');
    label.innerHTML = `<strong>${key}</strong>: ${p.caption}`;

    let input;
    if (p.type === 'boolean') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!p.value;
    } else if (p.type === 'integer') {
      input = document.createElement('input');
      input.type = 'number';
      input.value = p.value !== null ? p.value : 0;
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = p.value !== null ? p.value : '';
    }

    input.onchange = () => {
      if (p.type === 'boolean') policies[key].value = input.checked;
      else if (p.type === 'integer') policies[key].value = parseInt(input.value) || 0;
      else policies[key].value = input.value;
    };

    wrapper.appendChild(label);
    wrapper.appendChild(document.createElement('br'));
    wrapper.appendChild(input);

    container.appendChild(wrapper);
  });

  // Add a download button
  const btn = document.createElement('button');
  btn.textContent = 'Download Policy File';
  btn.onclick = downloadPolicy;
  container.appendChild(btn);
}

// Download the JSON policy file
function downloadPolicy() {
  const output = {};
  Object.keys(policies).forEach(key => {
    output[key] = policies[key].value;
  });

  const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'chrome_policy.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Initialize
window.addEventListener('DOMContentLoaded', loadPolicies);
