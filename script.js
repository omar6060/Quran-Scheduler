document.addEventListener('DOMContentLoaded', () => {
    let quranData = {};
    let allGoals = [];
    const DB_NAME = 'tarteelGoalsApp_Final';

    async function fetchData(url) {
        const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        const response = await fetch(rawUrl);
        if (!response.ok) throw new Error(`فشل تحميل الملف: ${url}`);
        return await response.json();
    }

    async function initializeApp() {
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
            document.getElementById('loadingScreen').innerHTML = `<p style="color:var(--danger-color);">خطأ في تحميل البيانات. يرجى التأكد من اتصالك بالإنترنت وتحديث الصفحة.</p>`;
        }
    }

    function loadGoals() { allGoals = JSON.parse(localStorage.getItem(DB_NAME) || '[]'); }
    function saveGoals() { localStorage.setItem(DB_NAME, JSON.stringify(allGoals)); }

    function setupUI() {
        document.querySelector('.app-container').innerHTML = `
            <div id="goalsListScreen" class="screen"><div class="header"><h1>الأهداف</h1><button class="header-btn" data-action="add-new">＋</button></div><div id="goalsListContainer"></div><div id="noGoalsMessage" style="display: none;"><h3>لا توجد أهداف حالية</h3><p>اضغط على علامة ＋ لبدء هدف جديد</p></div></div>
            <div id="newGoalScreen" class="screen"><div class="header"><button class="header-btn back-btn" data-target="goalsListScreen">➔</button><h1>هدف جديد</h1><div></div></div><form id="goalForm"><div class="form-group"><label for="goalName">اسم الورد</label><input type="text" id="goalName" placeholder="مثال: ختمة رمضان" required></div><div class="form-group"><label for="goalType">نوع الورد</label><select id="goalType"><option value="تلاوة">تلاوة</option><option value="حفظ">حفظ</option><option value="مراجعة">مراجعة</option></select></div><div class="form-group"><label>الكمية</label><div class="compound-input"><input type="number" id="quantityAmount" value="1" min="1"><select id="quantityUnit"><option value="ربع">ربع</option><option value="صفحة">صفحة</option></select></div></div><div class="form-group"><label>المدى</label><div class="compound-input" style="margin-bottom: 10px;"><select id="rangeUnit"><option value="سورة">سورة</option><option value="صفحة">صفحة</option><option value="جزء">جزء</option></select></div><div class="compound-input"><select id="rangeFrom"></select><select id="rangeTo"></select></div></div><div class="form-group"><label>الجدول</label><div class="compound-input"><input type="number" id="scheduleAmount" value="1" min="1"><select id="scheduleUnit"><option value="يوم">يوم</option><option value="أسبوع">أسبوع</option><option value="شهر">شهر</option></select></div></div><div class="form-group"><label for="startDate">وقت البداية</label><input type="date" id="startDate" required></div><button type="submit" id="submitGoal">إنشاء الهدف</button></form></div>
            <div id="goalDetailScreen" class="screen"><div class="header"><button class="header-btn back-btn" data-target="goalsListScreen">➔</button><h1>تفاصيل الهدف</h1><div></div></div><div id="goalDetailHeader"><h2 id="goalDetailName"></h2><p id="goalDetailSummary"></p></div><div id="planDetailContainer"></div></div>
        `;
        document.getElementById('startDate').valueAsDate = new Date();
    }

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        if (screenId === 'goalsListScreen') renderGoalsList();
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
            card.innerHTML = `<div class="goal-card-content" data-goal-id="${goal.id}"><h3>${goal.name}</h3><div class="details"><span>${goal.type}</span><span>${completedCount} / ${goal.plan.length} يوم</span></div><div class="progress-bar"><div class="progress-bar-fill" style="width: ${progress}%"></div></div></div><button class="delete-btn" data-goal-id="${goal.id}" title="حذف الهدف">🗑️</button>`;
            container.appendChild(card);
        });
    }

    function renderGoalDetails(goalId, { scrollToFirstIncomplete = true } = {}) {
        const goal = allGoals.find(g => g.id === parseInt(goalId));
        if (!goal) { showScreen('goalsListScreen'); return; }

        document.getElementById('goalDetailName').textContent = goal.name;
        document.getElementById('goalDetailSummary').textContent = `خطة ${goal.type} لمدة ${goal.plan.length} يومًا`;
        const container = document.getElementById('planDetailContainer');
        container.innerHTML = '';

        goal.plan.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `plan-item ${item.completed ? 'completed' : ''}`;
            itemDiv.innerHTML = `<div class="day-marker">${item.day}</div><div class="plan-text-content"><div class="date">${item.date}</div><div class="task">${item.task}</div></div><div class="complete-action" data-goal-id="${goal.id}" data-day-index="${index}">${item.completed ? '✓' : ''}</div>`;
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

    // امسح أي محتوى قديم
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    // أنشئ Fragment لكل واحدة
    const fragFrom = document.createDocumentFragment();
    const fragTo = document.createDocumentFragment();

    // املاهم جوه Fragment
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

    // بعد ما تجهزهم كلهم، ضيفهم مرة واحدة
    fromSelect.appendChild(fragFrom);
    toSelect.appendChild(fragTo);

    // خلي القيمة الافتراضية في "إلى" تكون آخر عنصر
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
        
        // البحث عن الصفحات التي تحتوي على بداية ونهاية الجزء
        // نبحث عن الصفحة التي تحتوي على بداية الجزء الأول
        const startPageObj = quranData.pages.find(page => {
            const pageStart = getComparableVerseValue(page.start);
            const pageEnd = getComparableVerseValue(page.end);
            const juzStart = getComparableVerseValue(startJuz.start);
            return juzStart >= pageStart && juzStart <= pageEnd;
        });
        
        // نبحث عن الصفحة التي تحتوي على نهاية الجزء الأخير
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
        
        // البحث عن الصفحة التي تحتوي على نهاية السورة الأخيرة
        const endVerseOfEndSurah = `verse_${endSurah.count}`;
        const pageContainingEndVerse = quranData.pages.find(p => 
            p.end.index == endSurah.index && p.end.verse === endVerseOfEndSurah
        );
        
        if (pageContainingEndVerse) {
            endPage = parseInt(pageContainingEndVerse.index);
        } else {
            // إذا لم نجد الصفحة المحددة، نأخذ أعلى رقم صفحة تحتوي على هذه السورة
            const pagesWithEndSurah = quranData.pages.filter(p => p.end.index == endSurah.index);
            if (pagesWithEndSurah.length > 0) {
                endPage = Math.max(...pagesWithEndSurah.map(p => parseInt(p.index)));
            } else {
                endPage = startPage; // في حالة عدم العثور على أي شيء
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
        const goalId = target.closest('[data-goal-id]')?.dataset.goalId;

        if (target.dataset.action === 'add-new') {
            populateRangeOptions(document.getElementById('rangeUnit').value);
            showScreen('newGoalScreen');
        } else if (target.matches('.back-btn')) {
            showScreen(target.dataset.target);
        } else if (target.closest('.goal-card-content')) {
            renderGoalDetails(goalId);
        } else if (target.matches('.delete-btn')) {
            if (confirm("هل أنت متأكد من حذف هذا الهدف؟")) {
                allGoals = allGoals.filter(g => g.id !== parseInt(goalId));
                saveGoals();
                renderGoalsList();
            }
        } else if (target.closest('.complete-action')) {
            const action = target.closest('.complete-action');
            const goal   = allGoals.find(g => g.id === parseInt(action.dataset.goalId));
            if (goal) {
                goal.plan[action.dataset.dayIndex].completed = !goal.plan[action.dataset.dayIndex].completed;
                saveGoals();
                renderGoalDetails(goal.id, { scrollToFirstIncomplete: false });
            }
        }
    });

    document.body.addEventListener('change', e => {
            if (e.target.id === 'rangeUnit') populateRangeOptions(e.target.value);
    });

    document.body.addEventListener('submit', e => {
        if (e.target.id !== 'goalForm') return;
        e.preventDefault();

        const goal = {
            id: Date.now(),
            name: document.getElementById('goalName').value,
            type: document.getElementById('goalType').value,
            quantity: {
                amount: parseInt(document.getElementById('quantityAmount').value),
                unit: document.getElementById('quantityUnit').value
            },
            range: {
                unit: document.getElementById('rangeUnit').value,
                from: document.getElementById('rangeFrom').value, // نقرأها كنص أولاً
                to: document.getElementById('rangeTo').value
            },
            schedule: {
                amount: parseInt(document.getElementById('scheduleAmount').value),
                unit: document.getElementById('scheduleUnit').value
            },
            startDate: document.getElementById('startDate').value
        };

        let plan = [];
        let currentDate = new Date(goal.startDate + 'T00:00:00');
        let dayCounter = 1;

        if (goal.quantity.unit === 'صفحة') {
            const pagesInRange = getPagesForRange(goal.range);
            if (pagesInRange.length === 0) {
                alert("خطأ: لم يتم العثور على صفحات في النطاق المحدد.");
                return;
            }

            for (let i = 0; i < pagesInRange.length; i += goal.quantity.amount) {
                const chunk = pagesInRange.slice(i, i + goal.quantity.amount);
                if (chunk.length === 0) continue;
                
                const first = chunk[0];
                const last = chunk.at(-1);

                const taskText = `${first.start.nameAr} ${first.start.verse.replace('verse_', '')} - ${last.end.nameAr} ${last.end.verse.replace('verse_', '')}`;

                plan.push({
                    day: dayCounter++,
                    date: new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(currentDate),
                    task: taskText, completed: false
                });

                const { unit, amount } = goal.schedule;
                if (unit === 'يوم') currentDate.setDate(currentDate.getDate() + amount);
                else if (unit === 'أسبوع') currentDate.setDate(currentDate.getDate() + (7 * amount));
                else if (unit === 'شهر') currentDate.setMonth(currentDate.getMonth() + amount);
            }
        } else if (goal.quantity.unit === 'ربع') {
            let rangeStartComparable, rangeEndComparable;
            switch(goal.range.unit) {
                case 'سورة': {
                    const startSurah = quranData.surahs.find(s => s.index == goal.range.from);
                    const endSurah = quranData.surahs.find(s => s.index == goal.range.to);
                    rangeStartComparable = getComparableVerseValue({ index: startSurah.index, verse: 'verse_1' });
                    rangeEndComparable = getComparableVerseValue({ index: endSurah.index, verse: `verse_${endSurah.count}` });
                    break;
                }
                case 'جزء': {
                    const startJuz = quranData.juzs.find(j => j.index == goal.range.from);
                    const endJuz = quranData.juzs.find(j => j.index == goal.range.to);
                    rangeStartComparable = getComparableVerseValue(startJuz.start);
                    rangeEndComparable = getComparableVerseValue(endJuz.end);
                    break;
                }
                case 'صفحة': {
                    const pagesInRange = getPagesForRange(goal.range);
                    if (pagesInRange.length === 0) { alert("خطأ: لم يتم العثور على صفحات في النطاق المحدد."); return; }
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
            for (let i = 0; i < rubsInRange.length; i += goal.quantity.amount) {
                const chunk = rubsInRange.slice(i, i + goal.quantity.amount);
                if (!chunk || chunk.length === 0) continue;

                const first = chunk[0];
                const last = chunk.at(-1);
                const taskText = `${first.start.nameAr} ${first.start.verse.replace('verse_', '')} - ${last.end.nameAr} ${last.end.verse.replace('verse_', '')}`;

                plan.push({
                    day: dayCounter++,
                    date: new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(currentDate),
                    task: taskText, completed: false
                });

                const { unit, amount } = goal.schedule;
                if (unit === 'يوم') currentDate.setDate(currentDate.getDate() + amount);
                else if (unit === 'أسبوع') currentDate.setDate(currentDate.getDate() + (7 * amount));
                else if (unit === 'شهر') currentDate.setMonth(currentDate.getMonth() + amount);
            }
        }
        
        goal.plan = plan;
        allGoals.push(goal);
        saveGoals();
        e.target.reset();
        document.getElementById('startDate').valueAsDate = new Date();
        showScreen('goalsListScreen');
    });

    initializeApp();
});