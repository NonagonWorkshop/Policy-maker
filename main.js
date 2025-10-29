const policyUrl = 'https://raw.githubusercontent.com/NonagonWorkshop/Policy-maker/refs/heads/main/policy_templates.json';

let policies = {}; // stores current policy values

// Convert Python-style JSON to valid JSON
function pythonToJson(text) {
  return text
    .replace(/'/g, '"')                 // single quotes → double quotes
    .replace(/\bTrue\b/g, 'true')       // True → true
    .replace(/\bFalse\b/g, 'false')     // False → false
    .replace(/\bNone\b/g, 'null');      // None → null
}

// Fetch and load policies
async function loadPolicies() {
  try {
    const res = await fetch(policyUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(pythonToJson(text));
    } catch (e) {
      console.error('Failed to parse policies:', e);
      document.getElementById('policyContainer').innerHTML =
        '<p style="color:red;">Failed to parse policies.</p>';
      return;
    }

    // Flatten policies into a simple object with default values
    policies = {};
    data.forEach(group => {
      if (!group.policies) return;
      group.policies.forEach(p => {
        policies[p.name] = {
          caption: p.caption || '',
          desc: p.desc || '',
          type: p.type,
          value: p.example_value !== undefined ? p.example_value : null
        };
      });
    });

    renderPolicies(policies);

  } catch (err) {
    console.error('Failed to load policies:', err);
    const container = document.getElementById('policyContainer');
    container.innerHTML = '<p style="color:red;">Failed to load policies.</p>';
  }
}

// Render all policies into the page
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

    // Boolean
    if (p.type === 'boolean' || typeof p.value === 'boolean') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!p.value;
      input.onchange = () => { policies[key].value = input.checked; };

    // Only 0,1,2 → dropdown
    } else if (typeof p.value === 'number' && [0,1,2].includes(p.value)) {
      input = document.createElement('select');
      [0,1,2].forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = val;
        if (val === p.value) opt.selected = true;
        input.appendChild(opt);
      });
      input.onchange = () => { policies[key].value = parseInt(input.value); };

    // Other number
    } else if (typeof p.value === 'number') {
      input = document.createElement('input');
      input.type = 'number';
      input.value = p.value !== null ? p.value : 0;
      input.onchange = () => { policies[key].value = parseInt(input.value) || 0; };

    // String
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = p.value !== null ? p.value : '';
      input.onchange = () => { policies[key].value = input.value; };
    }

    wrapper.appendChild(label);
    wrapper.appendChild(document.createElement('br'));
    wrapper.appendChild(input);

    container.appendChild(wrapper);
  });

  // Add download button
  const btn = document.createElement('button');
  btn.textContent = 'Download Policy File';
  btn.onclick = downloadPolicy;
  container.appendChild(document.createElement('hr'));
  container.appendChild(btn);
}

// Download current policies as JSON
function downloadPolicy() {
  const blob = new Blob([JSON.stringify(
    Object.fromEntries(
      Object.entries(policies).map(([k,v]) => [k, v.value])
    ), null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chrome_policy.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Initialize
window.onload = loadPolicies;
