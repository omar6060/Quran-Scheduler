// إضافة نظام الثيم
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}
document.addEventListener('DOMContentLoaded', () => {
    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    let quranData = {};
    let allGoals = []; // الأهداف النشطة
    let archivedGoals = []; // الأهداف المكتملة
    let currentlyEditingGoalId = null; 
    const DB_NAME = 'tarteelGoalsApp_Final';
    const ARCHIVE_DB_NAME = 'tarteelGoalsApp_Final_Archive'; // اسم جديد لمخزن الأرشيف

    

    function initializeApp() {
    initTheme();

    // البيانات الآن متاحة مباشرة من المتغيرات التي حملناها
    quranData = { 
        pages: quranPagesData, 
        rubs: quranRubsData, 
        surahs: quranSurahsData, 
        juzs: quranJuzsData 
    };

    // باقي الكود كما هو، بدون أي تغيير
    setupUI();
    loadGoals();
    showScreen('goalsListScreen');
}

// == دالة إظهار إشعار مؤقت (Toast) ==
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // لتفعيل أنيميشن الدخول
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // تأخير بسيط لضمان عمل الأنيميشن

    // لإخفاء وإزالة الإشعار بعد فترة
    setTimeout(() => {
        toast.classList.remove('show');
        // إزالة العنصر من الـ DOM بعد انتهاء أنيميشن الخروج
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
}

// == دالة إظهار مربع التأكيد (Modal) وإرجاع Promise ==
function showConfirmationModal(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmation-modal');
        const messageP = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        messageP.textContent = message;
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);

        const close = (decision) => {
            modal.classList.remove('show');
            modal.addEventListener('transitionend', () => {
                modal.style.display = 'none';
                // إزالة المستمعين لمنع تراكمهم
                confirmBtn.onclick = null;
                cancelBtn.onclick = null;
                resolve(decision);
            }, { once: true });
        };
        
        confirmBtn.onclick = () => close(true);
        cancelBtn.onclick = () => close(false);
    });
}


    function loadGoals() {
        allGoals = JSON.parse(localStorage.getItem(DB_NAME) || '[]');
        archivedGoals = JSON.parse(localStorage.getItem(ARCHIVE_DB_NAME) || '[]');
    }

    function saveGoals() {
        localStorage.setItem(DB_NAME, JSON.stringify(allGoals));
        localStorage.setItem(ARCHIVE_DB_NAME, JSON.stringify(archivedGoals));
    }

    function setupUI() {
    document.querySelector('.app-container').innerHTML = `
        <div id="goalsListScreen" class="screen">
            <div class="header">
                <h1>الأهداف</h1>
                <div style="display: flex; gap: 10px; align-items: center;">
                <button class="header-btn" id="showArchiveBtn" title="الأرشيف">
                        <!-- أيقونة الأرشيف -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    <button class="theme-toggle" onclick="toggleTheme()" title="تبديل الوضع">
                        <!-- أيقونة الشمس الجديدة -->
                        <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                        <!-- أيقونة القمر الجديدة -->
                        <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                    </button>
                    <button class="header-btn" data-action="add-new" title="إضافة هدف جديد">
                        <!-- أيقونة الإضافة الجديدة SVG -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            </div>
            <div id="goalsListContainer"></div>
        <div id="noGoalsMessage" style="display: none;">
                <!-- == بداية الأيقونة الجديدة (أيقونة الهدف) == -->
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                <!-- == نهاية الأيقونة الجديدة == -->
                <p style="font-size: 16px; color: var(--text-secondary);">لا توجد أهداف حالية!<br>اضغط على ＋ في الأعلى لإضافة هدفك الأول.</p>
            </div>
        </div>

        <div id="newGoalScreen" class="screen">
            <div class="header">
                <button class="header-btn back-btn" data-target="goalsListScreen" title="رجوع">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <polyline points="15 6 21 12 15 18"></polyline>
                    </svg>
                </button>
                <h1>هدف جديد</h1>
                <button class="theme-toggle" onclick="toggleTheme()" title="تبديل الوضع">
                    <!-- أيقونة الشمس الجديدة -->
                    <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    <!-- أيقونة القمر الجديدة -->
                    <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </button>
            </div>
            <form id="goalForm">
                <div class="form-group">
                    <label for="goalName">اسم الورد</label>
                    <input type="text" id="goalName" placeholder="مثال: ختمة رمضان" required>
                </div>
                <div class="form-group">
                    <label for="goalType">نوع الورد</label>
                    <select id="goalType">
                        <option value="تلاوة">تلاوة</option>
                        <option value="حفظ">حفظ</option>
                        <option value="مراجعة">مراجعة</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>الكمية</label>
                    <div class="compound-input">
                        <input type="number" id="quantityAmount" value="1" min="1">
                        <select id="quantityUnit">
                            <option value="ربع">ربع</option>
                            <option value="صفحة">صفحة</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>المدى</label>
                    <div class="compound-input" style="margin-bottom: 10px;">
                        <select id="rangeUnit">
                            <option value="سورة">سورة</option>
                            <option value="صفحة">صفحة</option>
                            <option value="جزء">جزء</option>
                        </select>
                    </div>
                    <div class="compound-input">
                        <select id="rangeFrom"></select>
                        <select id="rangeTo"></select>
                    </div>
                </div>
                <div class="form-group">
                    <label>الجدول</label>
                    <div class="compound-input">
                        <input type="number" id="scheduleAmount" value="1" min="1">
                        <select id="scheduleUnit">
                            <option value="يوم">يوم</option>
                            <option value="أسبوع">أسبوع</option>
                            <option value="شهر">شهر</option>
                        </select>
                    </div>
                </div>
                 <div class="form-group">
                    <span class="form-group-label">وقت البداية</span>
                    <!-- هذه هي الحاوية الجديدة التي ستأخذ التصميم -->
                    <div class="date-input-overlay-wrapper">
                        <!-- هذا هو حقل التاريخ الحقيقي -->
                        <input type="date" id="startDate" required>
                        <!-- هذا هو الـ div الجميل الذي يظهر للمستخدم -->
                        <div class="date-overlay">
                            <span id="dateDisplay"></span> <!-- هنا سيعرض التاريخ بالصيغة الجميلة -->
                            <!-- أيقونة SVG بسيطة -->
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                    </div>
                </div>
                <button type="submit" id="submitGoal">إنشاء الهدف</button>
            </form>
        </div>

        <div id="goalDetailScreen" class="screen">
            <div class="header">
                <button class="header-btn back-btn" data-target="goalsListScreen" title="رجوع">
                    
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <polyline points="15 6 21 12 15 18"></polyline>
                    </svg>
                </button>
                <h1>تفاصيل الهدف</h1>
                <button class="theme-toggle" onclick="toggleTheme()" title="تبديل الوضع">
                    <!-- أيقونة الشمس الجديدة -->
                    <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    <!-- أيقونة القمر الجديدة -->
                    <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </button>
            </div>
            <div id="goalDetailHeader">
                <h2 id="goalDetailName"></h2>
                <p id="goalDetailSummary"></p>
            </div>
            <div id="planDetailContainer"></div>
        </div>
    `;
    document.querySelector('.app-container').insertAdjacentHTML('beforeend', `
        <div id="archiveScreen" class="screen">
            <div class="header">
                <button class="header-btn back-btn" data-target="goalsListScreen" title="رجوع">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <polyline points="15 6 21 12 15 18"></polyline>
                    </svg>
                </button>
                <h1>الأرشيف</h1>
                <span style="width: 45px;"></span> <!-- عنصر وهمي للموازنة -->
            </div>
            <div id="archivedGoalsContainer"></div>
            <div id="noArchivedGoalsMessage" style="display: none; text-align: center; color: var(--text-secondary); padding: 50px 20px; border: 2px dashed var(--border-color); border-radius: 12px;">
    <!-- == بداية الأيقونة الجديدة (أيقونة الكأس) == -->
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
        <path d="M4 22h16"></path>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path>
    </svg>
    <!-- == نهاية الأيقونة الجديدة == -->
    <p style="font-size: 16px;">لا توجد أهداف مكتملة في الأرشيف بعد.</p>
</div>
        </div>
    `);

        document.body.insertAdjacentHTML('beforeend', `
        <!-- حاوية الإشعارات المؤقتة (Toasts) -->
        <div id="toast-container"></div>

        <!-- مربع الحوار للتأكيد (Modal) -->
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

    document.getElementById('startDate').value = getTodayDateString();

    const startDateInput = document.getElementById('startDate');
    const dateDisplay = document.getElementById('dateDisplay');

    // دالة لتحديث النص المعروض بالشكل الجميل
    function updateDateDisplay(dateValue) {
        if (!dateValue) {
            dateDisplay.textContent = 'اختر تاريخ...';
            return;
        }
        const date = new Date(dateValue);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = date.toLocaleDateString('ar-EG-u-nu-latn', options);
    }

    // استمع لأي تغيير في قيمة حقل التاريخ الحقيقي
    startDateInput.addEventListener('change', function() {
        updateDateDisplay(this.value);
    });

    // ضبط القيمة الابتدائية عند تحميل الصفحة
    const today = getTodayDateString();
    startDateInput.value = today;
    updateDateDisplay(today); // تحديث الواجهة لتعرض تاريخ اليوم
}


    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        if (screenId === 'goalsListScreen') {
            renderGoalsList();
        }
    }

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
        // --== هنا التعديل الرئيسي ==--
        // أضفنا حاوية للأزرار ووضعنا بداخلها زر التعديل الجديد وزر الحذف
        card.innerHTML = `
            <div class="goal-card-content" data-goal-id="${goal.id}">
                <h3>${goal.name}</h3>
                <div class="details">
                    <span>${goal.type}</span>
                    <span>${completedCount} / ${goal.plan.length} يوم</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            <div class="actions-container">
                <button class="icon-btn edit-btn" data-goal-id="${goal.id}" title="تعديل الهدف">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="icon-btn delete-btn" data-goal-id="${goal.id}" title="حذف الهدف">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderArchivedGoalsList() {
    const container = document.getElementById('archivedGoalsContainer');
    const noGoalsMsg = document.getElementById('noArchivedGoalsMessage');
    container.innerHTML = '';
    noGoalsMsg.style.display = archivedGoals.length === 0 ? 'block' : 'none';

    archivedGoals.forEach(goal => {
        const card = document.createElement('div');
        card.className = 'goal-card';
        // لا نحتاج شريط التقدم أو زر التعديل هنا
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
                <button class="icon-btn unarchive-btn" data-goal-id="${goal.id}" title="إعادة تفعيل الهدف">
                    <!-- أيقونة إلغاء الأرشفة (سهم للأعلى) -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </button>
                <button class="icon-btn delete-btn" data-goal-id="${goal.id}" data-is-archived="true" title="حذف نهائي">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
    showScreen('archiveScreen');
}
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
                                                let dateDisplayHTML;

            // الشرط الحاسم: تأكد من وجود كل البيانات الجديدة قبل استخدامها
            if (item.completed && item.completionDate && item.plannedDate) {
                const planned = new Date(item.plannedDate);
                const completed = new Date(item.completionDate);

                // إجراء أمان إضافي للتحقق من أن التواريخ صالحة
                if (isNaN(planned.getTime()) || isNaN(completed.getTime())) {
                    dateDisplayHTML = item.date; // fallback
                } else {
                    // تجاهل الوقت للمقارنة الدقيقة على مستوى اليوم
                    planned.setHours(0, 0, 0, 0);
                    completed.setHours(0, 0, 0, 0);

                    const completedDateFormatted = new Date(item.completionDate).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long' });

                    if (completed.getTime() > planned.getTime()) {
                        // إنجاز متأخر
                        dateDisplayHTML = `<del>${item.date}</del> <span class="completion-date late">${completedDateFormatted}</span>`;
                    } else if (completed.getTime() < planned.getTime()) {
                        // إنجاز مبكر
                        dateDisplayHTML = `<del>${item.date}</del> <span class="completion-date on-time">${completedDateFormatted}</span>`;
                    } else {
                        // إنجاز في نفس اليوم
                        dateDisplayHTML = item.date;
                    }
                }
            } else {
                // الحالة الافتراضية: للمهام غير المكتملة أو الأهداف القديمة
                dateDisplayHTML = item.date;
            }

            itemDiv.innerHTML = `
                <div class="day-marker">${item.day}</div>
                <div class="plan-text-content">
                    <div class="date">${dateDisplayHTML}</div>
                    <div class="task">${item.task}</div>
                </div>
                <div class="complete-action" data-goal-id="${goal.id}" data-day-index="${index}">
                    ${item.completed ? '✓' : ''}
                </div>
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

    // مسح القائمتين قبل ملئهما
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

    // الوضع الافتراضي: اختيار آخر عنصر في قائمة "إلى"
    if (options.length > 0) {
        toSelect.value = options.at(-1).id;
    }
}

function updateRangeToOptions(unit) {
    const fromSelect = document.getElementById('rangeFrom');
    const toSelect = document.getElementById('rangeTo');
    const selectedFromId = parseInt(fromSelect.value);

    // حفظ القيمة الحالية لقائمة "إلى" لمحاولة الحفاظ عليها إذا كانت لا تزال صالحة
    const currentToValue = toSelect.value;

    let options;
    if (unit === 'سورة') {
        options = quranData.surahs.map(s => ({ id: s.index, name: s.titleAr }));
    } else if (unit === 'جزء') {
        options = quranData.juzs.map(j => ({ id: j.index, name: `الجزء ${j.index} (${j.start.nameAr})` }));
    } else { // صفحة
        options = quranData.pages.map(p => ({ id: p.index, name: `صفحة ${p.index}` }));
    }

    // فلترة الخيارات: اعرض فقط ما هو أكبر من أو يساوي اختيار "من"
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

    // محاولة استعادة القيمة السابقة أو اختيار آخر عنصر كافتراضي
    if (currentToValue && filteredOptions.some(opt => opt.id == currentToValue)) {
        toSelect.value = currentToValue;
    } else {
        toSelect.value = filteredOptions.at(-1)?.id || '';
    }
}
    // ==========================================================
    // ==== بداية الجزء الذي تم تعديله (الدالة التالية) ====
    // ==========================================================
    function getPagesForRange(range) {
        let startPage, endPage;

        if (range.unit === 'صفحة') {
            startPage = parseInt(range.from);
            endPage = parseInt(range.to);
        } else if (range.unit === 'جزء') {
            const startJuz = quranData.juzs.find(j => j.index == range.from);
            const endJuz = quranData.juzs.find(j => j.index == range.to);

            if (!startJuz || !endJuz) {
                console.error('لم يتم العثور على بيانات الجزء المحدد');
                return [];
            }

            const startPageObj = quranData.pages.find(page => {
                const pageStart = getComparableVerseValue(page.start);
                const pageEnd = getComparableVerseValue(page.end);
                const juzStart = getComparableVerseValue(startJuz.start);
                return juzStart >= pageStart && juzStart <= pageEnd;
            });

            const endPageObj = quranData.pages.find(page => {
                const pageStart = getComparableVerseValue(page.start);
                const pageEnd = getComparableVerseValue(page.end);
                const juzEnd = getComparableVerseValue(endJuz.end);
                return juzEnd >= pageStart && juzEnd <= pageEnd;
            });

            if (!startPageObj || !endPageObj) {
                console.error('لم يتم العثور على الصفحات المطابقة للجزء المحدد');
                return [];
            }

            startPage = parseInt(startPageObj.index);
            endPage = parseInt(endPageObj.index);

        } else { // 'سورة'
            const startSurah = quranData.surahs.find(s => s.index == range.from);
            const endSurah = quranData.surahs.find(s => s.index == range.to);
            if (!startSurah || !endSurah) return [];

            startPage = parseInt(startSurah.page);

            const endVerseOfEndSurah = `verse_${endSurah.count}`;
            const pageContainingEndVerse = quranData.pages.find(p =>
                p.end.index == endSurah.index && p.end.verse === endVerseOfEndSurah
            );

            if (pageContainingEndVerse) {
                endPage = parseInt(pageContainingEndVerse.index);
            } else {
                const pagesWithEndSurah = quranData.pages.filter(p => p.end.index == endSurah.index);
                if (pagesWithEndSurah.length > 0) {
                    endPage = Math.max(...pagesWithEndSurah.map(p => parseInt(p.index)));
                } else {
                    endPage = startPage;
                }
            }
        }

        if (isNaN(startPage) || isNaN(endPage) || startPage > endPage) {
            console.error('خطأ في تحديد نطاق الصفحات:', { startPage, endPage, range });
            return [];
        }

        return quranData.pages.filter(p => {
            const pageIndex = parseInt(p.index);
            return pageIndex >= startPage && pageIndex <= endPage;
        });
    }
    // ==========================================================
    // ==== نهاية الجزء الذي تم تعديله ====
    // ==========================================================

    const getComparableVerseValue = ({ index, verse }) => {
        return parseInt(index) * 1000 + parseInt(verse.replace('verse_', ''));
    };

    document.body.addEventListener('click', async (e) => {
    const target = e.target;
    
    // --== الجزء الذي تم تعديله ==--
    // الآن سنتعامل مع كل حالة على حدة بشكل أوضح

    // الحالة 1: الضغط على زر "إضافة جديد"
    if (target.closest('[data-action="add-new"]')) {
        currentlyEditingGoalId = null; 
        document.getElementById('goalForm').reset();
        document.getElementById('startDate').value = getTodayDateString();
        document.querySelector('#newGoalScreen h1').textContent = 'هدف جديد';
        document.getElementById('submitGoal').textContent = 'إنشاء الهدف';
        populateRangeOptions(document.getElementById('rangeUnit').value);
        showScreen('newGoalScreen');
    } 
    // الحالة 2: الضغط على زر "العودة"
    else if (target.closest('.back-btn')) {
    const backButton = target.closest('.back-btn'); 
    showScreen(backButton.dataset.target);       
}
    // الحالة 3: الضغط على زر التعديل
    else if (target.closest('.edit-btn')) {
        const goalId = target.closest('.edit-btn').dataset.goalId;
        const goalToEdit = allGoals.find(g => g.id === parseInt(goalId));
        if (goalToEdit) {
            currentlyEditingGoalId = goalToEdit.id;
            
            document.querySelector('#newGoalScreen h1').textContent = 'تعديل الهدف';
            document.getElementById('submitGoal').textContent = 'حفظ التعديلات';

            document.getElementById('goalName').value = goalToEdit.name;
            document.getElementById('goalType').value = goalToEdit.type;
            document.getElementById('quantityAmount').value = goalToEdit.quantity.amount;
            document.getElementById('quantityUnit').value = goalToEdit.quantity.unit;
            document.getElementById('scheduleAmount').value = goalToEdit.schedule.amount;
            document.getElementById('scheduleUnit').value = goalToEdit.schedule.unit;
            document.getElementById('startDate').value = goalToEdit.startDate;
            
            const rangeUnitSelect = document.getElementById('rangeUnit');
            rangeUnitSelect.value = goalToEdit.range.unit;
            populateRangeOptions(goalToEdit.range.unit);
            
            setTimeout(() => {
                document.getElementById('rangeFrom').value = goalToEdit.range.from;
                document.getElementById('rangeTo').value = goalToEdit.range.to;
            }, 0);

            showScreen('newGoalScreen');
        }
    } 
    
    // الحالة: الضغط على زر إلغاء الأرشفة
    else if (target.closest('.unarchive-btn')) {
        const button = target.closest('.unarchive-btn');
        const goalId = parseInt(button.dataset.goalId);
        const goalToUnarchive = archivedGoals.find(g => g.id === goalId);
        
        if (goalToUnarchive) {
            // إزالة الهدف من الأرشيف
            archivedGoals = archivedGoals.filter(g => g.id !== goalId);
            // إضافته مجددًا إلى قائمة الأهداف النشطة
            allGoals.push(goalToUnarchive);
            
            saveGoals(); // حفظ التغييرات
            renderArchivedGoalsList(); // تحديث شاشة الأرشيف (سيختفي منها الهدف)
            
            showToast(`تم استعادة الهدف "${goalToUnarchive.name}" بنجاح`, 'success');
        }
    }

        // الحالة 4: الضغط على زر الحذف (للأهداف النشطة والمؤرشفة)
    else if (target.closest('.delete-btn')) { 
        const button = target.closest('.delete-btn');
        const goalId = parseInt(button.dataset.goalId);
        const isArchived = button.dataset.isArchived === 'true';
        
        const confirmationMessage = isArchived 
            ? "هل أنت متأكد من حذف هذا الهدف نهائياً من الأرشيف؟"
            : "هل أنت متأكد من حذف هذا الهدف؟";

        const confirmed = await showConfirmationModal(confirmationMessage);
        if (confirmed) {
            if (isArchived) {
                archivedGoals = archivedGoals.filter(g => g.id !== goalId);
                showToast('تم حذف الهدف من الأرشيف نهائياً', 'error');
            } else {
                allGoals = allGoals.filter(g => g.id !== goalId);
                showToast('تم حذف الهدف بنجاح', 'error');
            }
            saveGoals();
            // إعادة عرض الشاشة المناسبة
            if (isArchived) renderArchivedGoalsList();
            else renderGoalsList();
        }
    }
    // الحالة 5: الضغط على زر إكمال اليوم
        // الحالة 5: الضغط على زر إكمال اليوم (منطق مُحسَّن)
    else if (target.closest('.complete-action')) {
        const action = target.closest('.complete-action');
        const goalId = parseInt(action.dataset.goalId);
        const goal = allGoals.find(g => g.id === goalId);
        if (goal) {
            const dayIndex = action.dataset.dayIndex;
            const planItem = goal.plan[dayIndex];
            
            // تحديث حالة الإنجاز والتاريخ
            planItem.completed = !planItem.completed;
            if (planItem.completed) {
                // سجل تاريخ الإنجاز عند الإكمال
                planItem.completionDate = new Date().toISOString();
            } else {
                // امسح التاريخ عند إلغاء الإكمال
                planItem.completionDate = null;
            }

            // التحقق مما إذا كان الهدف قد اكتمل
            const isGoalComplete = goal.plan.every(p => p.completed);
            
            if (isGoalComplete) {
                // سجل تاريخ اكتمال الهدف بالكامل
                goal.completionDate = new Date().toISOString(); 
                
                // نقل الهدف للأرشيف
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
    // الحالة 6 (الأخيرة): الضغط على محتوى الهدف نفسه
        // الضغط على زر عرض الأرشيف
    else if (target.closest('#showArchiveBtn')) {
        renderArchivedGoalsList();
    }
    // الحالة الأخيرة: الضغط على محتوى الهدف نفسه (نشط أو مؤرشف)
    else if (target.closest('.goal-card-content')) {
        const contentDiv = target.closest('.goal-card-content');
        const goalId = parseInt(contentDiv.dataset.goalId);
        const isArchived = contentDiv.dataset.isArchived === 'true';
        
        // البحث في المصفوفة الصحيحة
        const goal = isArchived 
            ? archivedGoals.find(g => g.id === goalId)
            : allGoals.find(g => g.id === goalId);
        
        if (goal) {
             // renderGoalDetails يعمل مع أي كائن هدف، لذا لا نحتاج لتعديله
             renderGoalDetails(goal.id); 
        }
    }
});

    document.body.addEventListener('change', e => {
    // الحالة 1: المستخدم يغير وحدة المدى (مثلاً من سورة إلى جزء)
    if (e.target.id === 'rangeUnit') {
        // هنا، نعيد كل شيء لوضعه الأصلي الكامل وغير المفلتر
        populateRangeOptions(e.target.value);
    }
    // الحالة 2: المستخدم يغير قيمة "من" فقط
    else if (e.target.id === 'rangeFrom') {
        // هنا فقط، نقوم بفلترة قائمة "إلى"
        const rangeUnit = document.getElementById('rangeUnit').value;
        updateRangeToOptions(rangeUnit);
    }
});

    document.body.addEventListener('submit', e => {
    if (e.target.id !== 'goalForm') return;
    e.preventDefault();

    const goalData = {
        name: document.getElementById('goalName').value,
        type: document.getElementById('goalType').value,
        quantity: {
            amount: parseInt(document.getElementById('quantityAmount').value),
            unit: document.getElementById('quantityUnit').value
        },
        range: {
            unit: document.getElementById('rangeUnit').value,
            from: document.getElementById('rangeFrom').value,
            to: document.getElementById('rangeTo').value
        },
        schedule: {
            amount: parseInt(document.getElementById('scheduleAmount').value),
            unit: document.getElementById('scheduleUnit').value
        },
        startDate: document.getElementById('startDate').value
    };

    // ... (الكود الذي يحسب الخطة يبقى كما هو)
    // ... هنا نضع نفس منطق حساب الخطة الذي كان موجوداً
    
    // ... (انسخ والصق منطق حساب الخطة بالكامل من الكود الأصلي هنا)
    
    // --== بداية منطق حساب الخطة (إصدار 5 - نهائي وموثوق) ==--

// --- دوال مساعدة ---
const getComparableVerse = (sura, aya) => {
    return parseInt(sura) * 10000 + parseInt(aya);
};

const getVerseDetailsFromComparable = (comparable) => {
    if (!comparable || !quranData || !quranData.surahs) return null;
    const suraIndex = Math.floor(comparable / 10000);
    const ayaIndex = comparable % 10000;
    const sura = quranData.surahs.find(s => s.index == suraIndex);
    return {
        suraIndex: suraIndex,
        suraName: sura ? sura.titleAr : "غير معروف",
        aya: ayaIndex,
        suraAyaCount: sura ? sura.count : 0
    };
};

// دالة مساعدة جديدة وموثوقة للحصول على الآية التالية
const getNextVerse = (comparable) => {
    const details = getVerseDetailsFromComparable(comparable);
    if (!details) return comparable + 1; // Fallback
    
    // إذا لم نكن في نهاية السورة، فقط أضف 1
    if (details.aya < details.suraAyaCount) {
        return comparable + 1;
    } 
    // إذا كنا في نهاية السورة، ابحث عن السورة التالية
    else {
        const nextSura = quranData.surahs.find(s => s.index == details.suraIndex + 1);
        if (nextSura) {
            return getComparableVerse(nextSura.index, 1);
        } else {
            return comparable; // نهاية القرآن
        }
    }
};

// --- الدالة الرئيسية الجديدة لحساب الخطة ---
let plan = [];
let currentDate = new Date(goalData.startDate + 'T00:00:00');
let dayCounter = 1;

// 1. تحديد البداية والنهاية الفعلية للمدى (بالآيات) - (هذا الجزء صحيح ولم يتغير)
let trueStartVerse, trueEndVerse;
switch (goalData.range.unit) {
    case 'سورة': {
        const startSurah = quranData.surahs.find(s => s.index == goalData.range.from);
        const endSurah = quranData.surahs.find(s => s.index == goalData.range.to);
        trueStartVerse = getComparableVerse(startSurah.index, 1);
        trueEndVerse = getComparableVerse(endSurah.index, endSurah.count);
        break;
    }
    case 'جزء': {
        const startJuz = quranData.juzs.find(j => j.index == goalData.range.from);
        const endJuz = quranData.juzs.find(j => j.index == goalData.range.to);
        trueStartVerse = getComparableVerse(startJuz.start.index, startJuz.start.verse.replace('verse_', ''));
        trueEndVerse = getComparableVerse(endJuz.end.index, endJuz.end.verse.replace('verse_', ''));
        break;
    }
    case 'صفحة': {
        const pagesInRange = getPagesForRange(goalData.range);
        if (pagesInRange.length > 0) {
            const firstPage = pagesInRange[0];
            const lastPage = pagesInRange.at(-1);
            trueStartVerse = getComparableVerse(firstPage.start.index, firstPage.start.verse.replace('verse_', ''));
            trueEndVerse = getComparableVerse(lastPage.end.index, lastPage.end.verse.replace('verse_', ''));
        }
        break;
    }
}

if (!trueStartVerse || !trueEndVerse) {
    showToast("خطأ: لم يتم تحديد مدى الآيات بشكل صحيح. يرجى مراجعة المدخلات.", 'error', 4000);
    return;
}

// 2. تجميع كل "نقاط التوقف" ضمن المدى المطلوب (مرة واحدة فقط)
const sourceStops = (goalData.quantity.unit === 'ربع') ? quranData.rubs : quranData.pages;
let stopsInRange = sourceStops
    .map(stop => getComparableVerse(stop.end.index, stop.end.verse.replace('verse_', '')))
    .filter(verse => verse >= trueStartVerse && verse <= trueEndVerse)
    .sort((a, b) => a - b);
    
// ضمان وجود نقطة توقف عند النهاية الفعلية للمدى إذا لم تكن موجودة
if (stopsInRange.length === 0 || stopsInRange.at(-1) < trueEndVerse) {
    stopsInRange.push(trueEndVerse);
}
// إزالة أي تكرار قد يحدث
stopsInRange = [...new Set(stopsInRange)];


// 3. بناء الخطة باستخدام حلقة بسيطة وموثوقة
let currentTaskStart = trueStartVerse;
for (let i = 0; i < stopsInRange.length; i += goalData.quantity.amount) {
    
    // تحديد نهاية المهمة الحالية
    const targetStopIndex = i + goalData.quantity.amount - 1;
    let taskEnd = (targetStopIndex < stopsInRange.length) 
        ? stopsInRange[targetStopIndex] 
        : trueEndVerse;

    // التأكد من أن المهمة الأخيرة تنتهي بالضبط عند نهاية المدى
    if (taskEnd > trueEndVerse || i + goalData.quantity.amount >= stopsInRange.length) {
        taskEnd = trueEndVerse;
    }
    
    // إنشاء نص المهمة
    const startDetails = getVerseDetailsFromComparable(currentTaskStart);
    const endDetails = getVerseDetailsFromComparable(taskEnd);
    if (!startDetails || !endDetails) break; // خروج آمن

    let taskText;
    if (startDetails.suraName === endDetails.suraName) {
        taskText = (startDetails.aya === endDetails.aya)
            ? `${startDetails.suraName} ${startDetails.aya}`
            : `${startDetails.suraName} ${startDetails.aya} - ${endDetails.aya}`;
    } else {
        taskText = `${startDetails.suraName} ${startDetails.aya} - ${endDetails.suraName} ${endDetails.aya}`;
    }

    // إضافة المهمة إلى الخطة
    plan.push({
        day: dayCounter++,
        plannedDate: currentDate.toISOString(),
        date: new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(currentDate),
        task: taskText,
        completed: false,
        completionDate: null
    });
    
    // تحديث تاريخ المهمة القادمة
    const { unit, amount } = goalData.schedule;
    if (unit === 'يوم') currentDate.setDate(currentDate.getDate() + amount);
    else if (unit === 'أسبوع') currentDate.setDate(currentDate.getDate() + (7 * amount));
    else if (unit === 'شهر') currentDate.setMonth(currentDate.getMonth() + amount);
    
    // إذا كانت هذه المهمة قد وصلت لنهاية المدى، نتوقف
    if (taskEnd >= trueEndVerse) break;

    // تحديث بداية المهمة القادمة لتكون الآية التي تلي نهاية المهمة الحالية
    currentTaskStart = getNextVerse(taskEnd);
}

// --== نهاية منطق حساب الخطة ==--

    // --== الجزء الجديد للتحقق من وضع التعديل ==--
    if (currentlyEditingGoalId) {
        // نحن في وضع التعديل
        const goalIndex = allGoals.findIndex(g => g.id === currentlyEditingGoalId);
        if (goalIndex > -1) {
            const originalGoal = allGoals[goalIndex];
            // دمج الإنجاز القديم مع الخطة الجديدة
            const newPlan = plan.map((newPlanItem, index) => {
                const oldPlanItem = originalGoal.plan[index];
                if (oldPlanItem && oldPlanItem.task === newPlanItem.task) {
                    // إذا لم تتغير المهمة، احتفظ بحالة الإنجاز
                    return { ...newPlanItem, completed: oldPlanItem.completed };
                }
                return newPlanItem; // مهمة جديدة أو مختلفة، تبدأ غير مكتملة
            });
            
            allGoals[goalIndex] = { ...allGoals[goalIndex], ...goalData, plan: newPlan };
        }
    } else {
        // نحن في وضع الإضافة (الكود الأصلي)
        const newGoal = { ...goalData, id: Date.now(), plan: plan };
        allGoals.push(newGoal);
    }
    // --===================================--

    saveGoals();
    e.target.reset();
    document.getElementById('startDate').value = getTodayDateString();
    currentlyEditingGoalId = null; // إعادة تعيين حالة التعديل
    showScreen('goalsListScreen');
});
    initializeApp();
    // تحديث أيقونة الثيم عند تغيير الوضع
// استبدل هذا الجزء في نهاية الملف
window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
};
});