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
    let quranData = {};
    let allGoals = []; // الأهداف النشطة
    let archivedGoals = []; // الأهداف المكتملة
    let currentlyEditingGoalId = null; 
    const DB_NAME = 'tarteelGoalsApp_Final';
    const ARCHIVE_DB_NAME = 'tarteelGoalsApp_Final_Archive'; // اسم جديد لمخزن الأرشيف

    async function fetchData(url) {
        const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        const response = await fetch(rawUrl);
        if (!response.ok) {
            throw new Error(`فشل تحميل الملف: ${url}`);
        }
        return await response.json();
    }

    async function initializeApp() {
    initTheme();
    try {
        const [pages, rubs, surahs, juzs] = await Promise.all([
            fetchData('https://raw.githubusercontent.com/Mohamed-Nagdy/Quran-App-Data/main/quran_metadata/page.json'),
            fetchData('https://raw.githubusercontent.com/Mohamed-Nagdy/Quran-App-Data/main/quran_metadata/rub.json'),
            fetchData('https://raw.githubusercontent.com/Mohamed-Nagdy/Quran-App-Data/main/quran_metadata/surah.json'),
            fetchData('https://raw.githubusercontent.com/Mohamed-Nagdy/Quran-App-Data/main/quran_metadata/juz.json')
        ]);

        quranData = { pages, rubs, surahs, juzs };
        setupUI();
        loadGoals();
        showScreen('goalsListScreen');
    } catch (error) {
        console.error(error);
        // --== التعديل هنا ==--
        // سيعرض الخطأ في الحاوية الرئيسية بدلاً من عنصر غير موجود
        document.querySelector('.app-container').innerHTML = `<p style="color:var(--danger-color); padding: 50px 20px; text-align: center; font-size: 18px;">خطأ في تحميل البيانات.<br>يرجى التأكد من اتصالك بالإنترنت وتحديث الصفحة.</p>`;
    }
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
                    <label for="startDate">وقت البداية</label>
                    <input type="date" id="startDate" required>
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
                <p>لا توجد أهداف مكتملة في الأرشيف بعد.</p>
            </div>
        </div>
    `);
    document.getElementById('startDate').valueAsDate = new Date();
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

        toSelect.value = options.at(-1).id;
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

    document.body.addEventListener('click', (e) => {
    const target = e.target;
    
    // --== الجزء الذي تم تعديله ==--
    // الآن سنتعامل مع كل حالة على حدة بشكل أوضح

    // الحالة 1: الضغط على زر "إضافة جديد"
    if (target.closest('[data-action="add-new"]')) {
        currentlyEditingGoalId = null; 
        document.getElementById('goalForm').reset();
        document.getElementById('startDate').valueAsDate = new Date();
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
            
            alert(`تمت استعادة الهدف "${goalToUnarchive.name}" إلى القائمة النشطة.`);
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

        if (confirm(confirmationMessage)) {
            if (isArchived) {
                archivedGoals = archivedGoals.filter(g => g.id !== goalId);
                saveGoals();
                renderArchivedGoalsList(); // إعادة عرض الأرشيف
            } else {
                allGoals = allGoals.filter(g => g.id !== goalId);
                saveGoals();
                renderGoalsList(); // إعادة عرض القائمة الرئيسية
            }
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
                alert(`اكتمل الهدف "${goal.name}" وتم نقله إلى الأرشيف!`);
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
        if (e.target.id === 'rangeUnit') {
            populateRangeOptions(e.target.value);
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
    let plan = [];
    // ... (انسخ والصق منطق حساب الخطة بالكامل من الكود الأصلي هنا)
    
    // --== بداية منطق حساب الخطة (من الكود الأصلي) ==--
    let currentDate = new Date(goalData.startDate + 'T00:00:00');
    let dayCounter = 1;

    if (goalData.quantity.unit === 'صفحة') {
        const pagesInRange = getPagesForRange(goalData.range);
        if (pagesInRange.length === 0) {
            alert("خطأ: لم يتم العثور على صفحات في النطاق المحدد.");
            return;
        }

        for (let i = 0; i < pagesInRange.length; i += goalData.quantity.amount) {
            const chunk = pagesInRange.slice(i, i + goalData.quantity.amount);
            if (chunk.length === 0) continue;

            const first = chunk[0];
            const last = chunk.at(-1);
            const taskText = `${first.start.nameAr} ${first.start.verse.replace('verse_', '')} - ${last.end.nameAr} ${last.end.verse.replace('verse_', '')}`;

            plan.push({
                day: dayCounter++,
                // سنخزن التاريخ المخطط له بصيغتين: للعرض وللمقارنة
                plannedDate: currentDate.toISOString(), // صيغة قياسية للمقارنة
                date: new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(currentDate), // صيغة للعرض
                task: taskText,
                completed: false,
                completionDate: null // تاريخ الإنجاز الفعلي، فارغ مبدئيًا
            });

            const { unit, amount } = goalData.schedule;
            if (unit === 'يوم') currentDate.setDate(currentDate.getDate() + amount);
            else if (unit === 'أسبوع') currentDate.setDate(currentDate.getDate() + (7 * amount));
            else if (unit === 'شهر') currentDate.setMonth(currentDate.getMonth() + amount);
        }
    } else if (goalData.quantity.unit === 'ربع') {
        let rangeStartComparable, rangeEndComparable;
        // ... (باقي منطق حساب الأرباع كما هو في الكود الأصلي)
        switch (goalData.range.unit) {
            case 'سورة': {
                const startSurah = quranData.surahs.find(s => s.index == goalData.range.from);
                const endSurah = quranData.surahs.find(s => s.index == goalData.range.to);
                rangeStartComparable = getComparableVerseValue({ index: startSurah.index, verse: 'verse_1' });
                rangeEndComparable = getComparableVerseValue({ index: endSurah.index, verse: `verse_${endSurah.count}` });
                break;
            }
            case 'جزء': {
                const startJuz = quranData.juzs.find(j => j.index == goalData.range.from);
                const endJuz = quranData.juzs.find(j => j.index == goalData.range.to);
                rangeStartComparable = getComparableVerseValue(startJuz.start);
                rangeEndComparable = getComparableVerseValue(endJuz.end);
                break;
            }
            case 'صفحة': {
                const pagesInRange = getPagesForRange(goalData.range);
                if (pagesInRange.length === 0) {
                    alert("خطأ: لم يتم العثور على صفحات في النطاق المحدد.");
                    return;
                }
                rangeStartComparable = getComparableVerseValue(pagesInRange[0].start);
                rangeEndComparable = getComparableVerseValue(pagesInRange.at(-1).end);
                break;
            }
        }
        const rubsInRange = quranData.rubs.filter(rub => {
            const rubStartComparable = getComparableVerseValue(rub.start);
            return rubStartComparable >= rangeStartComparable && rubStartComparable <= rangeEndComparable;
        });
        if (rubsInRange.length === 0) {
            alert("خطأ: لم يتم العثور على أرباع في النطاق المحدد.");
            return;
        }
        for (let i = 0; i < rubsInRange.length; i += goalData.quantity.amount) {
            const chunk = rubsInRange.slice(i, i + goalData.quantity.amount);
            if (!chunk || chunk.length === 0) continue;
            const first = chunk[0];
            const last = chunk.at(-1);
            const taskText = `${first.start.nameAr} ${first.start.verse.replace('verse_', '')} - ${last.end.nameAr} ${last.end.verse.replace('verse_', '')}`;
            plan.push({
                day: dayCounter++,
                // سنخزن التاريخ المخطط له بصيغتين: للعرض وللمقارنة
                plannedDate: currentDate.toISOString(), // صيغة قياسية للمقارنة
                date: new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(currentDate), // صيغة للعرض
                task: taskText,
                completed: false,
                completionDate: null // تاريخ الإنجاز الفعلي، فارغ مبدئيًا
            });
            const { unit, amount } = goalData.schedule;
            if (unit === 'يوم') currentDate.setDate(currentDate.getDate() + amount);
            else if (unit === 'أسبوع') currentDate.setDate(currentDate.getDate() + (7 * amount));
            else if (unit === 'شهر') currentDate.setMonth(currentDate.getMonth() + amount);
        }
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
    document.getElementById('startDate').valueAsDate = new Date();
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