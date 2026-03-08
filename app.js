// ============================================
// MEDICATION REMINDER APP — Kurdish Sorani
// ============================================

// ---- Data Layer ----
const STORAGE_KEY = 'medication_app_data';

function loadMedications() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : getDefaultMedications();
    } catch {
        return getDefaultMedications();
    }
}

function saveMedications(meds) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meds));
}

function getDefaultMedications() {
    return [
        {
            id: 1,
            name: 'ئامۆکسیسیلین',
            type: 'pill',
            dose: '٥٠٠ مگ',
            times: ['08:00'],
            frequency: 'daily',
            timesPerDay: 3,
            allTimes: ['08:00', '14:00', '21:00'],
            duration: '٧ ڕۆژ',
            notes: '',
            takenToday: [true, false, false]
        },
        {
            id: 2,
            name: 'ئینسولین',
            type: 'injection',
            dose: '١٠ یەکە',
            times: ['07:30'],
            frequency: 'daily',
            timesPerDay: 2,
            allTimes: ['07:30', '19:30'],
            duration: 'بەردەوام',
            notes: 'پێش خواردن',
            takenToday: [true, false]
        },
        {
            id: 3,
            name: 'شەربەتی سەرمابوون',
            type: 'syrup',
            dose: '١٠ مل',
            times: ['09:00'],
            frequency: 'daily',
            timesPerDay: 2,
            allTimes: ['09:00', '21:00'],
            duration: '٥ ڕۆژ',
            notes: '',
            takenToday: [false, false]
        },
        {
            id: 4,
            name: 'تڵ ی چاو',
            type: 'drops',
            dose: '٢ تڵ',
            times: ['10:00'],
            frequency: 'daily',
            timesPerDay: 3,
            allTimes: ['10:00', '16:00', '22:00'],
            duration: '١٤ ڕۆژ',
            notes: 'بۆ چاوی ڕاست',
            takenToday: [false, false, false]
        }
    ];
}

let medications = loadMedications();
let currentScreen = 'home';

// ---- Utility Functions ----
const typeIcons = {
    pill: 'medication',
    injection: 'syringe',
    syrup: 'local_pharmacy',
    drops: 'water_drop'
};

const typeLabels = {
    pill: 'حەب',
    injection: 'دەرزی',
    syrup: 'شەربەت',
    drops: 'تڵ'
};

const ordinalLabels = ['یەکەم', 'دووەم', 'سێیەم', 'چوارەم', 'پێنجەم', 'شەشەم'];
const periodLabels = ['بەیانیان', 'نیوەڕوان', 'شەوان', 'ئێواران', 'نیوەشەو', 'سەرەتای بەیانی'];
const periodIcons = ['wb_sunny', 'light_mode', 'dark_mode', 'wb_twilight', 'nights_stay', 'brightness_5'];

function getTimeOfDayPeriod(timeStr) {
    if (!timeStr) return { label: 'بەیانیان', icon: 'wb_sunny', ampm: 'AM' };
    const [h] = timeStr.split(':').map(Number);
    if (h >= 5 && h < 12) return { label: 'بەیانیان', icon: 'wb_sunny', ampm: 'AM' };
    if (h >= 12 && h < 17) return { label: 'نیوەڕوان', icon: 'light_mode', ampm: 'PM' };
    if (h >= 17 && h < 21) return { label: 'ئێواران', icon: 'wb_twilight', ampm: 'PM' };
    return { label: 'شەوان', icon: 'dark_mode', ampm: 'PM' };
}

function formatTime12(time24) {
    if (!time24) return '٠٨:٠٠';
    const [h, m] = time24.split(':').map(Number);
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getKurdishDate() {
    const days = ['یەکشەممە', 'دووشەممە', 'سێشەممە', 'چوارشەممە', 'پێنجشەممە', 'هەینی', 'شەممە'];
    const months = ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران',
                    'تەممووز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'];
    const now = new Date();
    const day = days[now.getDay()];
    const month = months[now.getMonth()];
    const date = now.getDate();
    return `${day}، ${date} ی ${month}`;
}

function getNow() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function isTimePast(timeStr) {
    const now = getNow();
    return timeStr <= now;
}

// ---- Router ----
function navigate(screen) {
    currentScreen = screen;
    render();
}

