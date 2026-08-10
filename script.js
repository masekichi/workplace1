// ==========================================================================
// Chronos Today - Realtime Date & Time Application Script
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // App State
    const state = {
        dateFormat: 'ja', // 'ja', 'en', 'iso'
        is24Hour: true,
        calendarDate: new Date(),
        isDarkTheme: true
    };

    // DOM Elements
    const mainDateEl = document.getElementById('mainDate');
    const mainDayEl = document.getElementById('mainDay');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const ampmEl = document.getElementById('ampm');
    const eraBadgeEl = document.getElementById('eraBadge');
    const dayOfYearBadgeEl = document.getElementById('dayOfYearBadge');
    const weekNumberBadgeEl = document.getElementById('weekNumberBadge');
    const yearProgressPercentEl = document.getElementById('yearProgressPercent');
    const yearProgressBarEl = document.getElementById('yearProgressBar');
    const daysPassedEl = document.getElementById('daysPassed');
    const daysRemainingEl = document.getElementById('daysRemaining');
    const copyDateBtn = document.getElementById('copyDateBtn');
    const toastEl = document.getElementById('toast');
    const toastMsgEl = document.getElementById('toastMsg');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    
    // Calendar DOM Elements
    const calendarMonthYearEl = document.getElementById('calendarMonthYear');
    const calendarDaysEl = document.getElementById('calendarDays');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const todayBtn = document.getElementById('todayBtn');

    // Japanese Days of Week
    const jaDays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const enDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    /* ==========================================================================
       Date Calculation Helpers
       ========================================================================== */
    function getReiwaYear(date) {
        const year = date.getFullYear();
        // Reiwa era started May 1, 2019 (Reiwa 1)
        if (year >= 2019) {
            const reiwaYear = year - 2018;
            return reiwaYear === 1 ? '令和元年' : `令和 ${reiwaYear}年`;
        }
        return `${year}年`;
    }

    function getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    function getTotalDaysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    /* ==========================================================================
       Main Display Update Loop
       ========================================================================== */
    function updateClockAndDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const dayDate = now.getDate();
        const dayOfWeek = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // 1. Time Display
        let displayHours = hours;
        let ampmStr = '';

        if (!state.is24Hour) {
            ampmStr = hours >= 12 ? 'PM' : 'AM';
            displayHours = hours % 12 || 12;
            ampmEl.style.display = 'inline';
            ampmEl.textContent = ampmStr;
        } else {
            ampmEl.style.display = 'none';
        }

        hoursEl.textContent = String(displayHours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');

        // 2. Date Display based on Format
        if (state.dateFormat === 'ja') {
            mainDateEl.textContent = `${year}年${month + 1}月${dayDate}日`;
            mainDayEl.innerHTML = `${jaDays[dayOfWeek]} <span class="en-day">${enDays[dayOfWeek]}</span>`;
        } else if (state.dateFormat === 'en') {
            mainDateEl.textContent = `${enMonths[month]} ${dayDate}, ${year}`;
            mainDayEl.innerHTML = `${enDays[dayOfWeek]} <span class="en-day">(${jaDays[dayOfWeek]})</span>`;
        } else if (state.dateFormat === 'iso') {
            const isoStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayDate).padStart(2, '0')}`;
            mainDateEl.textContent = isoStr;
            mainDayEl.innerHTML = `${jaDays[dayOfWeek]} / ${enDays[dayOfWeek]}`;
        }

        // 3. Badges & Stat Info
        eraBadgeEl.textContent = getReiwaYear(now);
        
        const dayOfYear = getDayOfYear(now);
        const totalDays = getTotalDaysInYear(year);
        const remainingDays = totalDays - dayOfYear;
        const weekNum = getWeekNumber(now);

        dayOfYearBadgeEl.textContent = `${year}年 第${dayOfYear}日目`;
        weekNumberBadgeEl.textContent = `第${weekNum}週`;

        // Progress Bar
        const progressPercent = ((dayOfYear / totalDays) * 100).toFixed(1);
        yearProgressPercentEl.textContent = `${progressPercent}%`;
        yearProgressBarEl.style.width = `${progressPercent}%`;
        daysPassedEl.textContent = dayOfYear;
        daysRemainingEl.textContent = remainingDays;

        // Update World Clocks
        updateWorldClocks(now);
    }

    /* ==========================================================================
       World Clock Updates
       ========================================================================== */
    function updateWorldClocks(now) {
        const cityCards = document.querySelectorAll('.clock-city-card');
        cityCards.forEach(card => {
            const timeZone = card.getAttribute('data-tz');
            if (!timeZone) return;

            try {
                const cityTimeStr = now.toLocaleTimeString('ja-JP', {
                    timeZone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                const cityDateStr = now.toLocaleDateString('ja-JP', {
                    timeZone,
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short'
                });

                const timeEl = card.querySelector('.city-time');
                const dateEl = card.querySelector('.city-date');

                if (timeEl) timeEl.textContent = cityTimeStr;
                if (dateEl) dateEl.textContent = cityDateStr;
            } catch (e) {
                console.error(`Invalid timezone: ${timeZone}`, e);
            }
        });
    }

    /* ==========================================================================
       Interactive Calendar Widget
       ========================================================================== */
    function renderCalendar() {
        const calDate = state.calendarDate;
        const year = calDate.getFullYear();
        const month = calDate.getMonth();

        // Set Month/Year Title
        calendarMonthYearEl.textContent = `${year}年 ${month + 1}月`;

        // Clear Days
        calendarDaysEl.innerHTML = '';

        // First day of current month & last date of current month
        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        const prevMonthLastDate = new Date(year, month, 0).getDate();

        const today = new Date();
        const isCurrentMonthReal = today.getFullYear() === year && today.getMonth() === month;

        // Previous Month Days Padding
        for (let x = firstDayIndex; x > 0; x--) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('cal-day', 'other-month');
            dayDiv.textContent = prevMonthLastDate - x + 1;
            calendarDaysEl.appendChild(dayDiv);
        }

        // Current Month Days
        for (let i = 1; i <= lastDate; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('cal-day');
            dayDiv.textContent = i;

            if (isCurrentMonthReal && i === today.getDate()) {
                dayDiv.classList.add('today');
            }

            calendarDaysEl.appendChild(dayDiv);
        }

        // Next Month Days Padding to complete 5 or 6 rows (42 cells)
        const totalCells = firstDayIndex + lastDate;
        const nextDays = (totalCells > 35 ? 42 : 35) - totalCells;

        for (let j = 1; j <= nextDays; j++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('cal-day', 'other-month');
            dayDiv.textContent = j;
            calendarDaysEl.appendChild(dayDiv);
        }
    }

    /* ==========================================================================
       Copy to Clipboard & Toast
       ========================================================================== */
    function showToast(msg) {
        toastMsgEl.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3000);
    }

    copyDateBtn.addEventListener('click', () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dayOfWeek = jaDays[now.getDay()];
        const reiwa = getReiwaYear(now);

        let copyText = '';
        if (state.dateFormat === 'ja') {
            copyText = `${year}年${now.getMonth() + 1}月${now.getDate()}日 (${dayOfWeek}) [${reiwa}]`;
        } else if (state.dateFormat === 'en') {
            copyText = `${enMonths[now.getMonth()]} ${now.getDate()}, ${year} (${enDays[now.getDay()]})`;
        } else {
            copyText = `${year}-${month}-${day}`;
        }

        navigator.clipboard.writeText(copyText).then(() => {
            showToast(`「${copyText}」をコピーしました！`);
        }).catch(err => {
            console.error('Copy failed', err);
            showToast('コピーに失敗しました');
        });
    });

    /* ==========================================================================
       Event Listeners
       ========================================================================== */
    // Format Toggle Buttons
    document.querySelectorAll('[data-format]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-format]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.dateFormat = e.target.getAttribute('data-format');
            updateClockAndDate();
        });
    });

    // 12/24 Hour Toggle
    const toggle24h = document.getElementById('toggle24h');
    const toggle12h = document.getElementById('toggle12h');

    toggle24h.addEventListener('click', () => {
        toggle24h.classList.add('active');
        toggle12h.classList.remove('active');
        state.is24Hour = true;
        updateClockAndDate();
    });

    toggle12h.addEventListener('click', () => {
        toggle12h.classList.add('active');
        toggle24h.classList.remove('active');
        state.is24Hour = false;
        updateClockAndDate();
    });

    // Calendar Navigation
    prevMonthBtn.addEventListener('click', () => {
        state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
        renderCalendar();
    });

    todayBtn.addEventListener('click', () => {
        state.calendarDate = new Date();
        renderCalendar();
    });

    // Dark/Light Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        state.isDarkTheme = !state.isDarkTheme;
        if (state.isDarkTheme) {
            document.body.classList.remove('light-theme');
            themeIcon.setAttribute('data-lucide', 'sun');
        } else {
            document.body.classList.add('light-theme');
            themeIcon.setAttribute('data-lucide', 'moon');
        }
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });

    /* ==========================================================================
       Initial Launch
       ========================================================================== */
    updateClockAndDate();
    renderCalendar();

    // Start timer interval for continuous ticking
    setInterval(updateClockAndDate, 1000);
});
