// HF Training — GitHub Pages Demo App
const DEMO_PASSWORD = 'HF-Demo-2026!';
const ROLES = {
  admin: {name:'Administrator', email:'admin@demo.invalid', dash:true, admin:true},
  learner: {name:'VRQ student — Alex', email:'learner@demo.invalid', dash:true, portfolio:true, course:'vrq'},
  assessor: {name:'Assessor', email:'assessor@demo.invalid', dash:true, assessment:true},
  iqa: {name:'IQA', email:'iqa@demo.invalid', dash:true, iqa:true},
  apprentice: {name:'Apprentice — Jordan', email:'apprentice@demo.invalid', dash:true, portfolio:true, course:'apprenticeship'}
};

let currentUser = null;
let store = null;

// Simple storage wrapper
class DemoStore {
  constructor() {
    this.dbName = 'hf-demo-v1';
    this.db = null;
  }
  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('records')) db.createObjectStore('records', {keyPath:'id'});
        if (!db.objectStoreNames.contains('hours')) db.createObjectStore('hours', {keyPath:'id', autoIncrement:true});
        if (!db.objectStoreNames.contains('attendance')) db.createObjectStore('attendance', {keyPath:'date'});
        if (!db.objectStoreNames.contains('reviews')) db.createObjectStore('reviews', {keyPath:'id', autoIncrement:true});
        if (!db.objectStoreNames.contains('exams')) db.createObjectStore('exams', {keyPath:'unitRef'});
        if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', {keyPath:'id'});
        if (!db.objectStoreNames.contains('accounts')) db.createObjectStore('accounts', {keyPath:'email'});
      };
      req.onsuccess = e => {
        this.db = e.target.result;
        resolve();
      };
      req.onerror = reject;
    });
  }
  async seed() {
    const tx = this.db.transaction(['records','accounts'],'readwrite');
    const recStore = tx.objectStore('records');
    const accStore = tx.objectStore('accounts');
    
    // Seed VRQ units
    const units = [
      {id:'u202', ref:'202', title:'Follow Health and Safety Practice in the Salon', course:'vrq', status:'verified', assessedBy:'assessor@demo.invalid', assessedAt:new Date(Date.now()-86400000).toISOString(), iqaVerified:true},
      {id:'u203', ref:'203', title:'Client Consultation for Hair Services', course:'vrq', status:'draft'},
      {id:'u204', ref:'204', title:'Shampoo and Condition the Hair and Scalp', course:'vrq', status:'draft'},
      {id:'u210', ref:'210', title:'Cut Men\'s Hair', course:'vrq', status:'draft'},
      {id:'u211', ref:'211', title:'Cut Facial Hair', course:'vrq', status:'draft'},
      {id:'u202b', ref:'202', title:'Follow Health and Safety Practice in the Salon', course:'vrq', status:'draft'}
    ];
    units.forEach(u => recStore.put(u));
    
    // Seed accounts
    Object.entries(ROLES).forEach(([k,v]) => {
      accStore.put({email:v.email, name:v.name, role:k, createdAt:new Date().toISOString()});
    });
    
    tx.oncomplete = () => console.log('Demo data seeded');
    return new Promise(resolve => tx.oncomplete = resolve);
  }
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName);
      const s = tx.objectStore(storeName);
      const req = s.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = reject;
    });
  }
  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName,'readwrite');
      tx.objectStore(storeName).put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = reject;
    });
  }
  async clearAll() {
    const stores = ['records','hours','attendance','reviews','exams','files'];
    return Promise.all(stores.map(name => new Promise(res => {
      const tx = this.db.transaction(name,'readwrite');
      tx.objectStore(name).clear();
      tx.oncomplete = res;
    })));
  }
}