// ---- Render ----
function render() {
    const app = document.getElementById('app');
    if (currentScreen === 'home') {
        app.innerHTML = renderHome();
        attachHomeEvents();
    } else if (currentScreen === 'add') {
        app.innerHTML = renderAddScreen();
        attachAddEvents();
    }
}

// ============================================
// HOME SCREEN
// ============================================
function renderHome() {
    const totalDoses = medications.reduce((sum, m) => sum + m.takenToday.length, 0);
    const takenDoses = medications.reduce((sum, m) => sum + m.takenToday.filter(Boolean).length, 0);
    const pct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
    const circumference = 2 * Math.PI * 30;
    const offset = circumference - (pct / 100) * circumference;

    // Build schedule list — flatten all doses
    const allDoses = [];
    medications.forEach(med => {
        med.allTimes.forEach((time, idx) => {
            allDoses.push({
                med,
                time,
                doseIdx: idx,
                taken: med.takenToday[idx] || false
            });
        });
    });

    // Sort by time
    allDoses.sort((a, b) => a.time.localeCompare(b.time));

    const takenList = allDoses.filter(d => d.taken);
    const upcomingList = allDoses.filter(d => !d.taken && !isTimePast(d.time));
    const overdueList = allDoses.filter(d => !d.taken && isTimePast(d.time));
    const pendingList = [...overdueList, ...upcomingList];

    return `
        <div class="screen" id="home-screen">
            <div class="decor-blob top-right"></div>
            <div class="decor-blob bottom-left"></div>

            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="header-spacer"></div>
                    <h1 class="header-title">بیرکەرەوەی دەرمان</h1>
                    <div class="header-spacer"></div>
                </div>
            </div>

            <div class="home-content">
                <!-- Greeting -->
                <div class="greeting-section animate-in">
                    <p class="greeting-date">${getKurdishDate()}</p>
                    <h2 class="greeting-title">دەرمانەکانی ئەمڕۆ 💊</h2>
                </div>

                <!-- Progress Card -->
                <div class="progress-card animate-in stagger-1">
                    <div class="progress-inner">
                        <div class="progress-text-area">
                            <p class="progress-label">دەرمانی وەرگیراو</p>
                            <p class="progress-value">${takenDoses} <span>لە ${totalDoses}</span></p>
                            <p class="progress-subtitle">${pct}% تەواو بووە</p>
                        </div>
                        <div class="progress-ring-container">
                            <svg class="progress-ring" viewBox="0 0 72 72">
                                <circle class="progress-ring-bg" cx="36" cy="36" r="30" />
                                <circle class="progress-ring-fill" cx="36" cy="36" r="30"
                                    stroke-dasharray="${circumference}"
                                    stroke-dashoffset="${offset}" />
                            </svg>
                            <div class="progress-ring-text">${pct}%</div>
                        </div>
                    </div>
                </div>

                <!-- Pending Medications -->
                <div class="section-header animate-in stagger-2">
                    <span class="material-symbols-outlined">schedule</span>
                    <h3 class="section-title">چاوەڕوانکراو</h3>
                    <span class="section-count">${pendingList.length}</span>
                </div>

                ${pendingList.length > 0 ? pendingList.map((d, i) => renderMedCard(d, i, false)).join('') : `
                    <div class="empty-state animate-in">
                        <span class="material-symbols-outlined">check_circle</span>
                        <p>هەموو دەرمانەکان وەرگیراون!</p>
                    </div>
                `}

                <!-- Taken Medications -->
                <div class="section-header animate-in stagger-3" style="margin-top: 24px;">
                    <span class="material-symbols-outlined icon-filled" style="color: var(--success);">check_circle</span>
                    <h3 class="section-title">وەرگیراوەکان</h3>
                    <span class="section-count">${takenList.length}</span>
                </div>

                ${takenList.length > 0 ? takenList.map((d, i) => renderMedCard(d, i, true)).join('') : `
                    <div class="empty-state animate-in">
                        <span class="material-symbols-outlined">hourglass_empty</span>
                        <p>هێشتا هیچ دەرمانێک وەرنەگیراوە</p>
                    </div>
                `}
            </div>

            <!-- Floating Add Button -->
            <button class="fab" id="fab-add" title="زیادکردنی دەرمان">
                <span class="material-symbols-outlined">add</span>
            </button>
        </div>
    `;
}

