let policyData = {};
let currentCategory = '';
let selectedPolicies = [];

// Fetch and flatten JSON from GitHub
fetch('https://nonagonworkshop.github.io/Policy-maker/policy_templates.json')
    .then(res => res.json())
    .then(data => {
        policyData = flattenPolicies(data);
        buildCategorySidebar();
        const firstCategory = Object.keys(policyData)[0];
        if(firstCategory) showPolicies(firstCategory);
    });

// Flatten policy groups and standalone policies
function flattenPolicies(rawData) {
    const result = {};
    rawData.forEach(item => {
        if(item.type === 'group' && Array.isArray(item.policies)) {
            const catName = item.caption || item.name;
            result[catName] = item.policies.map(p => ({
                id: p.name,
                description: p.desc,
                type: p.type || 'Boolean',
                default: p.example_value || false
            }));
        } else {
            const catName = 'General';
            if(!result[catName]) result[catName] = [];
            result[catName].push({
                id: item.name,
                description: item.desc,
                type: item.type || 'Boolean',
                default: item.example_value || false
            });
        }
    });
    return result;
}

// Build sidebar with categories
function buildCategorySidebar() {
    const sidebar = document.getElementById('categorySidebar');
    sidebar.innerHTML = '';
    Object.keys(policyData).forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat;
        btn.onclick = () => showPolicies(cat);
        sidebar.appendChild(btn);
    });
}

// Show policies for selected category
function showPolicies(category) {
    currentCategory = category;
    document.querySelectorAll('#categorySidebar button').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === category);
    });

    const main = document.getElementById('policyMain');
    main.innerHTML = '';

    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    policyData[category].forEach(policy => {
        if(searchTerm && !policy.id.toLowerCase().includes(searchTerm) && !policy.description.toLowerCase().includes(searchTerm)) return;

        const card = document.createElement('div');
        card.className = 'policyCard';

        const h3 = document.createElement('h3');
        h3.textContent = policy.id;
        card.appendChild(h3);

        const p = document.createElement('p');
        p.textContent = policy.description;
        card.appendChild(p);

        let input;
        if(policy.type === 'Boolean') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = policy.default;
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.value = policy.default || '';
        }

        input.onchange = () => {
            const index = selectedPolicies.findIndex(p => p.PolicyName === policy.id);
            const value = (policy.type === 'Boolean') ? input.checked : input.value;
            if(index > -1) {
                selectedPolicies[index].PolicyValue = value;
            } else {
                selectedPolicies.push({ PolicyName: policy.id, PolicyValue: value });
            }
        };

        card.appendChild(input);
        main.appendChild(card);
    });
}

// Search filter
document.getElementById('searchInput').addEventListener('input', () => {
    showPolicies(currentCategory);
});

// Export button
document.getElementById('exportBtn').addEventListener('click', () => {
    const dataStr = JSON.stringify({ PolicyObjects: selectedPolicies }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'policies.json';
    a.click();
    URL.revokeObjectURL(url);
});