// Navigation
function renderNav(role) {
  const nav = document.getElementById('nav');
  const links = [
    {id:'overview', label:'01 Overview', show:true},
    {id:'portfolio', label:'02 E-portfolio', show:['learner','apprentice']},
    {id:'assessment', label:'03 Assessment & IQA', show:['assessor','iqa','admin']},
    {id:'attendance', label:'04 Attendance', show:true},
    {id:'hours', label:'05 Learning hours', show:true},
    {id:'reviews', label:'06 Progress reviews', show:true},
    {id:'exams', label:'07 Exam results', show:true},
    {id:'resources', label:'08 Resources', show:true},
    {id:'admin', label:'09 Administration', show:['admin']},
    {id:'account', label:'10 My account', show:true}
  ];
  const canSee = l => l.show === true || l.show.includes(role);
  nav.innerHTML = links.filter(canSee).map(l => 
    `<button data-nav="${l.id}">${l.label}</button>`
  ).join('');
  nav.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.nav));
  });
}

function navigateTo(section) {
  document.querySelectorAll('#nav button').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-nav="${section}"]`)?.classList.add('active');
  renderSection(section);
  document.getElementById('breadcrumb').textContent = section.replace(/^\d+\s/,'');
}

async function renderOverview() {
  const records = await store.getAll('records');
  const vrqRecords = records.filter(r => r.course === 'vrq');
  const assessed = vrqRecords.filter(r => r.status === 'verified').length;
  const total = vrqRecords.length || 6;
  const pct = Math.round((assessed/total)*100);
  
  document.getElementById('content').innerHTML = `
    <h1>Academy dashboard</h1>
    <p>Barbering training, practical evidence and learner progress.</p>
    <div class="notice" style="margin:16px 0">
      <a href="#" id="export-json" class="download-link">📥 Download learner record (JSON)</a>
      <br><br>
      <strong>VRQ Level 2 Barbering — selected 3002 units</strong><br>
      Units 202, 203, 204, 210 and 211. Centre draft checklists for testing; full qualification mapping still needs checking.
    </div>
    
    <div style="background:var(--hf-navy);color:white;padding:30px;border-radius:var(--radius);margin:24px 0">
      <h2 style="color:white;margin:0">Alex — VRQ demo learner's training</h2>
      <p style="opacity:.8">Build your portfolio, reflect on your practical work and keep moving towards your next milestone.</p>
      <div style="font-size:42px;font-weight:700;margin-top:16px">${pct}% <span style="font-size:16px;opacity:.7">1 of 6 service records assessed</span></div>
      <div class="progress-bar" style="margin-top:12px">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
    </div>
    
    <div class="grid">
      <div class="stat-card">
        <div class="stat-value">${assessed} / ${total}</div>
        <div class="stat-label">Assessed records<br>Includes IQA-verified records</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">0</div>
        <div class="stat-label">Awaiting assessment<br>Submitted by learner</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">1.0</div>
        <div class="stat-label">Approved learning hours<br>0 entries awaiting review</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">100%</div>
        <div class="stat-label">Recorded attendance<br>Authorised absences excluded</div>
      </div>
    </div>
    
    <h2 style="margin-top:32px">Your units</h2>
    <p class="meta">${total} records</p>
    ${vrqRecords.map(r => `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px">
        <div>
          <span class="badge ${r.status === 'verified' ? 'badge-verified' : 'badge-draft'}">${r.status === 'verified' ? 'Verified' : 'Draft'}</span>
          <h3 style="margin:8px 0">${r.ref} — ${r.title}</h3>
          <p class="meta">VRQ Level 2 Barbering — selected 3002 units · Service record #${r.id.replace(/\D/g,'')}</p>
        </div>
        <button class="btn-secondary" data-unit="${r.id}" data-action="open-unit">Open</button>
      </div>
    `).join('')}
    
    <div class="card" style="margin-top:32px;background:var(--hf-sky)">
      <h3>Next progress review</h3>
      <p style="font-size:28px;font-weight:700;margin:8px 0">1 Oct 2026</p>
      <p class="meta">Your tutor will agree your review dates with you.</p>
      <h4 style="margin-top:20px">Focus for your next session</h4>
      <p>Demo target</p>
    </div>
    
    <p class="meta" style="margin-top:24px;padding:12px;background:var(--hf-pale);border-radius:var(--radius-sm)">
      Progress reflects assessed service records, not unit completion. It is not a qualification certificate or an awarding-body result.
    </p>
  `;
  document.getElementById('export-json')?.addEventListener('click', e => {
    e.preventDefault();
    const data = {
      exportedAt: new Date().toISOString(),
      learner: 'Alex — VRQ demo learner',
      records: vrqRecords,
      note: 'DEMO DATA — fictional records only'
    };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'learner-record-demo.json'; a.click();
    URL.revokeObjectURL(url);
  });
}

async function renderPortfolio() {
  const records = await store.getAll('records');
  const course = ROLES[currentUser].course;
  const filtered = records.filter(r => r.course === course);
  
  document.getElementById('content').innerHTML = `
    <h1>E-portfolio</h1>
    <p>Your practical work, reflections and evidence.</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">
      ${filtered.map(r => `
        <div class="card">
          <span class="badge ${r.status === 'verified' ? 'badge-verified' : r.status === 'submitted' ? 'badge-submitted' : 'badge-draft'}">${r.status.charAt(0).toUpperCase()+r.status.slice(1)}</span>
          <h3 style="margin:10px 0">${r.ref}: ${r.title}</h3>
          <p class="meta">Service record</p>
          <button class="btn-secondary" style="margin-top:12px;width:100%" data-unit="${r.id}">
            ${r.status === 'draft' ? 'Edit record' : 'View record'}
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAssessment() {
  document.getElementById('content').innerHTML = `
    <h1>Assessment & IQA</h1>
    <p>Review learner work and record decisions.</p>
    <div class="grid">
      <div class="stat-card">
        <div class="stat-value">0</div>
        <div class="stat-label">Awaiting assessment</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">1</div>
        <div class="stat-label">Assessed — needs IQA</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">1</div>
        <div class="stat-label">IQA verified</div>
      </div>
    </div>
    <h2 style="margin-top:32px">Recent decisions</h2>
    <div class="card">
      <p><strong>Unit 202 — Health and Safety</strong></p>
      <p>Assessed by: assessor@demo.invalid · Verified by: iqa@demo.invalid</p>
      <p class="meta">Decision: ✅ Verified · 26 Sep 2026</p>
    </div>
    <p style="margin-top:20px">This is a demonstration interface. Decisions are stored locally in this browser.</p>
  `;
}

function renderAttendance() {
  document.getElementById('content').innerHTML = `
    <h1>Attendance</h1>
    <p>Record and review attendance.</p>
    <div class="card">
      <h3>Today's attendance</h3>
      <p style="font-size:24px;font-weight:700;color:var(--hf-success)">✅ Present</p>
      <p class="meta">27 Sep 2026</p>
      <hr>
      <h4>Weekly summary</h4>
      <p>Present: 5 days · Absent: 0 · Authorised: 0</p>
      <p class="meta">100% attendance this period</p>
    </div>
    <div class="card" style="margin-top:20px">
      <h3>Record attendance</h3>
      <label>Date<input type="date" id="att-date"></label>
      <label>Status
        <select id="att-status">
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="authorised">Authorised absence</option>
        </select>
      </label>
      <button class="primary" style="margin-top:12px" id="att-save">Save entry</button>
    </div>
  `;
}

function renderHours() {
  document.getElementById('content').innerHTML = `
    <h1>Learning hours</h1>
    <p>Academy, placement and guided learning hours.</p>
    <div class="grid">
      <div class="stat-card">
        <div class="stat-value">1.0</div>
        <div class="stat-label">Academy hours approved</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">0.0</div>
        <div class="stat-label">Placement hours approved</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">1.0</div>
        <div class="stat-label">Total approved hours</div>
      </div>
    </div>
    <div class="card" style="margin-top:20px">
      <h3>Submit hours</h3>
      <label>Type
        <select id="hour-type">
          <option value="academy">Academy — at training centre</option>
          <option value="placement">Placement — at employer</option>
          <option value="other">Other guided learning</option>
        </select>
      </label>
      <label>Hours<input type="number" step="0.5" id="hour-qty" value="1.0"></label>
      <label>Notes<textarea id="hour-note" placeholder="Activity description..."></textarea></label>
      <button class="primary" style="margin-top:12px">Submit for approval</button>
    </div>
  `;
}

function renderReviews() {
  document.getElementById('content').innerHTML = `
    <h1>Progress reviews</h1>
    <p>Tutor reviews, targets and action plans.</p>
    <div class="card">
      <h3>Next scheduled review</h3>
      <p style="font-size:24px;font-weight:700">1 Oct 2026</p>
      <p><strong>Focus:</strong> Demo target — practical assessment practice</p>
      <hr>
      <h4>Previous review — Sep 2026</h4>
      <p><strong>Strengths:</strong> Good consultation process, professional manner with clients.</p>
      <p><strong>Actions:</strong> Practise men's hair cutting techniques, complete unit 210 draft.</p>
      <p class="meta">Acknowledged by learner: ✅ Yes</p>
    </div>
  `;
}

function renderExams() {
  document.getElementById('content').innerHTML = `
    <h1>Exam results</h1>
    <p>Record external exam and assessment outcomes.</p>
    <div class="card">
      <p>No exam results recorded yet.</p>
      <p class="meta">Exams are arranged externally. This section records outcomes only.</p>
    </div>
  `;
}

function renderResources() {
  document.getElementById('content').innerHTML = `
    <h1>Learning resources</h1>
    <p>Course materials, guides and links.</p>
    <div class="card">
      <h3>VRQ Level 2 Barbering — 3002</h3>
      <ul>
        <li><a href="https://www.cityandguilds.com/qualifications-and-apprenticeships/hairdressing/hairdressing/3002-hairdressing" target="_blank">City & Guilds 3002 Qualification Handbook ↗</a></li>
        <li>Health & Safety checklist — centre draft</li>
        <li>Consultation record template</li>
        <li>Practical evidence guide</li>
      </ul>
    </div>
    <div class="card" style="margin-top:20px">
      <h3>Apprenticeship</h3>
      <p class="meta">Content being prepared — coming soon.</p>
    </div>
  `;
}

function renderAdmin() {
  document.getElementById('content').innerHTML = `
    <h1>Administration</h1>
    <p>Manage users, courses, enrolments and resources.</p>
    <div class="grid">
      <div class="card" style="cursor:pointer" onclick="alert('Demo — Create new learner account')">
        <h3>👤 Learners</h3>
        <p>Enrol, view and manage learners</p>
      </div>
      <div class="card" style="cursor:pointer" onclick="alert('Demo — Manage staff accounts')">
        <h3>👥 Staff</h3>
        <p>Assessors, IQAs and permissions</p>
      </div>
      <div class="card" style="cursor:pointer" onclick="alert('Demo — Manage courses & units')">
        <h3>📚 Courses & Units</h3>
        <p>VRQ, Apprenticeship, VTCT outlines</p>
      </div>
      <div class="card" style="cursor:pointer" onclick="alert('Demo — System settings')">
        <h3>⚙️ Settings</h3>
        <p>Passwords, demo reset, export</p>
      </div>
    </div>
    <p class="meta" style="margin-top:24px">This is a demonstration interface. Create accounts and enrolments in the live system.</p>
  `;
}

function renderAccount() {
  const u = ROLES[currentUser];
  document.getElementById('content').innerHTML = `
    <h1>My account</h1>
    <div class="card">
      <p><strong>Name:</strong> ${u.name}</p>
      <p><strong>Email:</strong> ${u.email}</p>
      <p><strong>Role:</strong> ${currentUser.charAt(0).toUpperCase()+currentUser.slice(1)}</p>
      <hr>
      <p class="meta">This is a demo account. Settings are stored locally in your browser.</p>
      <button class="btn-danger" onclick="document.getElementById('reset-demo').click()">Reset all demo data</button>
    </div>
  `;
}

function renderSection(section) {
  const allowed = {
    overview:['admin','learner','assessor','iqa','apprentice'],
    portfolio:['learner','apprentice'],
    assessment:['admin','assessor','iqa'],
    attendance:['admin','learner','assessor','iqa','apprentice'],
    hours:['admin','learner','assessor','iqa','apprentice'],
    reviews:['admin','learner','assessor','iqa','apprentice'],
    exams:['admin','learner','assessor','iqa','apprentice'],
    resources:['admin','learner','assessor','iqa','apprentice'],
    admin:['admin'],
    account:['admin','learner','assessor','iqa','apprentice']
  };
  if (!allowed[section]?.includes(currentUser)) {
    document.getElementById('content').innerHTML = '<p>Access denied — switch role.</p>';
    return;
  }
  
  switch(section) {
    case 'overview': renderOverview(); break;
    case 'portfolio': renderPortfolio(); break;
    case 'assessment': renderAssessment(); break;
    case 'attendance': renderAttendance(); break;
    case 'hours': renderHours(); break;
    case 'reviews': renderReviews(); break;
    case 'exams': renderExams(); break;
    case 'resources': renderResources(); break;
    case 'admin': renderAdmin(); break;
    case 'account': renderAccount(); break;
  }
}

// Login handlers
function setupLogin() {
  document.querySelectorAll('[data-demo-role]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('input[name="email"]').value = ROLES[btn.dataset.demoRole].email;
      document.querySelector('input[name="password"]').value = DEMO_PASSWORD;
    });
  });
  
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const pass = e.target.password.value;
    
    if (pass !== DEMO_PASSWORD) {
      document.getElementById('login-error').textContent = 'Incorrect demo password';
      return;
    }
    
    const match = Object.entries(ROLES).find(([k,v]) => v.email === email);
    if (!match) {
      document.getElementById('login-error').textContent = 'Demo account not found';
      return;
    }
    
    currentUser = match[0];
    sessionStorage.setItem('hf-demo-role', currentUser);
    document.getElementById('identity').textContent = ROLES[currentUser].name;
    document.getElementById('login').hidden = true;
    document.getElementById('workspace').hidden = false;
    renderNav(currentUser);
    navigateTo('overview');
  });
  
  document.getElementById('logout').addEventListener('click', () => {
    sessionStorage.removeItem('hf-demo-role');
    currentUser = null;
    document.getElementById('login').hidden = false;
    document.getElementById('workspace').hidden = true;
    document.getElementById('login-error').textContent = '';
  });
  
  document.getElementById('reset-demo').addEventListener('click', async () => {
    if (confirm('Reset ALL demo data? This deletes all records in this browser.')) {
      await store.clearAll();
      await store.seed();
      alert('Demo reset complete');
      location.reload();
    }
  });
}

// Init
async function init() {
  store = new DemoStore();
  await store.init();
  
  // Check if seeded
  const recs = await store.getAll('records');
  if (!recs.length) await store.seed();
  
  // Resume session
  const saved = sessionStorage.getItem('hf-demo-role');
  if (saved && ROLES[saved]) {
    currentUser = saved;
    document.getElementById('identity').textContent = ROLES[currentUser].name;
    document.getElementById('login').hidden = true;
    document.getElementById('workspace').hidden = false;
    renderNav(currentUser);
    navigateTo('overview');
  }
  
  setupLogin();
}

document.addEventListener('DOMContentLoaded', init);