function renderMedCard(doseEntry, index, isTakenSection) {
    const { med, time, doseIdx, taken } = doseEntry;
    const period = getTimeOfDayPeriod(time);
    const time12 = formatTime12(time);
    const staggerClass = `stagger-${Math.min(index + 2, 5)}`;

    return `
        <div class="med-card ${taken ? 'taken' : ''} animate-in ${staggerClass}" data-med-id="${med.id}" data-dose-idx="${doseIdx}">
            <button class="med-check ${taken ? 'checked' : ''}" data-toggle-med="${med.id}" data-toggle-dose="${doseIdx}">
                <span class="material-symbols-outlined">${taken ? 'check' : ''}</span>
            </button>
            <div class="med-icon ${med.type}">
                <span class="material-symbols-outlined">${typeIcons[med.type]}</span>
            </div>
            <div class="med-info">
                <p class="med-name">${med.name}</p>
                <p class="med-dose">${med.dose} · ${typeLabels[med.type]} · ژەمی ${ordinalLabels[doseIdx]}</p>
            </div>
            <div class="med-time-area">
                <p class="med-time">${time12}</p>
                <p class="med-period">${period.ampm}</p>
            </div>
            <button class="med-delete" data-delete-med="${med.id}" title="سڕینەوەی دەرمان">
                <span class="material-symbols-outlined">delete</span>
            </button>
        </div>
    `;
}

