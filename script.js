// --- THEME MANAGEMENT ---

/**
 * Toggles the theme and dynamically updates the meta theme-color.
 */
window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // السطر الجديد: تحديث لون الشريط فورًا عند التبديل
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-color');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor.trim());
};

// --- MAIN SCRIPT ---

document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL STATE & CONSTANTS ---
    let quranData = {};
    let allGoals = [];      // Active goals
    let archivedGoals = []; // Completed goals
    let currentlyEditingGoalId = null;
    const DB_NAME = 'tarteelGoalsApp_Final';
    const ARCHIVE_DB_NAME = 'tarteelGoalsApp_Final_Archive';


    // --- UTILITY FUNCTIONS ---
    
    /**
     * Gets today's date in YYYY-MM-DD format.
     * @returns {string} Today's date string.
     */
    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Creates a comparable numeric value for a verse.
     * @param {{index: string, verse: string}} verseObj - Object with surah index and verse number.
     * @returns {number} A numeric value for comparison.
     */
    const getComparableVerseValue = ({ index, verse }) => {
        return parseInt(index) * 1000 + parseInt(verse.replace('verse_', ''));
    };


    // --- DATA PERSISTENCE (LocalStorage) ---

    /**
     * Loads goals from localStorage into the global state.
     */
    function loadGoals() {
        allGoals = JSON.parse(localStorage.getItem(DB_NAME) || '[]');
        archivedGoals = JSON.parse(localStorage.getItem(ARCHIVE_DB_NAME) || '[]');
    }

    /**
     * Saves the current state of goals to localStorage.
     */
    function saveGoals() {
        localStorage.setItem(DB_NAME, JSON.stringify(allGoals));
        localStorage.setItem(ARCHIVE_DB_NAME, JSON.stringify(archivedGoals));
    }


    // --- UI COMPONENTS & NOTIFICATIONS ---

    /**
     * Displays a toast notification.
     * @param {string} message - The message to show.
     * @param {'success'|'error'} type - The type of toast.
     * @param {number} duration - How long to show the toast in ms.
     */
    function showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, duration);
    }

    /**
     * Shows a confirmation modal and returns a promise that resolves with the user's choice.
     * @param {string} message - The confirmation message.
     * @returns {Promise<boolean>} - True if confirmed, false if canceled.
     */
    function showConfirmationModal(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmation-modal');
            const messageP = document.getElementById('modal-message');
            const confirmBtn = document.getElementById('modal-confirm-btn');
            const cancelBtn = document.getElementById('modal-cancel-btn');

            if (!modal || !messageP || !confirmBtn || !cancelBtn) return resolve(false);

            messageP.textContent = message;
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);

            const close = (decision) => {
                modal.classList.remove('show');
                modal.addEventListener('transitionend', () => {
                    modal.style.display = 'none';
                    confirmBtn.onclick = null;
                    cancelBtn.onclick = null;
                    resolve(decision);
                }, { once: true });
            };
            
            confirmBtn.onclick = () => close(true);
            cancelBtn.onclick = () => close(false);
        });
    }

    /**
     * Switches the visible screen in the single-page application.
     * @param {string} screenId - The ID of the screen to show.
     */
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
        if (screenId === 'goalsListScreen') {
            renderGoalsList();
        }
    }


    // --- UI RENDERING & DOM MANIPULATION ---

    /**
     * Dynamically builds the entire application's HTML structure.
     */
    function setupUI() {
        document.querySelector('.app-container').innerHTML = `
            <div id="goalsListScreen" class="screen">
                <div class="header">
                    <h1>الأهداف</h1>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button class="header-btn" id="showArchiveBtn" title="الأرشيف"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line></svg></button>
                        <button class="theme-toggle" onclick="toggleTheme()" title="تبديل الوضع"><svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg><svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></button>
                        <button class="header-btn" data-action="add-new" title="إضافة هدف جديد"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                    </div>
                </div>
                <div id="goalsListContainer"></div>
                <div id="noGoalsMessage" style="display: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg><p style="font-size: 16px; color: var(--text-secondary);">لا توجد أهداف حالية!<br>اضغط على ＋ في الأعلى لإضافة هدفك الأول.</p></div>
            </div>

            <div id="newGoalScreen" class="screen">
                <div class="header">
                    <button class="header-btn back-btn" data-target="goalsListScreen" title="رجوع"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><polyline points="15 6 21 12 15 18"></polyline></svg></button>
                    <h1 id="form-title">هدف جديد</h1>
                   <span style="width: 45px;"></span> <!-- Spacer for alignment -->
                </div>
                <form id="goalForm">
                    <div class="form-group"><label for="goalName">اسم الورد</label><input type="text" id="goalName" placeholder="مثال: ختمة رمضان" required></div>
                    <div class="form-group"><label for="goalType">نوع الورد</label><select id="goalType"><option value="تلاوة">تلاوة</option><option value="حفظ">حفظ</option><option value="مراجعة">مراجعة</option></select></div>
                    <div class="form-group"><label>الكمية</label><div class="compound-input"><input type="number" id="quantityAmount" value="1" min="1"><select id="quantityUnit"><option value="ربع">ربع</option><option value="صفحة">صفحة</option></select></div></div>
                    <div class="form-group"><label>المدى</label><div class="compound-input" style="margin-bottom: 10px;"><select id="rangeUnit"><option value="سورة">سورة</option><option value="صفحة">صفحة</option><option value="جزء">جزء</option></select></div><div class="compound-input"><select id="rangeFrom"></select><select id="rangeTo"></select></div></div>
                    <div class="form-group"><label>الجدول</label><div class="compound-input"><input type="number" id="scheduleAmount" value="1" min="1"><select id="scheduleUnit"><option value="يوم">يوم</option><option value="أسبوع">أسبوع</option><option value="شهر">شهر</option></select></div></div>
                    <div class="form-group"><span class="form-group-label">وقت البداية</span><div class="date-input-overlay-wrapper"><input type="date" id="startDate" required><div class="date-overlay"><span id="dateDisplay"></span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div></div></div>
                    <button type="submit" id="submitGoal">إنشاء الهدف</button>
                </form>
            </div>

            <div id="goalDetailScreen" class="screen">
                <div class="header">
                    <button class="header-btn back-btn" data-target="goalsListScreen" title="رجوع"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><polyline points="15 6 21 12 15 18"></polyline></svg></button>
                    <h1>تفاصيل الهدف</h1>
                    <span style="width: 45px;"></span> <!-- Spacer for alignment -->
                </div>
                <div id="goalDetailHeader"><h2 id="goalDetailName"></h2><p id="goalDetailSummary"></p></div>
                <div id="planDetailContainer"></div>
            </div>
            
            <div id="archiveScreen" class="screen">
                <div class="header">
                    <button class="header-btn back-btn" data-target="goalsListScreen" title="رجوع"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><polyline points="15 6 21 12 15 18"></polyline></svg></button>
                    <h1>الأرشيف</h1>
                    <span style="width: 45px;"></span> <!-- Spacer for alignment -->
                </div>
                <div id="archivedGoalsContainer"></div>
                <div id="noArchivedGoalsMessage" style="display: none;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg><p style="font-size: 16px;">لا توجد أهداف مكتملة في الأرشيف بعد.</p></div>
                <div class="archive-fab-container">
                    <div id="fab-menu" class="fab-menu">
                        <button class="fab-menu-item" id="fab-export-btn"><span>تصدير البيانات</span><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg></button>
                        <button class="fab-menu-item" id="fab-import-btn"><span>استيراد البيانات</span><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
                    </div>
                    <button id="archive-settings-fab" class="fab" title="إعدادات البيانات"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', `
            <div id="toast-container"></div>
            <div id="confirmation-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content">
                    <p id="modal-message">هل أنت متأكد؟</p>
                    <div class="modal-actions">
                        <button id="modal-confirm-btn" class="modal-btn confirm">نعم، متأكد</button>
                        <button id="modal-cancel-btn" class="modal-btn cancel">إلغاء</button>
                    </div>
                </div>
            </div>
        `);
    }

    /**
     * Updates the custom date input's display with a formatted date string.
     * @param {string} dateValue - The date value in YYYY-MM-DD format.
     */
    function updateDateDisplay(dateValue) {
        const dateDisplaySpan = document.getElementById('dateDisplay');
        if (!dateDisplaySpan) return;

        if (!dateValue) {
            dateDisplaySpan.textContent = 'اختر تاريخ...';
            return;
        }
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
                 dateDisplaySpan.textContent = 'تاريخ غير صالح';
                 return;
            }
            // Use a user-friendly format
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplaySpan.textContent = date.toLocaleDateString('ar-EG-u-nu-latn', options);
        } catch (e) {
            console.error("Error formatting date:", e);
            dateDisplaySpan.textContent = dateValue; // Fallback
        }
    }

    /**
     * Renders the list of active goals.
     */
    function renderGoalsList() {
        const container = document.getElementById('goalsListContainer');
        const noGoalsMsg = document.getElementById('noGoalsMessage');
        container.innerHTML = '';
        noGoalsMsg.style.display = allGoals.length === 0 ? 'block' : 'none';

        allGoals.forEach(goal => {
            const completedCount = goal.plan.filter(p => p.completed).length;
            const progress = goal.plan.length > 0 ? (completedCount / goal.plan.length) * 100 : 0;
            const card = document.createElement('div');
            card.className = 'goal-card';
            card.innerHTML = `
                <div class="goal-card-content" data-goal-id="${goal.id}">
                    <h3>${goal.name}</h3>
                    <div class="details">
                        <span>${goal.type}</span>
                        <span>${completedCount} / ${goal.plan.length} يوم</span>
                    </div>
                    <div class="progress-bar"><div class="progress-bar-fill" style="width: ${progress}%"></div></div>
                </div>
                <div class="actions-container">
                    <button class="icon-btn edit-btn" data-goal-id="${goal.id}" title="تعديل الهدف"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button class="icon-btn delete-btn" data-goal-id="${goal.id}" title="حذف الهدف"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                </div>
            `;
            container.appendChild(card);
        });
    }
    
    /**
     * Renders the list of archived (completed) goals.
     */
    function renderArchivedGoalsList() {
        const container = document.getElementById('archivedGoalsContainer');
        const noGoalsMsg = document.getElementById('noArchivedGoalsMessage');
        container.innerHTML = '';
        noGoalsMsg.style.display = archivedGoals.length === 0 ? 'block' : 'none';
    
        archivedGoals.forEach(goal => {
            const card = document.createElement('div');
            card.className = 'goal-card';
            const completionDate = new Date(goal.completionDate).toLocaleDateString('ar-EG');
            card.innerHTML = `
                <div class="goal-card-content" data-goal-id="${goal.id}" data-is-archived="true">
                    <h3>${goal.name}</h3>
                    <div class="details">
                        <span>${goal.type}</span>
                        <span style="color: var(--primary-color);">مكتمل في: ${completionDate}</span>
                    </div>
                </div>
                <div class="actions-container">
                    <button class="icon-btn unarchive-btn" data-goal-id="${goal.id}" title="إعادة تفعيل الهدف"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg></button>
                    <button class="icon-btn delete-btn" data-goal-id="${goal.id}" data-is-archived="true" title="حذف نهائي"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                </div>
            `;
            container.appendChild(card);
        });
        showScreen('archiveScreen');
    }

    /**
     * Renders the detailed plan for a specific goal.
     * @param {number} goalId - The ID of the goal to display.
     * @param {object} options - Display options.
     * @param {boolean} options.scrollToFirstIncomplete - Whether to scroll to the first unfinished task.
     */
    function renderGoalDetails(goalId, { scrollToFirstIncomplete = true } = {}) {
        const goal = allGoals.find(g => g.id === parseInt(goalId)) || archivedGoals.find(g => g.id === parseInt(goalId));
        if (!goal) {
            showScreen('goalsListScreen');
            return;
        }

        document.getElementById('goalDetailName').textContent = goal.name;
        document.getElementById('goalDetailSummary').textContent = `خطة ${goal.type} لمدة ${goal.plan.length} يومًا`;
        const container = document.getElementById('planDetailContainer');
        container.innerHTML = '';

        goal.plan.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `plan-item ${item.completed ? 'completed' : ''}`;
            
            let dateDisplayHTML = item.date;
            if (item.completed && item.completionDate && item.plannedDate) {
                const planned = new Date(item.plannedDate);
                const completed = new Date(item.completionDate);
                planned.setHours(0, 0, 0, 0);
                completed.setHours(0, 0, 0, 0);

                const completedDateFormatted = new Date(item.completionDate).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long' });
                
                if (completed.getTime() > planned.getTime()) {
                    dateDisplayHTML = `<del>${item.date}</del> <span class="completion-date late">${completedDateFormatted}</span>`;
                } else if (completed.getTime() < planned.getTime()) {
                    dateDisplayHTML = `<del>${item.date}</del> <span class="completion-date on-time">${completedDateFormatted}</span>`;
                }
            }

            itemDiv.innerHTML = `
                <div class="day-marker">${item.day}</div>
                <div class="plan-text-content">
                    <div class="date">${dateDisplayHTML}</div>
                    <div class="task">${item.task}</div>
                </div>
                <div class="complete-action" data-goal-id="${goal.id}" data-day-index="${index}">${item.completed ? '✓' : ''}</div>
            `;
            container.appendChild(itemDiv);
        });

        showScreen('goalDetailScreen');

        if (scrollToFirstIncomplete) {
            setTimeout(() => {
                const firstIncomplete = document.querySelector('#planDetailContainer .plan-item:not(.completed)');
                if (firstIncomplete) {
                    firstIncomplete.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }

    // --- FORM LOGIC & DATA HANDLING ---

    /**
     * Populates the 'from' and 'to' select options based on the chosen unit (Surah, Juz, Page).
     * @param {string} unit - The selected range unit.
     */
    function populateRangeOptions(unit) {
        const fromSelect = document.getElementById('rangeFrom');
        const toSelect = document.getElementById('rangeTo');
        let options;

        if (unit === 'سورة') {
            options = quranData.surahs.map(s => ({ id: s.index, name: s.titleAr }));
        } else if (unit === 'جزء') {
            options = quranData.juzs.map(j => ({ id: j.index, name: `الجزء ${j.index} (${j.start.nameAr})` }));
        } else { // صفحة
            options = quranData.pages.map(p => ({ id: p.index, name: `صفحة ${p.index}` }));
        }

        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        const fragFrom = document.createDocumentFragment();
        const fragTo = document.createDocumentFragment();

        options.forEach(opt => {
            const optFrom = document.createElement('option');
            optFrom.value = opt.id;
            optFrom.textContent = `من: ${opt.name}`;
            fragFrom.appendChild(optFrom);

            const optTo = document.createElement('option');
            optTo.value = opt.id;
            optTo.textContent = `إلى: ${opt.name}`;
            fragTo.appendChild(optTo);
        });

        fromSelect.appendChild(fragFrom);
        toSelect.appendChild(fragTo);

        if (options.length > 0) {
            toSelect.value = options.at(-1).id;
        }
    }
    
    /**
     * Updates the 'to' select options to only show values greater than or equal to the 'from' selection.
     * @param {string} unit - The current range unit.
     */
    function updateRangeToOptions(unit) {
        const fromSelect = document.getElementById('rangeFrom');
        const toSelect = document.getElementById('rangeTo');
        const selectedFromId = parseInt(fromSelect.value);
        const currentToValue = toSelect.value;
    
        let options;
        if (unit === 'سورة') {
            options = quranData.surahs.map(s => ({ id: s.index, name: s.titleAr }));
        } else if (unit === 'جزء') {
            options = quranData.juzs.map(j => ({ id: j.index, name: `الجزء ${j.index} (${j.start.nameAr})` }));
        } else { // صفحة
            options = quranData.pages.map(p => ({ id: p.index, name: `صفحة ${p.index}` }));
        }
    
        const filteredOptions = options.filter(opt => opt.id >= selectedFromId);
    
        toSelect.innerHTML = '';
        const fragTo = document.createDocumentFragment();
        filteredOptions.forEach(opt => {
            const optTo = document.createElement('option');
            optTo.value = opt.id;
            optTo.textContent = `إلى: ${opt.name}`;
            fragTo.appendChild(optTo);
        });
        toSelect.appendChild(fragTo);
    
        if (currentToValue && filteredOptions.some(opt => opt.id == currentToValue)) {
            toSelect.value = currentToValue;
        } else {
            toSelect.value = filteredOptions.at(-1)?.id || '';
        }
    }

    /**
     * Exports all goals (active and archived) to a JSON file.
     */
    function exportGoals() {
        try {
            const dataToExport = {
                version: 1,
                exportedAt: new Date().toISOString(),
                active: allGoals,
                archived: archivedGoals
            };
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const today = new Date().toISOString().slice(0, 10);
            link.href = url;
            link.download = `tarteel_goals_backup_${today}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('تم بدء تحميل ملف النسخ الاحتياطي', 'success');
        } catch (err) {
            console.error('فشل التصدير:', err);
            showToast('حدث خطأ أثناء عملية التصدير', 'error');
        }
    }

    /**
     * Imports goals from a JSON file, replacing current data after confirmation.
     */
    async function importGoals() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if (!importedData || !Array.isArray(importedData.active) || !Array.isArray(importedData.archived)) {
                        throw new Error('الملف غير صالح أو لا يحتوي على البنية المتوقعة.');
                    }
                    const confirmed = await showConfirmationModal('سيؤدي هذا إلى استبدال جميع أهدافك الحالية. هل أنت متأكد من المتابعة؟');
                    if (confirmed) {
                        allGoals = importedData.active;
                        archivedGoals = importedData.archived;
                        saveGoals();
                        renderGoalsList();
                        showScreen('goalsListScreen');
                        showToast('تم استيراد البيانات بنجاح', 'success');
                    }
                } catch (error) {
                    console.error('فشل استيراد الملف:', error);
                    showToast(`خطأ في استيراد الملف: ${error.message}`, 'error', 5000);
                }
            };
            reader.readAsText(file);
        };
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }


    /**
 * Calculates the entire reading/memorization plan based on user inputs.
 * @param {object} goalData - The user-defined goal settings.
 * @returns {Array|null} An array of plan items, or null if calculation fails.
 */
function calculatePlan(goalData) {

    // --- Helper functions for plan calculation (Now robust) ---
    // We use a large multiplier to avoid conflicts. Sura * 10000 + Aya
    const MULTIPLIER = 10000;

    const getComparableVerseValue = ({ index, verse }) => {
        return parseInt(index) * MULTIPLIER + parseInt(verse.replace('verse_', ''));
    };

    const getVerseDetailsFromComparable = (comparable) => {
        if (!comparable || !quranData || !quranData.surahs || quranData.surahs.length === 0) return null;
        
        const suraIndex = Math.floor(comparable / MULTIPLIER);
        const ayaIndex = comparable % MULTIPLIER;

        const sura = quranData.surahs.find(s => s.index == suraIndex);
        if (!sura) return null; // Safety check
        
        return { suraIndex, suraName: sura.titleAr, aya: ayaIndex, suraAyaCount: sura.count };
    };

    const getNextVerse = (comparable) => {
        const details = getVerseDetailsFromComparable(comparable);
        if (!details) return comparable + 1;
        if (details.aya < details.suraAyaCount) {
            return comparable + 1;
        } else {
            const nextSura = quranData.surahs.find(s => s.index == details.suraIndex + 1);
            return nextSura ? getComparableVerseValue({ index: nextSura.index, verse: '1' }) : comparable;
        }
    };

    const getPagesForRange = (range) => {
        let startPage, endPage;
        if (range.unit === 'صفحة') {
            startPage = parseInt(range.from);
            endPage = parseInt(range.to);
        } else if (range.unit === 'جزء') {
            const startJuz = quranData.juzs.find(j => j.index == range.from);
            const endJuz = quranData.juzs.find(j => j.index == range.to);
            if (!startJuz || !endJuz) return [];
            const startPageObj = quranData.pages.find(p => getComparableVerseValue(p.start) <= getComparableVerseValue(startJuz.start) && getComparableVerseValue(startJuz.start) <= getComparableVerseValue(p.end));
            const endPageObj = quranData.pages.find(p => getComparableVerseValue(p.start) <= getComparableVerseValue(endJuz.end) && getComparableVerseValue(endJuz.end) <= getComparableVerseValue(p.end));
            startPage = parseInt(startPageObj?.index);
            endPage = parseInt(endPageObj?.index);
        } else { // 'سورة'
            const startSurah = quranData.surahs.find(s => s.index == range.from);
            const endSurah = quranData.surahs.find(s => s.index == range.to);
            if (!startSurah || !endSurah) return [];
            startPage = parseInt(startSurah.page);
            const endPageObj = quranData.pages.find(p => p.end.index == endSurah.index && p.end.verse === `verse_${endSurah.count}`);
            endPage = endPageObj ? parseInt(endPageObj.index) : Math.max(...quranData.pages.filter(p => p.end.index == endSurah.index).map(p => parseInt(p.index)));
        }
        if (isNaN(startPage) || isNaN(endPage) || startPage > endPage) return [];
        return quranData.pages.filter(p => parseInt(p.index) >= startPage && parseInt(p.index) <= endPage);
    };

    // --- Main plan calculation starts here ---
    let plan = [];
    let currentDate = new Date(goalData.startDate + 'T00:00:00');
    let dayCounter = 1;

    let trueStartVerse, trueEndVerse;
    switch (goalData.range.unit) {
        case 'سورة': {
            const startSurah = quranData.surahs.find(s => s.index == goalData.range.from);
            const endSurah = quranData.surahs.find(s => s.index == goalData.range.to);
            if (!startSurah || !endSurah) { showToast("لم يتم العثور على السورة المحددة", 'error'); return null; }
            trueStartVerse = getComparableVerseValue({ index: startSurah.index, verse: '1' });
            trueEndVerse = getComparableVerseValue({ index: endSurah.index, verse: `${endSurah.count}` });
            break;
        }
        case 'جزء': {
            const startJuz = quranData.juzs.find(j => j.index == goalData.range.from);
            const endJuz = quranData.juzs.find(j => j.index == goalData.to);
            if (!startJuz || !endJuz) { showToast("لم يتم العثور على الجزء المحدد", 'error'); return null; }
            trueStartVerse = getComparableVerseValue(startJuz.start);
            trueEndVerse = getComparableVerseValue(endJuz.end);
            break;
        }
        case 'صفحة': {
            const pagesInRange = getPagesForRange(goalData.range);
            if (pagesInRange.length > 0) {
                trueStartVerse = getComparableVerseValue(pagesInRange[0].start);
                trueEndVerse = getComparableVerseValue(pagesInRange.at(-1).end);
            }
            break;
        }
    }
    
    if (!trueStartVerse || !trueEndVerse) {
        showToast("خطأ: لم يتم تحديد مدى الآيات بشكل صحيح. يرجى مراجعة المدخلات.", 'error', 4000);
        return null;
    }

    const sourceStops = (goalData.quantity.unit === 'ربع') ? quranData.rubs : quranData.pages;
    let stopsInRange = sourceStops
        .map(stop => getComparableVerseValue(stop.end))
        .filter(verse => verse >= trueStartVerse && verse <= trueEndVerse)
        .sort((a, b) => a - b);
        
    if (stopsInRange.length === 0 || stopsInRange.at(-1) < trueEndVerse) {
        stopsInRange.push(trueEndVerse);
    }
    stopsInRange = [...new Set(stopsInRange)];

    let currentTaskStart = trueStartVerse; 

    for (let i = 0; i < stopsInRange.length; i += goalData.quantity.amount) {
        
        let taskEnd = (i + goalData.quantity.amount - 1 < stopsInRange.length) 
            ? stopsInRange[i + goalData.quantity.amount - 1] 
            : trueEndVerse;

        if (taskEnd > trueEndVerse || i + goalData.quantity.amount >= stopsInRange.length) {
            taskEnd = trueEndVerse;
        }
        
        const startDetails = getVerseDetailsFromComparable(currentTaskStart);
        const endDetails = getVerseDetailsFromComparable(taskEnd);
        
        if (!startDetails || !endDetails) {
            console.error("DEBUG: Could not get verse details. This should not happen with Live Server.", {currentTaskStart, taskEnd});
            continue;
        }

        let taskText = (startDetails.suraName === endDetails.suraName)
            ? (startDetails.aya === endDetails.aya) ? `${startDetails.suraName} ${startDetails.aya}` : `${startDetails.suraName} ${startDetails.aya} - ${endDetails.aya}`
            : `${startDetails.suraName} ${startDetails.aya} - ${endDetails.suraName} ${endDetails.aya}`;

        plan.push({
            day: dayCounter++,
            plannedDate: currentDate.toISOString(),
            date: new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(currentDate),
            task: taskText,
            completed: false,
            completionDate: null
        });
        
        const { unit, amount } = goalData.schedule;
        if (unit === 'يوم') currentDate.setDate(currentDate.getDate() + amount);
        else if (unit === 'أسبوع') currentDate.setDate(currentDate.getDate() + (7 * amount));
        else if (unit === 'شهر') currentDate.setMonth(currentDate.getMonth() + amount);
        
        if (taskEnd >= trueEndVerse) break;
        currentTaskStart = getNextVerse(taskEnd);
    }
    
    return plan;
}


    // --- EVENT LISTENERS ---

    // Main event delegation for all clicks
    document.body.addEventListener('click', async (e) => {
        const target = e.target;
        
        // Add new goal
        if (target.closest('[data-action="add-new"]')) {
            currentlyEditingGoalId = null;
            document.getElementById('goalForm').reset();
            const todayString = getTodayDateString();
            document.getElementById('startDate').value = todayString;
            updateDateDisplay(todayString);
            document.querySelector('#form-title').textContent = 'هدف جديد';
            document.getElementById('submitGoal').textContent = 'إنشاء الهدف';
            populateRangeOptions(document.getElementById('rangeUnit').value);
            showScreen('newGoalScreen');
        } 
        // Back button
        else if (target.closest('.back-btn')) {
            showScreen(target.closest('.back-btn').dataset.target);
        }
        // Edit goal
        else if (target.closest('.edit-btn')) {
            const goalId = parseInt(target.closest('.edit-btn').dataset.goalId);
            const goalToEdit = allGoals.find(g => g.id === goalId);
            if (goalToEdit) {
                currentlyEditingGoalId = goalToEdit.id;
                document.querySelector('#form-title').textContent = 'تعديل الهدف';
                document.getElementById('submitGoal').textContent = 'حفظ التعديلات';
                document.getElementById('goalName').value = goalToEdit.name;
                document.getElementById('goalType').value = goalToEdit.type;
                document.getElementById('quantityAmount').value = goalToEdit.quantity.amount;
                document.getElementById('quantityUnit').value = goalToEdit.quantity.unit;
                document.getElementById('scheduleAmount').value = goalToEdit.schedule.amount;
                document.getElementById('scheduleUnit').value = goalToEdit.schedule.unit;
                document.getElementById('startDate').value = goalToEdit.startDate;
                updateDateDisplay(goalToEdit.startDate);
                
                const rangeUnitSelect = document.getElementById('rangeUnit');
                rangeUnitSelect.value = goalToEdit.range.unit;
                populateRangeOptions(goalToEdit.range.unit);
                // Use timeout to ensure options are populated before setting values
                setTimeout(() => {
                    document.getElementById('rangeFrom').value = goalToEdit.range.from;
                    document.getElementById('rangeTo').value = goalToEdit.range.to;
                }, 0);
                showScreen('newGoalScreen');
            }
        } 
        // Unarchive goal
        else if (target.closest('.unarchive-btn')) {
            const goalId = parseInt(target.closest('.unarchive-btn').dataset.goalId);
            const goalToUnarchive = archivedGoals.find(g => g.id === goalId);
            if (goalToUnarchive) {
                archivedGoals = archivedGoals.filter(g => g.id !== goalId);
                allGoals.push(goalToUnarchive);
                saveGoals();
                renderArchivedGoalsList();
                showToast(`تم استعادة الهدف "${goalToUnarchive.name}" بنجاح`, 'success');
            }
        }
        // Delete goal
        else if (target.closest('.delete-btn')) {
            const button = target.closest('.delete-btn');
            const goalId = parseInt(button.dataset.goalId);
            const isArchived = button.dataset.isArchived === 'true';
            const confirmationMessage = isArchived ? "هل أنت متأكد من حذف هذا الهدف نهائياً من الأرشيف؟" : "هل أنت متأكد من حذف هذا الهدف؟";
            const confirmed = await showConfirmationModal(confirmationMessage);
            if (confirmed) {
                if (isArchived) {
                    archivedGoals = archivedGoals.filter(g => g.id !== goalId);
                } else {
                    allGoals = allGoals.filter(g => g.id !== goalId);
                }
                saveGoals();
                showToast('تم حذف الهدف بنجاح', 'error');
                if (isArchived) renderArchivedGoalsList(); else renderGoalsList();
            }
        }
        // Complete a plan item
        else if (target.closest('.complete-action')) {
            const action = target.closest('.complete-action');
            const goalId = parseInt(action.dataset.goalId);
            const goal = allGoals.find(g => g.id === goalId);
            if (goal) {
                const planItem = goal.plan[action.dataset.dayIndex];
                planItem.completed = !planItem.completed;
                planItem.completionDate = planItem.completed ? new Date().toISOString() : null;
                const isGoalComplete = goal.plan.every(p => p.completed);
                if (isGoalComplete) {
                    goal.completionDate = new Date().toISOString();
                    allGoals = allGoals.filter(g => g.id !== goalId);
                    archivedGoals.push(goal);
                    saveGoals();
                    showToast(`اكتمل الهدف "${goal.name}" وتم نقله للأرشيف!`, 'success');
                    showScreen('goalsListScreen');
                } else {
                    saveGoals();
                    renderGoalDetails(goal.id, { scrollToFirstIncomplete: false });
                }
            }
        }
        // Show archive
        else if (target.closest('#showArchiveBtn')) {
            renderArchivedGoalsList();
        }
        // Open goal details
        else if (target.closest('.goal-card-content')) {
            renderGoalDetails(target.closest('.goal-card-content').dataset.goalId);
        }
        // FAB menu toggle
        else if (target.closest('#archive-settings-fab')) {
            target.closest('#archive-settings-fab').classList.toggle('active');
            document.getElementById('fab-menu')?.classList.toggle('active');
        } 
        // FAB export
        else if (target.closest('#fab-export-btn')) {
            exportGoals();
            document.getElementById('archive-settings-fab')?.classList.remove('active');
            document.getElementById('fab-menu')?.classList.remove('active');
        } 
        // FAB import
        else if (target.closest('#fab-import-btn')) {
            importGoals();
            document.getElementById('archive-settings-fab')?.classList.remove('active');
            document.getElementById('fab-menu')?.classList.remove('active');
        }
        // Close FAB menu if clicking outside
        else if (!target.closest('#fab-menu') && !target.closest('#archive-settings-fab')) {
            const fabMenu = document.getElementById('fab-menu');
            if (fabMenu?.classList.contains('active')) {
                document.getElementById('archive-settings-fab')?.classList.remove('active');
                fabMenu.classList.remove('active');
            }
        }
    });

    // Listener for form range dropdown changes
    document.body.addEventListener('change', e => {
        if (e.target.id === 'rangeUnit') {
            populateRangeOptions(e.target.value);
        } else if (e.target.id === 'rangeFrom') {
            updateRangeToOptions(document.getElementById('rangeUnit').value);
        }
    });

    // Listener for goal form submission
    document.body.addEventListener('submit', e => {
        if (e.target.id !== 'goalForm') return;
        e.preventDefault();

        const goalData = {
            name: document.getElementById('goalName').value,
            type: document.getElementById('goalType').value,
            quantity: { amount: parseInt(document.getElementById('quantityAmount').value), unit: document.getElementById('quantityUnit').value },
            range: { unit: document.getElementById('rangeUnit').value, from: document.getElementById('rangeFrom').value, to: document.getElementById('rangeTo').value },
            schedule: { amount: parseInt(document.getElementById('scheduleAmount').value), unit: document.getElementById('scheduleUnit').value },
            startDate: document.getElementById('startDate').value
        };

        const plan = calculatePlan(goalData);

        if (!plan) return; // Stop if plan calculation failed

        if (currentlyEditingGoalId) {
            const goalIndex = allGoals.findIndex(g => g.id === currentlyEditingGoalId);
            if (goalIndex > -1) {
                const originalGoal = allGoals[goalIndex];
                const newPlan = plan.map((newPlanItem, index) => {
                    const oldPlanItem = originalGoal.plan[index];
                    if (oldPlanItem && oldPlanItem.task === newPlanItem.task) {
                        return { ...newPlanItem, completed: oldPlanItem.completed, completionDate: oldPlanItem.completionDate };
                    }
                    return newPlanItem;
                });
                allGoals[goalIndex] = { ...allGoals[goalIndex], ...goalData, plan: newPlan };
            }
        } else {
            const newGoal = { ...goalData, id: Date.now(), plan: plan };
            allGoals.push(newGoal);
        }

        saveGoals();
        e.target.reset();
        currentlyEditingGoalId = null;
        showScreen('goalsListScreen');
    });
    
    /**
 * Initializes the entire application.
 */
function initializeApp() {
    // الخطوة الجديدة: حذف شاشة التحميل الأولية
    const initialLoader = document.getElementById('initial-loading-screen');
    if (initialLoader) {
        initialLoader.remove();
    }

    
    quranData = { pages: quranPagesData, rubs: quranRubsData, surahs: quranSurahsData, juzs: quranJuzsData };

    setupUI();
    loadGoals();

    const startDateInput = document.getElementById('startDate');
    const today = getTodayDateString();
    startDateInput.value = today;
    updateDateDisplay(today);
    startDateInput.addEventListener('change', function() { updateDateDisplay(this.value); });

    showScreen('goalsListScreen');
}

    // --- APPLICATION START ---
    initializeApp();
});


// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // استخدمنا مسار نسبي هنا
    navigator.serviceWorker.register('sw.js') 
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}