function showDeleteConfirm(id) {
    const med = medications.find(m => m.id === id);
    if (!med) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    overlay.innerHTML = `
        <div class="modal-card">
            <div class="modal-icon warning">
                <span class="material-symbols-outlined">delete_forever</span>
            </div>
            <h3 class="modal-title">سڕینەوەی دەرمان</h3>
            <p class="modal-text">دڵنیایت دەتەوێت دەرمانی "<strong>${med.name}</strong>" بسڕیتەوە؟ ئەم کردارە پاشگەزبوونەوەی نییە.</p>
            <div class="modal-actions">
                <button class="modal-btn cancel" id="cancel-delete">پاشگەزبوونەوە</button>
                <button class="modal-btn delete" id="confirm-delete">سڕینەوە</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('cancel-delete').addEventListener('click', () => {
        overlay.classList.add('slide-out');
        setTimeout(() => overlay.remove(), 300);
    });

    document.getElementById('confirm-delete').addEventListener('click', () => {
        medications = medications.filter(m => m.id !== id);
        saveMedications(medications);
        overlay.classList.add('slide-out');
        setTimeout(() => {
            overlay.remove();
            render();
            showToast('دەرمانەکە سڕایەوە ✓');
        }, 300);
    });
}

function attachHomeEvents() {
    // FAB
    document.getElementById('fab-add')?.addEventListener('click', () => navigate('add'));

    // Toggle medication taken
    document.querySelectorAll('[data-toggle-med]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const medId = parseInt(btn.dataset.toggleMed);
            const doseIdx = parseInt(btn.dataset.toggleDose);
            const med = medications.find(m => m.id === medId);
            if (med) {
                med.takenToday[doseIdx] = !med.takenToday[doseIdx];
                saveMedications(medications);
                render();
            }
        });
    });

    // Delete medication
    document.querySelectorAll('[data-delete-med]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const medId = parseInt(btn.dataset.deleteMed);
            showDeleteConfirm(medId);
        });
    });
}

// ============================================
// ADD MEDICATION SCREEN
// ============================================
let addFormState = {
    name: '',
    type: 'pill',
    dose: '',
    frequency: 'daily',
    repeatType: 'daily',
    timesPerDay: 1,
    times: ['08:00'],
    duration: '',
    notes: '',
    notifications: true
};

function resetAddForm() {
    addFormState = {
        name: '',
        type: 'pill',
        dose: '',
        frequency: 'daily',
        repeatType: 'daily',
        timesPerDay: 1,
        times: ['08:00'],
        duration: '',
        notes: '',
        notifications: true
    };
}

function renderAddScreen() {
    const defaultTimes = ['08:00', '14:00', '21:00', '07:00', '12:00', '18:00'];

    // Ensure times array matches timesPerDay
    while (addFormState.times.length < addFormState.timesPerDay) {
        addFormState.times.push(defaultTimes[addFormState.times.length] || '12:00');
    }
    addFormState.times = addFormState.times.slice(0, addFormState.timesPerDay);

    // Calculate step progress
    let filledSteps = 1; // always at step 1
    if (addFormState.name) filledSteps = 2;
    if (addFormState.name && addFormState.dose) filledSteps = 3;
    if (addFormState.name && addFormState.dose && addFormState.times[0]) filledSteps = 4;
    if (addFormState.name && addFormState.dose && addFormState.times[0] && addFormState.duration) filledSteps = 5;
    const stepPct = (filledSteps / 5) * 100;

    return `
        <div class="screen slide-in" id="add-screen">
            <div class="decor-blob top-right"></div>
            <div class="decor-blob bottom-left"></div>

            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <button class="header-btn" id="back-btn">
                        <span class="material-symbols-outlined">arrow_forward</span>
                    </button>
                    <h1 class="header-title">زیادکردنی دەرمان</h1>
                    <div class="header-spacer"></div>
                </div>
            </div>

            <!-- Steps Progress -->
            <div class="steps-bar">
                <div class="steps-info">
                    <span class="steps-label">هەنگاوی پڕکردنەوە</span>
                    <span class="steps-count">${filledSteps} لە ٥</span>
                </div>
                <div class="steps-track">
                    <div class="steps-fill" style="width: ${stepPct}%"></div>
                </div>
            </div>

            <div class="add-content">
                <!-- Medication Name -->
                <div class="form-section animate-in">
                    <div class="form-section-title">
                        <span class="material-symbols-outlined">medication</span>
                        <h3>ناوی دەرمان</h3>
                    </div>
                    <div class="input-group">
                        <input class="input-field" id="med-name" type="text" placeholder="ناوی دەرمان بنووسە..." value="${addFormState.name}" />
                    </div>
                </div>

                <!-- Medication Type -->
                <div class="form-section animate-in stagger-1">
                    <div class="form-section-title">
                        <span class="material-symbols-outlined">category</span>
                        <h3>جۆری دەرمان</h3>
                    </div>
                    <div class="chips-grid">
                        <button class="chip ${addFormState.type === 'pill' ? 'active' : ''}" data-type="pill">
                            <span class="material-symbols-outlined">medication</span>
                            حەب
                        </button>
                        <button class="chip ${addFormState.type === 'injection' ? 'active' : ''}" data-type="injection">
                            <span class="material-symbols-outlined">syringe</span>
                            دەرزی
                        </button>
                        <button class="chip ${addFormState.type === 'syrup' ? 'active' : ''}" data-type="syrup">
                            <span class="material-symbols-outlined">local_pharmacy</span>
                            شەربەت
                        </button>
                        <button class="chip ${addFormState.type === 'drops' ? 'active' : ''}" data-type="drops">
                            <span class="material-symbols-outlined">water_drop</span>
                            تڵ
                        </button>
                    </div>
                </div>

                <!-- Dose -->
                <div class="form-section animate-in stagger-2">
                    <div class="form-section-title">
                        <span class="material-symbols-outlined">science</span>
                        <h3>بڕی دۆز</h3>
                    </div>
                    <div class="input-group">
                        <input class="input-field" id="med-dose" type="text" placeholder="بۆ نموونە: ٥٠٠ مگ" value="${addFormState.dose}" />
                    </div>
                </div>

                <!-- Repeat / Frequency -->
                <div class="form-section animate-in stagger-3">
                    <div class="form-section-title">
                        <span class="material-symbols-outlined">event_repeat</span>
                        <h3>دووبارەبوونەوە</h3>
                    </div>
                    <div class="repeat-grid">
                        <button class="repeat-option ${addFormState.repeatType === 'daily' ? 'active' : ''}" data-repeat="daily">
                            <span class="material-symbols-outlined">event_repeat</span>
                            ڕۆژانە
                        </button>
                        <button class="repeat-option ${addFormState.repeatType === 'weekly' ? 'active' : ''}" data-repeat="weekly">
                            <span class="material-symbols-outlined">calendar_view_week</span>
                            هەفتانە
                        </button>
                        <button class="repeat-option ${addFormState.repeatType === 'specific' ? 'active' : ''}" data-repeat="specific">
                            <span class="material-symbols-outlined">edit_calendar</span>
                            ڕۆژە دیاریکراوەکان
                        </button>
                        <button class="repeat-option ${addFormState.repeatType === 'custom' ? 'active' : ''}" data-repeat="custom">
                            <span class="material-symbols-outlined">settings_suggest</span>
                            خوازراو
                        </button>
                    </div>
                </div>

                <!-- Times Per Day (only for daily) -->
                ${addFormState.repeatType === 'daily' ? `
                <div class="form-section animate-in" id="times-section">
                    <div class="form-section-title">
                        <span class="material-symbols-outlined">schedule</span>
                        <h3>چەند جار لە ڕۆژێکدا؟</h3>
                    </div>
                    <div class="freq-tabs">
                        ${[1, 2, 3, 4].map(n => `
                            <button class="freq-tab ${addFormState.timesPerDay === n ? 'active' : ''}" data-times="${n}">
                                ${n === 4 ? '٤+' : ['١', '٢', '٣'][n - 1]} جار
                            </button>
                        `).join('')}
                    </div>

                    <!-- Dynamic Time Inputs -->
                    <div class="dose-cards" id="dose-cards" style="margin-top: 18px;">
                        <div class="form-section-title" style="margin-bottom: 4px;">
                            <span class="material-symbols-outlined">access_time</span>
                            <h3>کاتی ژەمەکان</h3>
                        </div>
                        ${addFormState.times.map((time, idx) => {
                            const period = getTimeOfDayPeriod(time);
                            return `
                                <div class="dose-card" style="animation-delay: ${idx * 80}ms;">
                                    <div class="dose-card-info">
                                        <div class="dose-icon">
                                            <span class="material-symbols-outlined">${period.icon}</span>
                                        </div>
                                        <div>
                                            <p class="dose-label">ژەمی ${ordinalLabels[idx]}</p>
                                            <p class="dose-period">${period.label}</p>
                                        </div>
                                    </div>
                                    <div class="dose-time-input">
                                        <input class="dose-time-field" type="time" value="${time}" data-time-idx="${idx}" />
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Duration -->
                <div class="form-section animate-in stagger-4">
                    <div class="form-section-title">
                        <span class="material-symbols-outlined">date_range</span>
                        <h3>ماوەی چارەسەر</h3>
                    </div>
                    <div class="input-group">
                        <input class="input-field" id="med-duration" type="text" placeholder="بۆ نموونە: ٧ ڕۆژ" value="${addFormState.duration}" />
                    </div>
                </div>

                <!-- Notes -->
                <div class="form-section animate-in stagger-5">
                    <div class="form-section-title">
                        <span class="material-symbols-outlined">edit_note</span>
                        <h3>تێبینی (دڵخوازانە)</h3>
                    </div>
                    <div class="input-group">
                        <textarea class="input-field" id="med-notes" placeholder="تێبینی زیادە...">${addFormState.notes}</textarea>
                    </div>
                </div>

                <!-- Notification Toggle -->
                <div class="form-section animate-in">
                    <div class="toggle-row">
                        <div class="toggle-row-content">
                            <span class="material-symbols-outlined">notifications_active</span>
                            <span>ئاگادارکردنەوە</span>
                        </div>
                        <div class="toggle ${addFormState.notifications ? 'on' : ''}" id="notif-toggle">
                            <div class="toggle-knob"></div>
                        </div>
                    </div>
                </div>

                <div style="height: 90px;"></div>
            </div>

            <!-- Submit Button -->
            <div class="submit-area">
                <button class="submit-btn" id="save-med-btn">
                    <span class="material-symbols-outlined">save</span>
                    پاشەکەوتکردن
                </button>
            </div>
        </div>
    `;
}

function attachAddEvents() {
    // Back button
    document.getElementById('back-btn')?.addEventListener('click', () => {
        resetAddForm();
        navigate('home');
    });

    // Name input
    document.getElementById('med-name')?.addEventListener('input', (e) => {
        addFormState.name = e.target.value;
        updateSteps();
    });

    // Dose input
    document.getElementById('med-dose')?.addEventListener('input', (e) => {
        addFormState.dose = e.target.value;
        updateSteps();
    });

    // Duration input
    document.getElementById('med-duration')?.addEventListener('input', (e) => {
        addFormState.duration = e.target.value;
        updateSteps();
    });

    // Notes input
    document.getElementById('med-notes')?.addEventListener('input', (e) => {
        addFormState.notes = e.target.value;
    });

    // Type chips
    document.querySelectorAll('[data-type]').forEach(chip => {
        chip.addEventListener('click', () => {
            addFormState.type = chip.dataset.type;
            document.querySelectorAll('[data-type]').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });

    // Repeat type
    document.querySelectorAll('[data-repeat]').forEach(btn => {
        btn.addEventListener('click', () => {
            addFormState.repeatType = btn.dataset.repeat;
            render(); // Re-render to show/hide times section
        });
    });

    // Times per day
    document.querySelectorAll('[data-times]').forEach(btn => {
        btn.addEventListener('click', () => {
            addFormState.timesPerDay = parseInt(btn.dataset.times);
            render(); // Re-render to add/remove time cards
        });
    });

    // Time inputs
    document.querySelectorAll('[data-time-idx]').forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(input.dataset.timeIdx);
            addFormState.times[idx] = e.target.value;
            // Update icon & period without full re-render
            const card = input.closest('.dose-card');
            if (card) {
                const period = getTimeOfDayPeriod(e.target.value);
                const iconEl = card.querySelector('.dose-icon .material-symbols-outlined');
                const periodEl = card.querySelector('.dose-period');
                if (iconEl) iconEl.textContent = period.icon;
                if (periodEl) periodEl.textContent = period.label;
            }
        });
    });

    // Notification toggle
    document.getElementById('notif-toggle')?.addEventListener('click', () => {
        addFormState.notifications = !addFormState.notifications;
        document.getElementById('notif-toggle').classList.toggle('on');
    });

    // Save
    document.getElementById('save-med-btn')?.addEventListener('click', () => {
        if (!addFormState.name.trim()) {
            shakeElement(document.getElementById('med-name'));
            return;
        }

        const newMed = {
            id: Date.now(),
            name: addFormState.name.trim(),
            type: addFormState.type,
            dose: addFormState.dose.trim() || '١ دانە',
            times: [addFormState.times[0]],
            frequency: addFormState.repeatType,
            timesPerDay: addFormState.repeatType === 'daily' ? addFormState.timesPerDay : 1,
            allTimes: addFormState.repeatType === 'daily' ? [...addFormState.times] : [addFormState.times[0]],
            duration: addFormState.duration.trim() || 'بەردەوام',
            notes: addFormState.notes.trim(),
            takenToday: new Array(addFormState.repeatType === 'daily' ? addFormState.timesPerDay : 1).fill(false)
        };

        medications.push(newMed);
        saveMedications(medications);
        resetAddForm();
        navigate('home');
        showToast('دەرمانەکە زیاد کرا ✓');
    });
}

function updateSteps() {
    let filledSteps = 1;
    if (addFormState.name) filledSteps = 2;
    if (addFormState.name && addFormState.dose) filledSteps = 3;
    if (addFormState.name && addFormState.dose && addFormState.times[0]) filledSteps = 4;
    if (addFormState.name && addFormState.dose && addFormState.times[0] && addFormState.duration) filledSteps = 5;
    const stepPct = (filledSteps / 5) * 100;

    const countEl = document.querySelector('.steps-count');
    const fillEl = document.querySelector('.steps-fill');
    if (countEl) countEl.textContent = `${filledSteps} لە ٥`;
    if (fillEl) fillEl.style.width = `${stepPct}%`;
}

function shakeElement(el) {
    if (!el) return;
    el.style.borderColor = '#ef4444';
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'shake 0.4s ease';
    setTimeout(() => {
        el.style.borderColor = '';
        el.style.animation = '';
    }, 600);
}

// ---- Toast ----
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="material-symbols-outlined icon-filled">check_circle</span> ${message}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

// ---- Shake animation (added dynamically) ----
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }
`;
document.head.appendChild(shakeStyle);

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    render();
});
