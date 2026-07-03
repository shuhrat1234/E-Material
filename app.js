// АИС "Е-Материал" - Логика Приложения
// AIS "E-Material" - Ilova mantiqi

let db = {};
let currentRole = "citizen";
let currentLang = "ru";
let statusChartInstance = null;
let workloadChartInstance = null;
let selectedCaseForAi = null;
let activeModalTab = "info";
let loggedInUser = null;

// --- СЛОВАРЬ ПЕРЕВОДОВ (UZ / RU) ---
const TRANSLATIONS = {
  ru: {
    // Roles
    role_citizen: "Планшет оценки",
    role_investigator: "Следователь: Каримов С.",
    role_chief: "Начальник отделения: Махмудов Ж.",
    role_director: "Начальник СУ",
    role_admin: "Системный администратор",
    
    // Login
    field_select_role: "Выберите роль / пользователя",
    field_password: "Пароль доступа (для демо любой)",
    
    // Common
    common_back: "Назад",
    common_cancel: "Отмена",
    common_save: "Сохранить",
    common_close: "Закрыть",
    common_send_approval: "Отправить на согласование",
    
    // Citizen Terminal (Planshet)
    term_welcome: "Оценка качества обслуживания",
    term_subtitle: "Пожалуйста, выберите сотрудника",
    term_reg_visit: "Зарегистрировать обращение",
    term_reg_desc: "Вход в очередь на прием к сотруднику",
    term_rate_officer: "Оценить качество обслуживания",
    term_rate_desc: "Оставить отзыв",
    term_visit_reg_title: "Регистрация посещения",
    field_full_name: "Ф.И.О. Гражданина / Заявителя",
    field_phone: "Номер телефона (для SMS/Telegram уведомлений)",
    field_select_officer: "Выберите сотрудника, к которому вы направляетесь",
    field_purpose: "Цель визита / Краткое содержание обращения",
    term_submit_reg: "Зарегистрироваться в очереди",
    term_rate_title: "Оценка качества обслуживания",
    term_rate_step1: "Выберите сотрудника, работу которого вы оцениваете",
    term_rate_step2: "Оцените работу сотрудника",
    term_like: "LIKE",
    term_like_desc: "(Вежливое, своевременное обслуживание)",
    term_dislike: "DISLIKE",
    term_dislike_desc: "(Грубое обращение, необоснованное ожидание)",
    term_dislike_reasons: "Укажите причину недовольства:",
    reason_wait: "Длительное ожидание",
    reason_retention: "Удержание без оснований",
    reason_rudeness: "Грубое обращение",
    reason_corruption: "Признаки взяточничества",
    reason_no_rights: "Неразъяснение прав",
    term_submit_feedback: "Отправить оценку",
    term_success_title: "Спасибо! Ваш запрос обработан",
    term_success_back: "Вернуться к оценке",
    term_queue_title: "Монитор очереди (Зона ожидания)",
    
    // Investigator View
    inv_metrics_total: "Мои материалы в работе",
    inv_metrics_closed: "Исполнено за месяц",
    inv_metrics_rating: "Индекс удовлетворенности граждан",
    inv_cases_title: "Мои материалы доследственной проверки",
    inv_new_case_btn: "Новый материал",
    inv_new_case_title: "Регистрация нового материала проверки",
    field_summary_ru: "Содержание обращения (на русском)",
    field_summary_uz: "Содержание обращения (на узбекском)",
    field_term_limit: "Срок рассмотрения (процессуальный)",
    
    // AI Chatbot
    ai_chatbot_title: "AI Правовой Ассистент",
    ai_active: "E-Material AI v1.2",
    ai_tpl_qualify: "Кража vs Мошенничество",
    ai_tpl_checklist: "План действий по краже",
    ai_tpl_reject: "Черновик Отказа в ВУД",
    ai_rec_title: "Аналитика и черновик документа",
    ai_rec_checklist: "Рекомендуемые действия:",
    ai_rec_draft: "Сгенерированный проект постановления:",
    ai_copy_btn: "Копировать",
    
    // Chief View
    chief_metric_total: "БАРЧА МАТЕРИАЛЛАР",
    chief_metric_overdue: "С нарушением срока (Просрочено)",
    chief_metric_today: "Срок истекает сегодня",
    chief_metric_completed: "Исполнено в срок",
    chief_panel_title: "Контроль материалов доследственной проверки",
    chief_filter_dept: "Отдел:",
    chief_approvals_title: "Запросы на согласование",
    chief_ratings_title: "Рейтинг сотрудников отделения",
    
    // Director View
    dir_metric_total: "Всего документов в производстве",
    dir_metric_overdue: "Просрочено в районе",
    dir_metric_approaching: "Срок истекает сегодня / завтра",
    dir_metric_closed: "Исполнено в срок",
    dir_express_title: "Интеллектуальный Экспресс-Анализ состояния",
    dir_express_update: "Обновить сводку",
    dir_chart_status: "Состояние материалов (Статусы)",
    dir_chart_workload: "Распределение нагрузки по сотрудникам (%)",
    dir_materials_title: "Сводный реестр материалов Олмазорского района",
    dir_export_excel: "Выгрузка в Excel",
    opt_all_depts: "Все отделы",
    opt_so: "Следственный отдел",
    opt_od: "Отдел дознания",
    opt_ur: "Уголовный розыск",
    
    // Admin View
    admin_templates_title: "Настройка шаблонов SMS / Telegram-оповещений",
    admin_logs_title: "Журнал действий в системе (Аудит)",
    admin_clear_logs: "Очистить",
    admin_actions_title: "Системные операции",
    admin_reset_desc: "Сброс локального хранилища к первоначальному демо-состоянию. Это сотрет все зарегистрированные вами визиты, отзывы и чаты с ИИ.",
    admin_reset_btn: "Сбросить базу данных (localStorage)",
    
    // Modal
    modal_tab_info: "Общая информация",
    modal_tab_timeline: "Ход прохождения (Цепочка)",
    modal_extension_count: "Количество продлений срока:",
    modal_notif_sent: "Авто-уведомление гражданину:",
    modal_timeline_desc: "История фиксации этапов прохождения обращения и информирования заявителя в АИС «Е-Материал»:",
    modal_close_title: "Принятие процессуального решения",
    field_decision_type: "Тип процессуального решения",
    field_case_number: "Номер возбужденного уголовного дела",
    field_destination_org: "Куда перенаправлено (Наименование органа)",
    field_decision_reason: "Краткое процессуальное обоснование",
    modal_close_ai_hint: "Рекомендуется прикрепить сгенерированный проект документа перед отправкой на подтверждение руководству.",
    opt_decision_reject: "Отказ в возбуждении уголовного дела",
    opt_decision_initiate: "Возбуждение уголовного дела (ВУД)",
    opt_decision_transfer: "Направление по территориальности/подследственности",
    
    // Tables Columns
    col_id: "ID",
    col_citizen: "Заявитель",
    col_summary: "Содержание обращения",
    col_deadline: "Срок",
    col_status: "Статус",
    col_actions: "Действия",
    col_officer: "Исполнитель",
    col_dept: "Подразделение",
    col_satisfaction: "Индекс %",
    col_cases: "Дела"
  },
  uz: {
    // Roles
    role_citizen: "Baholash plansheti",
    role_investigator: "Tergovchi: Karimov S.",
    role_chief: "Bo'lim boshlig'i: Maxmudov J.",
    role_director: "TB Boshlig'i",
    role_admin: "Tizim administratorchi",
    
    // Login
    field_select_role: "Rolni / foydalanuvchini tanlang",
    field_password: "Kirish paroli (demo uchun istalgan)",
    
    // Common
    common_back: "Orqaga",
    common_cancel: "Bekor qilish",
    common_save: "Saqlash",
    common_close: "Yopish",
    common_send_approval: "Tasdiqlashga yuborish",
    
    // Citizen Terminal (Planshet)
    term_welcome: "Xizmat sifatini baholash",
    term_subtitle: "Iltimos, xodimni tanlang",
    term_reg_visit: "Murojaatni ro'yxatdan o'tkazish",
    term_reg_desc: "Xodim qabuliga navbatga turish",
    term_rate_officer: "Xizmat sifatini baholash",
    term_rate_desc: "Fikr-mulohaza qoldirish",
    term_visit_reg_title: "Tashrifni ro'yxatdan o'tkazish",
    field_full_name: "Fuqaro / Murojaatchining F.I.Sh.",
    field_phone: "Telefon raqami (SMS/Telegram xabarnomalar uchun)",
    field_select_officer: "Qabuliga borayotgan xodimingizni tanlang",
    field_purpose: "Tashrif maqsadi / Murojaatning qisqacha mazmuni",
    term_submit_reg: "Navbatga ro'yxatdan o'tish",
    term_rate_title: "Xizmat sifatini baholash",
    term_rate_step1: "Ish faoliyatini baholayotgan xodimingizni tanlang",
    term_rate_step2: "Xodim ishini baholang",
    term_like: "LIKE",
    term_like_desc: "(Xushmuomala, tezkor xizmat)",
    term_dislike: "DISLIKE",
    term_dislike_desc: "(Qo'pol muomala, asossiz kutish)",
    term_dislike_reasons: "Norozilik sababini ko'rsating:",
    reason_wait: "Uzoq kutish",
    reason_retention: "Asossiz ushlab turish",
    reason_rudeness: "Qo'pol munosabat",
    reason_corruption: "Ta'magirlik belgilari",
    reason_no_rights: "Huquqlarni tushuntirmaslik",
    term_submit_feedback: "Bahoni yuborish",
    term_success_title: "Rahmat! So'rovingiz qabul qilindi",
    term_success_back: "Baholashga qaytish",
    term_queue_title: "Navbat monitori (Kutish zonasi)",
    
    // Investigator View
    inv_metrics_total: "Ish yurituvimdagi materiallar",
    inv_metrics_closed: "Bir oyda bajarilgan",
    inv_metrics_rating: "Fuqarolar mamnunlik indeksi",
    inv_cases_title: "Tergovga qadar tekshiruv materiallarim",
    inv_new_case_btn: "Yangi material",
    inv_new_case_title: "Yangi tekshiruv materialini ro'yxatdan o'tkazish",
    field_summary_ru: "Murojaat mazmuni (rus tilida)",
    field_summary_uz: "Murojaat mazmuni (o'zbek tilida)",
    field_term_limit: "Ko'rib chiqish muddati (protsessual)",
    
    // AI Chatbot
    ai_chatbot_title: "AI Huquqiy Assistent",
    ai_active: "E-Material AI v1.2",
    ai_tpl_qualify: "O'g'rilik vs Firibgarlik",
    ai_tpl_checklist: "O'g'rilik bo'yicha harakat rejasi",
    ai_tpl_reject: "Rad etish qarori loyihasi",
    ai_rec_title: "Tahlil va hujjat loyihasi",
    ai_rec_checklist: "Tavsiya etilgan harakatlar:",
    ai_rec_draft: "Yaratilgan qaror loyihasi:",
    ai_copy_btn: "Nusxalash",
    
    // Chief View
    chief_metric_total: "JAMI HUJJATLAR",
    chief_metric_overdue: "Muddati buzilgan (Muddati o'tgan)",
    chief_metric_today: "Muddati bugun tugaydi",
    chief_metric_completed: "Muddati ichida bajarilgan",
    chief_panel_title: "Tergovga qadar tekshiruv hujjatlari nazorati",
    chief_filter_dept: "Bo'lim:",
    chief_approvals_title: "Tasdiqlash so'rovlari",
    chief_ratings_title: "Bo'lim xodimlari reytingi",
    
    // Director View
    dir_metric_total: "Jami ishlab chiqilayotgan hujjatlar",
    dir_metric_overdue: "Tumanda muddati buzilgan",
    dir_metric_approaching: "Muddati bugun/ertaga tugaydi",
    dir_metric_closed: "Muddati ichida bajarilgan",
    dir_express_title: "Intellektual Ekspress-Tahlil hisoboti",
    dir_express_update: "Hisobotni yangilash",
    dir_chart_status: "Materiallar holati (Statuslar)",
    dir_chart_workload: "Xodimlarning ish yuklamasi taqsimoti (%)",
    dir_materials_title: "Olmazor tumani jami materiallar reyestri",
    dir_export_excel: "Excel formatida yuklash",
    opt_all_depts: "Barcha bo'limlar",
    opt_so: "Tergov bo'limi",
    opt_od: "Surishtiruv bo'limi",
    opt_ur: "Jinoyat qidiruv",
    
    // Admin View
    admin_templates_title: "SMS / Telegram xabarnoma shablonlari sozlamalari",
    admin_logs_title: "Tizim amallari jurnali (Audit)",
    admin_clear_logs: "Tozalash",
    admin_actions_title: "Tizim operatsiyalari",
    admin_reset_desc: "Mahalliy xotirani dastlabki demo holatiga qaytarish. Bu siz ro'yxatdan o'tkazgan barcha tashriflar, fikr-mulohazalar va AI suhbatlarini o'chirib tashlaydi.",
    admin_reset_btn: "Ma'lumotlar bazasini tozalash (localStorage)",
    
    // Modal
    modal_tab_info: "Umumiy ma'lumot",
    modal_tab_timeline: "O'tish bosqichlari (Zanjir)",
    modal_extension_count: "Muddati uzaytirilganligi:",
    modal_notif_sent: "Fuqaroga avto-xabarnoma:",
    modal_timeline_desc: "«E-Material» tizimida murojaatni ko'rib chiqish va fuqaroni xabardor qilish bosqichlari tarixi:",
    modal_close_title: "Protsessual qaror qabul qilish",
    field_decision_type: "Protsessual qaror turi",
    field_case_number: "Qo'zg'atilgan jinoyat ishi raqami",
    field_destination_org: "Yuborilgan organ nomi",
    field_decision_reason: "Qisqacha protsessual asoslantirish",
    modal_close_ai_hint: "Rahbariyatga tasdiqlashga yuborishdan oldin AI tomonidan yaratilgan hujjat loyihasini biriktirish tavsiya etiladi.",
    opt_decision_reject: "Jinoyat ishini qo'zg'atishni rad etish",
    opt_decision_initiate: "Jinoyat ishi qo'zg'atish (JIQ)",
    opt_decision_transfer: "Tergovga tegishliligi bo'yicha yuborish",
    
    // Tables Columns
    col_id: "ID",
    col_citizen: "Murojaatchi",
    col_summary: "Murojaat mazmuni",
    col_deadline: "Muddat",
    col_status: "Status",
    col_actions: "Amallar",
    col_officer: "Ijrochi",
    col_dept: "Bo'linma",
    col_satisfaction: "Indeks %",
    col_cases: "Ishlar"
  }
};

const CURRENT_LOGGED_INVESTIGATOR_ID = "off_karimov"; // Demo investigator

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  initDatabase();
  loadLanguageFromStorage();
  
  // Show login gateway by default
  showLoginScreen();
  
  startClock();
});

// --- DATABASE FUNCTIONS ---
function initDatabase() {
  const DB_VERSION = "v21";
  if (localStorage.getItem("ematerial_version") !== DB_VERSION) {
    localStorage.removeItem("ematerial_db");
    localStorage.setItem("ematerial_version", DB_VERSION);
  }
  
  const stored = localStorage.getItem("ematerial_db");
  if (stored) {
    db = JSON.parse(stored);
    if (!db.approvalRequests) db.approvalRequests = [];
  } else {
    db = JSON.parse(JSON.stringify(window.INITIAL_MOCK_DATA));
    saveDb();
  }
}

function saveDb() {
  localStorage.setItem("ematerial_db", JSON.stringify(db));
}

function resetDatabaseToDefault() {
  if (confirm("Вы действительно хотите сбросить базу данных? Barcha ma'lumotlar o'chib ketadi.")) {
    db = JSON.parse(JSON.stringify(window.INITIAL_MOCK_DATA));
    saveDb();
    addAuditLog("Администратор", "Сброс базы данных к начальным настройкам", "Tizim ma'lumotlar bazasini dastlabki holatga qaytarish");
    location.reload();
  }
}

// --- LOGGING ---
function addAuditLog(user, textRu, textUz) {
  const time = new Date().toISOString();
  db.auditLogs.unshift({
    time,
    user,
    actionRu: textRu,
    actionUz: textUz
  });
  saveDb();
}

// --- LANGUAGE SYSTEM ---
function loadLanguageFromStorage() {
  const storedLang = localStorage.getItem("ematerial_lang");
  if (storedLang === "uz" || storedLang === "ru") {
    currentLang = storedLang;
  }
  setLanguage(currentLang);
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("ematerial_lang", lang);
  
  document.getElementById("lang-ru").classList.toggle("active", lang === "ru");
  document.getElementById("lang-uz").classList.toggle("active", lang === "uz");
  document.getElementById("login-lang-ru").classList.toggle("active", lang === "ru");
  document.getElementById("login-lang-uz").classList.toggle("active", lang === "uz");
  
  translatePage();
  
  if (loggedInUser) {
    refreshActiveView();
  }
}

function translatePage() {
  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.setAttribute("placeholder", TRANSLATIONS[currentLang][key]);
      } else {
        el.innerHTML = TRANSLATIONS[currentLang][key];
      }
    }
  });
}

// --- CLOCK ---
function startClock() {
  const display = document.getElementById("clock-display");
  function tick() {
    const now = new Date();
    const str = now.toISOString().replace('T', ' ').substring(0, 19);
    if (display) display.textContent = str;
  }
  tick();
  setInterval(tick, 1000);
}

// --- LOGIN WORKFLOW ---
function showLoginScreen() {
  loggedInUser = null;
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("app-workspace").style.display = "none";
  document.getElementById("login-password").value = "";
  handleLoginRoleChange();
}

function handleLoginRoleChange() {
  const role = document.getElementById("login-role").value;
  const pwGroup = document.getElementById("password-group");
  
  // Planshet rating terminal does not require password
  if (role === "citizen") {
    pwGroup.style.display = "none";
  } else {
    pwGroup.style.display = "block";
  }
}

function handleLogin(event) {
  event.preventDefault();
  const role = document.getElementById("login-role").value;
  const password = document.getElementById("login-password").value;
  
  if (role !== "citizen" && !password) {
    alert(currentLang === 'ru' ? "Пожалуйста, введите пароль!" : "Iltimos, parolni kiriting!");
    return;
  }
  
  currentRole = role;
  loggedInUser = {
    role: role,
    avatar: `<i class="fa-solid fa-user"></i>`,
    name: "User"
  };
  
  if (role === "citizen") {
    loggedInUser.name = currentLang === 'ru' ? "Планшет оценки" : "Baholash plansheti";
    loggedInUser.avatar = `<i class="fa-solid fa-tablet-screen-button"></i>`;
    loggedInUser.roleLabel = currentLang === 'ru' ? "Оценка качества" : "Sifatni baholash";
  } else if (role === "registrator") {
    loggedInUser.name = currentLang === 'ru' ? "Азимов Шавкат" : "Azimov Shavkat";
    loggedInUser.avatar = `<i class="fa-solid fa-pen-nib"></i>`;
    loggedInUser.roleLabel = currentLang === 'ru' ? "Регистратор материалов" : "Materiallar registratori";
  } else if (role === "investigator") {
    loggedInUser.name = currentLang === 'ru' ? "Каримов Сардор" : "Karimov Sardor";
    loggedInUser.avatar = `<i class="fa-solid fa-user-shield"></i>`;
    loggedInUser.roleLabel = currentLang === 'ru' ? "Следователь" : "Tergovchi";
  } else if (role === "chief") {
    loggedInUser.name = currentLang === 'ru' ? "Махмудов Жасур" : "Maxmudov Jasur";
    loggedInUser.avatar = `<i class="fa-solid fa-user-tie"></i>`;
    loggedInUser.roleLabel = currentLang === 'ru' ? "Начальник отделения" : "Tergov bo'limi boshlig'i";
  }
  
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-workspace").style.display = "flex";
  
  // Header details updates
  document.getElementById("header-user-avatar").innerHTML = loggedInUser.avatar;
  document.getElementById("header-user-name").textContent = loggedInUser.name;
  document.getElementById("header-user-role").textContent = loggedInUser.roleLabel;
  
  addAuditLog(loggedInUser.name, "Авторизация в системе", "Tizimga kirish muvaffaqiyatli yakunlandi");
  
  refreshActiveView();
}

function handleLogout() {
  if (confirm(currentLang === 'ru' ? "Вы действительно хотите выйти?" : "Tizimdan chiqishni xohlaysizmi?")) {
    addAuditLog(loggedInUser ? loggedInUser.name : "Пользователь", "Выход из системы", "Tizimdan chiqish");
    showLoginScreen();
  }
}

function refreshActiveView() {
  const views = document.querySelectorAll(".role-view");
  views.forEach(view => {
    view.style.display = "none";
  });
  
  const activeView = document.getElementById(`view-${currentRole}`);
  if (activeView) activeView.style.display = "block";
  
  if (currentRole === "citizen") {
    renderCitizenView();
  } else if (currentRole === "registrator") {
    const regTabBtn = document.getElementById('registrator-tab-btn-register');
    if (regTabBtn) switchRegistratorTab('register');
    renderRegistratorView();
  } else if (currentRole === "investigator") {
    const matItem = document.querySelector('#view-investigator .sidebar-item');
    if (matItem) switchInvPanel('inv-dashboard', matItem);
    renderInvestigatorView();
  } else if (currentRole === "chief") {
    const dashItem = document.querySelector('#view-chief .sidebar-item');
    if (dashItem) switchChiefPanel('chief-dashboard', dashItem);
    renderChiefView();
  }
}

// --- Helper Formatting ---
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getStatusBadge(status) {
  if (status === "изучаемый") {
    return `<span class="badge badge-info">${currentLang === 'ru' ? 'Изучаемый' : 'O\'rganilmoqda'}</span>`;
  } else if (status === "закрыт_в_срок") {
    return `<span class="badge badge-success">${currentLang === 'ru' ? 'Закрыт в срок' : 'Muddatida yopildi'}</span>`;
  } else if (status === "срок_приближается") {
    return `<span class="badge badge-warning">${currentLang === 'ru' ? 'Срок приближается' : 'Yaqinlashmoqda'}</span>`;
  } else if (status === "срок_нарушен") {
    return `<span class="badge badge-danger">${currentLang === 'ru' ? 'Срок нарушен' : 'Muddati buzilgan'}</span>`;
  }
  return `<span class="badge">${status}</span>`;
}

// ==============================================
// SIDEBAR NAVIGATION
// ==============================================
let invChartRegInstance = null;
let invChartDiffInstance = null;
let invChartTypeInstance = null;
let invChartSrcInstance = null;

function switchInvPanel(panelId, itemEl) {
  document.querySelectorAll("#view-investigator .sidebar-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll("#view-investigator .sidebar-item").forEach(i => i.classList.remove("active"));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add("active");
  if (itemEl) itemEl.classList.add("active");
  
  // Render history on demand
  if (panelId === "inv-history") renderInvHistory();
  if (panelId === "inv-dashboard" || panelId === "inv-materials") renderInvestigatorView();
}

function renderInvestigatorAnalytics() {
  const myCases = db.materials.filter(m => m.officerId === CURRENT_LOGGED_INVESTIGATOR_ID);
  
  const dateFrom = document.getElementById("inv-filter-date-from").value;
  const dateTo = document.getElementById("inv-filter-date-to").value;
  const diff = document.getElementById("inv-filter-difficulty").value;
  const type = document.getElementById("inv-filter-type").value;
  const source = document.getElementById("inv-filter-source").value;
  
  let filtered = myCases.filter(c => {
    if (dateFrom && new Date(c.registeredAt) < new Date(dateFrom)) return false;
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(c.registeredAt) > toDate) return false;
    }
    if (diff && c.difficulty != diff) return false;
    if (type && c.materialType !== type) return false;
    if (source && c.sourceFrom !== source) return false;
    return true;
  });

  // 1. Dinamika (Line Chart)
  const datesMap = {};
  filtered.forEach(c => {
    const dStr = c.registeredAt.substring(0, 10);
    datesMap[dStr] = (datesMap[dStr] || 0) + 1;
  });
  const sortedDates = Object.keys(datesMap).sort();
  const lineLabels = sortedDates.map(d => {
    const parts = d.split('-');
    return `${parts[2]}.${parts[1]}`;
  });
  const lineData = sortedDates.map(d => datesMap[d]);

  if (invChartRegInstance) invChartRegInstance.destroy();
  const ctxReg = document.getElementById("invChartRegistration");
  if (ctxReg) {
    invChartRegInstance = new Chart(ctxReg, {
      type: 'line',
      data: {
        labels: lineLabels.length > 0 ? lineLabels : ["Нет данных"],
        datasets: [{
          label: currentLang === 'ru' ? 'Регистраций' : 'Ro\'yxatga olishlar',
          data: lineData.length > 0 ? lineData : [0],
          borderColor: '#1e3a8a',
          backgroundColor: 'rgba(30, 58, 138, 0.05)',
          tension: 0.3,
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 2. Difficulty (Doughnut Chart)
  const diffCounts = [0, 0, 0, 0, 0];
  filtered.forEach(c => {
    const d = c.difficulty;
    if (d >= 1 && d <= 5) diffCounts[d - 1]++;
  });
  
  if (invChartDiffInstance) invChartDiffInstance.destroy();
  const ctxDiff = document.getElementById("invChartDifficulty");
  if (ctxDiff) {
    invChartDiffInstance = new Chart(ctxDiff, {
      type: 'doughnut',
      data: {
        labels: ["1", "2", "3", "4", "5"],
        datasets: [{
          data: diffCounts,
          backgroundColor: ['#1e3a8a', '#3b82f6', '#64748b', '#94a3b8', '#cbd5e1']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 3. Types (Pie Chart)
  const typeCounts = { ariza: 0, bildirgi: 0, sud_ajrimi: 0, boshqa: 0 };
  filtered.forEach(c => {
    const t = c.materialType || 'ariza';
    if (typeCounts[t] !== undefined) typeCounts[t]++;
  });
  
  const typeLabels = {
    ru: ["Заявление", "Рапорт", "Суд. решение", "Другое"],
    uz: ["Ariza", "Bildirgi", "Sud qarori", "Boshqa"]
  };
  
  if (invChartTypeInstance) invChartTypeInstance.destroy();
  const ctxType = document.getElementById("invChartType");
  if (ctxType) {
    invChartTypeInstance = new Chart(ctxType, {
      type: 'pie',
      data: {
        labels: typeLabels[currentLang],
        datasets: [{
          data: [typeCounts.ariza, typeCounts.bildirgi, typeCounts.sud_ajrimi, typeCounts.boshqa],
          backgroundColor: ['#1e3a8a', '#3b82f6', '#64748b', '#cbd5e1']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 4. Sources (Bar Chart)
  const srcCounts = { tashrif: 0, prakuratura: 0, prezident_aparat: 0, iio: 0, portal: 0 };
  filtered.forEach(c => {
    const s = c.sourceFrom || 'tashrif';
    if (srcCounts[s] !== undefined) srcCounts[s]++;
  });
  
  const srcLabels = {
    ru: ["Тамбур", "Прокуратура", "Аппарат През.", "ИИО", "Портал"],
    uz: ["Qabulxona", "Prokuratura", "Prezident ap.", "IIO", "Portal"]
  };

  if (invChartSrcInstance) invChartSrcInstance.destroy();
  const ctxSrc = document.getElementById("invChartSource");
  if (ctxSrc) {
    invChartSrcInstance = new Chart(ctxSrc, {
      type: 'bar',
      data: {
        labels: srcLabels[currentLang],
        datasets: [{
          label: currentLang === 'ru' ? 'Материалов' : 'Hujjatlar',
          data: [srcCounts.tashrif, srcCounts.prakuratura, srcCounts.prezident_aparat, srcCounts.iio, srcCounts.portal],
          backgroundColor: '#1e3a8a'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}

function switchChiefPanel(panelId, itemEl) {
  document.querySelectorAll("#view-chief .sidebar-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll("#view-chief .sidebar-item").forEach(i => i.classList.remove("active"));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add("active");
  if (itemEl) itemEl.classList.add("active");
}

function renderInvHistory() {
  const container = document.getElementById("inv-history-content");
  if (!container) return;
  
  const myCases = db.materials.filter(m => m.officerId === CURRENT_LOGGED_INVESTIGATOR_ID);
  let html = "<div class='timeline'>";
  
  myCases.forEach(c => {
    const title = currentLang === 'ru' ? c.titleRu : c.titleUz;
    if (c.appeals && c.appeals.length > 0) {
      c.appeals.slice().reverse().forEach(a => {
        html += `
          <div class="timeline-step completed">
            <div class="timeline-circle"><i class="fa-solid fa-check" style="font-size:0.5rem;"></i></div>
            <div class="timeline-content">
              <div class="timeline-title">${c.id} — ${a.status}</div>
              <div class="timeline-time">${formatDate(a.time)} | ${c.citizenName}</div>
            </div>
          </div>`;
      });
    }
  });
  
  html += "</div>";
  container.innerHTML = html || "<p style='color:var(--text-muted);'>Нет данных</p>";
}

// ==============================================
// 1. PLANSHET RATING VIEW LOGIC
// ==============================================
let selectedTerminalOfficerId = null;

function renderCitizenView() {
  const rateOfficerGrid = document.getElementById("terminal-rate-officer-grid");
  
  let gridHtml = "";
  db.officers.forEach(off => {
    const name = currentLang === 'ru' ? off.nameRu : off.nameUz;
    const rank = currentLang === 'ru' ? off.rankRu : off.rankUz;
    const dept = db.departments.find(d => d.id === off.deptId);
    const deptName = dept ? (currentLang === 'ru' ? dept.nameRu : dept.nameUz) : "";
    
    gridHtml += `
      <div class="officer-select-card" id="terminal-off-card-${off.id}" onclick="selectTerminalOfficer('${off.id}')">
        <div class="officer-avatar"><i class="fa-solid fa-user"></i></div>
        <div class="officer-info-brief">
          <h4>${name}</h4>
          <p>${rank} | ${deptName}</p>
        </div>
      </div>
    `;
  });
  
  rateOfficerGrid.innerHTML = gridHtml;
  
  selectedTerminalOfficerId = null;
  document.getElementById("terminal-rate-action-container").style.display = "none";
}

function selectTerminalOfficer(officerId) {
  selectedTerminalOfficerId = officerId;
  
  document.querySelectorAll(".officer-select-card").forEach(card => {
    card.classList.remove("active");
  });
  
  const selectedCard = document.getElementById(`terminal-off-card-${officerId}`);
  if (selectedCard) selectedCard.classList.add("active");
  
  document.getElementById("terminal-rate-action-container").style.display = "block";
}

function submitTerminalFeedback(isLike) {
  if (!selectedTerminalOfficerId) return;
  
  const officer = db.officers.find(o => o.id === selectedTerminalOfficerId);
  if (!officer) return;
  
  if (isLike) {
    officer.likes++;
    officer.index = Math.min(100, officer.index + 2);
  } else {
    officer.dislikes++;
    officer.index = Math.max(0, officer.index - 1);
  }
  
  saveDb();
  
  const offName = officer.nameRu;
  const ratingType = isLike ? "Like" : "Dislike";
  addAuditLog("Планшет", `Оценка качества работы сотрудника ${offName}: ${ratingType}`, `Xodim ${offName} ishini baholash: ${ratingType}`);
  
  document.getElementById("terminal-success-text").textContent = currentLang === 'ru' 
    ? `Ваш отзыв принят. Благодаря вам мы становимся лучше!` 
    : `Fikr-mulohazangiz qabul qilindi. Yordamingiz uchun rahmat!`;
  
  // Transition success screen
  document.getElementById("terminal-rate-form").style.display = "none";
  document.getElementById("terminal-success-screen").style.display = "block";
}

function resetTerminalView() {
  document.getElementById("terminal-success-screen").style.display = "none";
  document.getElementById("terminal-rate-form").style.display = "block";
  renderCitizenView();
}

// ==============================================
// 2. REGISTRATOR WORKSPACE LOGIC
// ==============================================
let activeRegistratorTab = "register";

function switchRegistratorTab(tab) {
  activeRegistratorTab = tab;
  document.getElementById("registrator-tab-btn-register").classList.toggle("active", tab === "register");
  document.getElementById("registrator-tab-btn-approvals").classList.toggle("active", tab === "approvals");
  
  document.getElementById("registrator-tab-content-register").style.display = tab === "register" ? "grid" : "none";
  document.getElementById("registrator-tab-content-approvals").style.display = tab === "approvals" ? "block" : "none";
  
  if (tab === "approvals") {
    renderRegistratorApprovals();
  }
}

function populateRegistratorOfficers() {
  const officerSelect = document.getElementById("reg-officer-select");
  if (!officerSelect) return;
  let html = "";
  db.officers.forEach(o => {
    const name = currentLang === 'ru' ? o.nameRu : o.nameUz;
    const rank = currentLang === 'ru' ? o.rankRu : o.rankUz;
    const dept = db.departments.find(d => d.id === o.deptId);
    const deptName = dept ? (currentLang === 'ru' ? dept.nameRu : dept.nameUz) : "";
    html += `<option value="${o.id}">${rank} ${name} (${deptName})</option>`;
  });
  officerSelect.innerHTML = html;
}

function renderRegistratorView() {
  populateRegistratorOfficers();
  renderRegistratorRegistry();
  renderRegistratorApprovals();
}

function renderRegistratorApprovals() {
  const container = document.getElementById("registrator-approvals-list");
  const badge = document.getElementById("sb-registrator-approvals");
  if (!container) return;
  
  const approvalCount = (db.approvalRequests || []).length;
  if (badge) badge.textContent = approvalCount;
  
  if (!db.approvalRequests || db.approvalRequests.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center;">Запросов на согласование нет</p>`;
    return;
  }
  
  let html = "";
  db.approvalRequests.forEach(req => {
    const c = db.materials.find(m => m.id === req.caseId);
    const officer = db.officers.find(o => o.id === req.officerId);
    const offName = officer ? officer.nameRu : "";
    const typeLabel = req.type === "закрыт_в_срок" 
      ? (currentLang === 'ru' ? "Отказ в ВУД" : "JIQni rad etish") 
      : req.type === "возбуждено" ? (currentLang === 'ru' ? "Возбуждение ВУД" : "JIQ qo'zg'atish") : (currentLang === 'ru' ? "Передача дела" : "Tergovga yuborish");
      
    html += `
      <div class="approval-item">
        <div class="approval-info">
          <h5>${req.caseId} &rarr; ${typeLabel}</h5>
          <p>${currentLang === 'ru' ? 'Исполнитель' : 'Ijrochi'}: <strong>${offName}</strong></p>
          <p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">"${req.reason}"</p>
        </div>
        <div class="approval-actions">
          <button class="btn btn-success" style="padding: 0.35rem 0.65rem;" onclick="approveResolution('${req.caseId}')"><i class="fa-solid fa-check"></i></button>
          <button class="btn btn-danger" style="padding: 0.35rem 0.65rem;" onclick="rejectResolution('${req.caseId}')"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function handleRegistratorNewMaterialSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById("reg-citizen-name").value;
  const phone = document.getElementById("reg-citizen-phone").value;
  const titleRu = document.getElementById("reg-title-ru").value;
  const titleUz = document.getElementById("reg-title-uz").value;
  const officerId = document.getElementById("reg-officer-select").value;
  const days = parseInt(document.getElementById("reg-deadline-days").value) || 10;
  const difficulty = parseInt(document.getElementById("reg-difficulty").value) || 3;
  const type = document.getElementById("reg-type").value;
  const source = document.getElementById("reg-source").value;
  
  const officer = db.officers.find(o => o.id === officerId);
  const deptId = officer ? officer.deptId : "so";
  
  const caseId = `MAT-2026-${(db.materials.length + 16).toString().padStart(4, '0')}`;
  
  const regDate = new Date();
  const deadlineDate = new Date();
  deadlineDate.setDate(regDate.getDate() + days);
  
  const newCase = {
    id: caseId,
    citizenName: name,
    citizenPhone: phone,
    titleRu: titleRu,
    titleUz: titleUz,
    registeredAt: regDate.toISOString(),
    deadline: deadlineDate.toISOString(),
    status: "изучаемый",
    officerId: officerId,
    deptId: deptId,
    isAccepted: true,
    extensionCount: 0,
    difficulty: difficulty,
    materialType: type,
    sourceFrom: source,
    appeals: [
      { status: "Обращение гражданина", time: regDate.toISOString() }
    ]
  };
  
  db.materials.push(newCase);
  saveDb();
  
  const offName = officer ? officer.nameRu : "";
  addAuditLog("Регистратор", `Зарегистрирован новый материал ${caseId} для исполнителя ${offName}`, `Yangi tekshiruv materiali ${caseId} ijrochi ${offName}ga biriktirildi`);
  
  // Reset form
  document.getElementById("registrator-new-material-form").reset();
  renderRegistratorView();
  
  alert(currentLang === 'ru' ? `Материал ${caseId} успешно создан!` : `Material ${caseId} muvaffaqiyatli ro'yxatdan o'tkazildi!`);
  
  setTimeout(() => {
    simulateInitialSms(caseId);
  }, 3000);
}

function renderRegistratorRegistry() {
  const tbody = document.getElementById("registrator-registry-table");
  
  let html = "";
  // Sort descending by ID to show newest at top
  const sorted = [...db.materials].reverse();
  
  sorted.forEach(c => {
    const summary = currentLang === 'ru' ? c.titleRu : c.titleUz;
    const officer = db.officers.find(o => o.id === c.officerId);
    const officerName = officer ? (currentLang === 'ru' ? officer.nameRu.split(' ')[0] + ' ' + officer.nameRu.split(' ')[1][0] + '.' : officer.nameUz.split(' ')[0]) : "";
    
    html += `
      <tr>
        <td><strong>${c.id}</strong></td>
        <td>${c.citizenName}<br><span style="font-size:0.75rem;color:var(--text-muted);">${c.citizenPhone}</span></td>
        <td>${officerName}</td>
        <td><div style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${summary}">${summary}</div></td>
        <td>${formatDate(c.deadline)}</td>
        <td>${getStatusBadge(c.status)}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// ==============================================
// 3. INVESTIGATOR WORKSPACE LOGIC
// ==============================================
function renderInvestigatorView() {
  const myOfficer = db.officers.find(o => o.id === CURRENT_LOGGED_INVESTIGATOR_ID);
  
  const myCases = db.materials.filter(m => m.officerId === CURRENT_LOGGED_INVESTIGATOR_ID);
  const totalInWork = myCases.filter(m => m.status !== "закрыт_в_срок").length;
  const totalClosed = myCases.filter(m => m.status === "закрыт_в_срок").length;
  const totalOverdue = myCases.filter(m => m.status === "срок_нарушен").length;
  const totalNew = myCases.filter(m => { const d = new Date(m.registeredAt); const now = new Date(); return (now - d) < 86400000 * 3; }).length;
  
  document.getElementById("inv-metrics-total-all").textContent = myCases.length;
  document.getElementById("inv-metrics-new").textContent = totalNew;
  document.getElementById("inv-metrics-total").textContent = totalInWork;
  document.getElementById("inv-metrics-closed").textContent = totalClosed;
  document.getElementById("inv-metrics-overdue").textContent = totalOverdue;
  document.getElementById("inv-metrics-rating").textContent = `${myOfficer.index}%`;
  
  // Sidebar badges
  const sbTotal = document.getElementById("sb-inv-total");
  const sbClosed = document.getElementById("sb-inv-closed");
  const sbOverdue = document.getElementById("sb-inv-overdue");
  if (sbTotal) sbTotal.textContent = totalInWork;
  if (sbClosed) sbClosed.textContent = totalClosed;
  if (sbOverdue) sbOverdue.textContent = totalOverdue;
  
  const ratingCard = document.getElementById("inv-rating-card");
  if (ratingCard) {
    ratingCard.className = "stat-card-sm";
    if (myOfficer.index >= 86) ratingCard.classList.add("success");
    else if (myOfficer.index >= 71) ratingCard.classList.add("warning");
    else ratingCard.classList.add("danger");
  }
  
  // Apply investigator filters
  let activePanel = "inv-dashboard";
  const activePanelEl = document.querySelector("#view-investigator .sidebar-panel.active");
  if (activePanelEl) {
    activePanel = activePanelEl.id;
  }

  let dateFrom = "", dateTo = "", diff = "", type = "", source = "";
  if (activePanel === "inv-materials") {
    const dfEl = document.getElementById("inv-reg-filter-date-from");
    dateFrom = dfEl ? dfEl.value : "";
    const dtEl = document.getElementById("inv-reg-filter-date-to");
    dateTo = dtEl ? dtEl.value : "";
    const diffEl = document.getElementById("inv-reg-filter-difficulty");
    diff = diffEl ? diffEl.value : "";
    const typeEl = document.getElementById("inv-reg-filter-type");
    type = typeEl ? typeEl.value : "";
    const srcEl = document.getElementById("inv-reg-filter-source");
    source = srcEl ? srcEl.value : "";
  } else {
    const dfEl = document.getElementById("inv-filter-date-from");
    dateFrom = dfEl ? dfEl.value : "";
    const dtEl = document.getElementById("inv-filter-date-to");
    dateTo = dtEl ? dtEl.value : "";
    const diffEl = document.getElementById("inv-filter-difficulty");
    diff = diffEl ? diffEl.value : "";
    const typeEl = document.getElementById("inv-filter-type");
    type = typeEl ? typeEl.value : "";
    const srcEl = document.getElementById("inv-filter-source");
    source = srcEl ? srcEl.value : "";
  }
  
  let filteredCases = myCases.filter(c => {
    if (dateFrom && new Date(c.registeredAt) < new Date(dateFrom)) return false;
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(c.registeredAt) > toDate) return false;
    }
    if (diff && c.difficulty != diff) return false;
    if (type && c.materialType !== type) return false;
    if (source && c.sourceFrom !== source) return false;
    return true;
  });

  // Calculate investigator deadlines on filtered cases
  const dl = calculateDeadlineOffsets(filteredCases);
  document.getElementById("inv-dl-today").textContent = dl.today;
  document.getElementById("inv-dl-tomorrow").textContent = dl.tomorrow;
  document.getElementById("inv-dl-indinga").textContent = dl.indinga;

  // Update single-row summary table
  document.getElementById("inv-tbl-total").textContent = myCases.length;
  document.getElementById("inv-tbl-inwork").textContent = totalInWork;
  document.getElementById("inv-tbl-completed").textContent = totalClosed;
  document.getElementById("inv-tbl-overdue").textContent = totalOverdue;
  document.getElementById("inv-tbl-today").textContent = dl.today;
  document.getElementById("inv-tbl-tomorrow").textContent = dl.tomorrow;
  document.getElementById("inv-tbl-indinga").textContent = dl.indinga;
  document.getElementById("inv-tbl-3days").textContent = dl.days3;
  document.getElementById("inv-tbl-4days").textContent = dl.days4;
  document.getElementById("inv-tbl-5days").textContent = dl.days5;
  document.getElementById("inv-tbl-d1").textContent = myCases.filter(m => m.difficulty === 1).length;
  document.getElementById("inv-tbl-d2").textContent = myCases.filter(m => m.difficulty === 2).length;
  document.getElementById("inv-tbl-d3").textContent = myCases.filter(m => m.difficulty === 3).length;
  document.getElementById("inv-tbl-d4").textContent = myCases.filter(m => m.difficulty === 4).length;
  document.getElementById("inv-tbl-d5").textContent = myCases.filter(m => m.difficulty === 5).length;
  document.getElementById("inv-tbl-index").textContent = `${myOfficer.index}%`;
  
  const tblIndex = document.getElementById("inv-tbl-index");
  if (tblIndex) {
    tblIndex.className = "badge";
    if (myOfficer.index >= 86) tblIndex.classList.add("index-badge-green");
    else if (myOfficer.index >= 71) tblIndex.classList.add("index-badge-yellow");
    else tblIndex.classList.add("index-badge-red");
  }

  // Update difficulty breakdown counters
  const easyCount = filteredCases.filter(c => c.difficulty === 1 || c.difficulty === 2).length;
  const mediumCount = filteredCases.filter(c => c.difficulty === 3).length;
  const hardCount = filteredCases.filter(c => c.difficulty === 4 || c.difficulty === 5).length;
  document.getElementById("inv-diff-easy").textContent = easyCount;
  document.getElementById("inv-diff-medium").textContent = mediumCount;
  document.getElementById("inv-diff-hard").textContent = hardCount;

  const tbody = document.getElementById("investigator-cases-table");
  if (tbody) {
    if (filteredCases.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Материалов нет</td></tr>`;
    } else {
      let html = "";
      filteredCases.forEach(c => {
        const summary = currentLang === 'ru' ? c.titleRu : c.titleUz;
        const actionsCell = c.status === "закрыт_в_срок"
          ? `<button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="viewCaseDetails('${c.id}')"><i class="fa-solid fa-eye"></i></button>`
          : `
            <div style="display: flex; gap: 0.25rem;">
              <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="viewCaseDetails('${c.id}')" title="Детали"><i class="fa-solid fa-eye"></i></button>
              <button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="switchInvPanel('inv-ai',null);loadAiContext('${c.id}')" title="AI Помощник"><i class="fa-solid fa-robot"></i></button>
              <button class="btn btn-success" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="openCloseCaseModal('${c.id}')" title="Решение"><i class="fa-solid fa-gavel"></i></button>
            </div>`;
        
        html += `
          <tr>
            <td><strong>${c.id}</strong></td>
            <td>${c.citizenName}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${c.citizenPhone}</span></td>
            <td><div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${summary}">${summary}</div></td>
            <td>${formatDate(c.deadline)}</td>
            <td>${getStatusBadge(c.status)}</td>
            <td>${actionsCell}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  }
  
  // Render charts dynamically
  renderInvestigatorAnalytics();
}

function simulateInitialSms(caseId) {
  const c = db.materials.find(m => m.id === caseId);
  if (!c) return;
  
  c.appeals.push({ status: "Анализ и решение", time: new Date().toISOString() });
  c.appeals.push({ status: "Оперативная отправка уведомления", time: new Date().toISOString() });
  c.appeals.push({ status: "Прием гражданином уведомления", time: new Date().toISOString() });
  
  saveDb();
  
  addAuditLog("Система информирования", `Отправлено SMS о начале доследственной проверки по делу ${caseId} гражданину ${c.citizenName}`, `Murojaatchi ${c.citizenName}ga ${caseId}-sonli material bo'yicha tergov oldi tekshiruvi boshlangani haqida SMS yuborildi`);
  
  if (currentRole === "investigator") {
    renderInvestigatorView();
  } else if (currentRole === "registrator") {
    renderRegistratorRegistry();
  }
}

function openCloseCaseModal(caseId) {
  const c = db.materials.find(m => m.id === caseId);
  if (!c) return;
  
  document.getElementById("close-case-id").value = caseId;
  const summary = currentLang === 'ru' ? c.titleRu : c.titleUz;
  document.getElementById("close-case-subtitle").innerHTML = `<strong>${caseId}</strong>: ${summary}`;
  
  document.getElementById("close-decision-type").value = "закрыт_в_срок";
  document.getElementById("close-case-reason").value = "";
  document.getElementById("close-case-num").value = "";
  document.getElementById("close-case-org").value = "";
  
  toggleCloseModalFields();
  document.getElementById("close-case-modal").style.display = "flex";
}

function closeCloseCaseModal() {
  document.getElementById("close-case-modal").style.display = "none";
}

function toggleCloseModalFields() {
  const type = document.getElementById("close-decision-type").value;
  document.getElementById("close-case-case-num-group").style.display = type === "возбуждено" ? "block" : "none";
  document.getElementById("close-case-org-group").style.display = type === "перенаправлено" ? "block" : "none";
}

function handleCloseCaseSubmit(event) {
  event.preventDefault();
  
  const caseId = document.getElementById("close-case-id").value;
  const type = document.getElementById("close-decision-type").value;
  const reason = document.getElementById("close-case-reason").value;
  
  const c = db.materials.find(m => m.id === caseId);
  if (!c) return;
  
  let requestDetails = {
    caseId: caseId,
    officerId: c.officerId,
    type: type,
    reason: reason,
    requestedAt: new Date().toISOString()
  };
  
  if (type === "возбуждено") {
    requestDetails.caseNum = document.getElementById("close-case-num").value || `10/26-${Math.floor(Math.random()*900 + 100)}`;
  } else if (type === "перенаправлено") {
    requestDetails.orgName = document.getElementById("close-case-org").value || "РУВД Юнусабадского района";
  }
  
  if (!db.approvalRequests) db.approvalRequests = [];
  db.approvalRequests.push(requestDetails);
  
  c.statusTextRu = "На согласовании у руководства";
  c.statusTextUz = "Rahbariyat tasdig'ida";
  
  saveDb();
  
  addAuditLog("Каримов С. (Следователь)", `Направлен проект решения по делу ${caseId} на согласование руководству`, `${caseId} material bo'yicha qaror loyihasi tasdiqlash uchun rahbariyatga yuborildi`);
  
  closeCloseCaseModal();
  renderInvestigatorView();
  
  alert(currentLang === 'ru' 
    ? "Проект решения успешно направлен начальнику отделения на согласование!" 
    : "Qaror loyihasi tasdiqlash uchun bo'lim boshlig'iga yuborildi!");
}

// ==============================================
// AI LEGAL ASSISTANT CHATBOT LOGIC
// ==============================================
function loadAiContext(caseId) {
  selectedCaseForAi = caseId;
  const c = db.materials.find(m => m.id === caseId);
  if (!c) return;
  
  const title = currentLang === 'ru' ? c.titleRu : c.titleUz;
  
  const chatHistory = document.getElementById("ai-chat-history");
  chatHistory.innerHTML += `
    <div class="chat-message ai">
      Загружен контекст дела <strong>${caseId}</strong>:<br>
      "${title}"<br><br>
      Я готов проанализировать состав, составить список проверочных мероприятий или подготовить проект постановления.
    </div>
  `;
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function handleAiChatKeyPress(event) {
  if (event.key === "Enter") {
    sendAiChatMessage();
  }
}

function sendAiChatMessage() {
  const input = document.getElementById("ai-chat-input");
  const query = input.value.trim();
  if (!query) return;
  
  const chatHistory = document.getElementById("ai-chat-history");
  chatHistory.innerHTML += `<div class="chat-message user">${query}</div>`;
  input.value = "";
  chatHistory.scrollTop = chatHistory.scrollHeight;
  
  addAuditLog("Каримов С. (Следователь)", `AI-чатбот: Запрос: "${query.substring(0, 50)}..."`, `AI-chatbot: So'rov: "${query.substring(0, 50)}..."`);
  
  setTimeout(() => {
    generateAiResponse(query);
  }, 800);
}

function sendAiTemplatePrompt(type) {
  let promptText = "";
  if (type === "qualification") {
    promptText = currentLang === 'ru' 
      ? "Разграничение кражи (ст. 169 УК РУз) и мошенничества (ст. 168 УК РУз) при транзакциях с карты" 
      : "Karta orqali pul o'tkazishda o'g'rilik (JK 169-modda) va firibgarlik (JK 168-modda) huquqiy farqlari";
  } else if (type === "checklist") {
    promptText = currentLang === 'ru' 
      ? "План проверочных действий по заявлению о квартирной краже" 
      : "Xonadon o'g'riligi bo'yicha tergov-tekshiruv harakatlari rejasi";
  } else if (type === "draft_reject") {
    promptText = currentLang === 'ru' 
      ? "Подготовь черновик отказа в возбуждении уголовного дела по краже за отсутствием состава" 
      : "Jinoyat tarkibi yo'qligi sababli o'g'rilik bo'yicha jinoyat ishini qo'zg'atishni rad etish qarori loyihasini tayyorlash";
  }
  
  const chatHistory = document.getElementById("ai-chat-history");
  chatHistory.innerHTML += `<div class="chat-message user">${promptText}</div>`;
  chatHistory.scrollTop = chatHistory.scrollHeight;
  
  addAuditLog("Каримов С. (Следователь)", `AI-чатбот: Шаблон "${type}"`, `AI-chatbot: "${type}" andozasi`);
  
  setTimeout(() => {
    generateAiResponse(promptText, type);
  }, 700);
}

function generateAiResponse(query, type = "general") {
  const chatHistory = document.getElementById("ai-chat-history");
  let aiText = "";
  let checklistHtml = "";
  let draftText = "";
  
  if (type === "qualification" || query.toLowerCase().includes("краж") && query.toLowerCase().includes("мошен")) {
    aiText = currentLang === 'ru'
      ? "Анализ квалификации: Ключевое различие между кражей (ст. 169) и мошенничеством (ст. 168) заключается в способе изъятия. Если виновное лицо использовало чужие реквизиты банковской карты без ведома владельца (например, нашло карту) - это тайное хищение (кража, ст. 169). Если же владелец сам передал код доступа под воздействием обмана - это мошенничество (ст. 168). Коллизионность в судебной практике минимизируется разъяснением Пленума Верховного суда Республики Узбекистан."
      : "Kvalifikatsiya tahlili: O'g'rilik (169-modda) va firibgarlik (168-modda) o'rtasidagi asosiy farq - bu mulkni qo'lga kiritish usuli. Agar shaxs egasining xabarisiz begona bank karta ma'lumotlaridan foydalansa (masalan, topib olingan karta) - bu yashirin talon-toroj (o'g'rilik, 169-modda). Agar karta egasining o'zi aldov ta'sirida kodni bergan bo'lsa - bu firibgarlik (168-modda).";
      
    checklistHtml = currentLang === 'ru'
      ? `<li>Истребовать биллинг телефонных соединений и IP-адрес транзакции.</li>
         <li>Провести допрос потерпевшего о характере передачи банковских данных.</li>
         <li>Направить запрос в процессинговый центр банка о получателе средств.</li>`
      : `<li>Telefon so'zlashuvlari billingi va tranzaksiya amalga oshirilgan IP-manzilni olish.</li>
         <li>Jabrlanuvchini bank ma'lumotlarini qanday topshirganligi yuzasidan so'roq qilish.</li>
         <li>Mablag' qabul qiluvchisi haqida bank protsessing markaziga so'rov yuborish.</li>`;
         
    draftText = currentLang === 'ru'
      ? "ПОСТАНОВЛЕНИЕ\nоб отказе в возбуждении уголовного дела\n\nг. Ташкент                               30 июня 2026 г.\n\nКапитан милиции Каримов С.Б., рассмотрев материалы дела MAT-2026-...\nУСТАНОВИЛ:\nИмели место признаки гражданско-правовых отношений...\nПОСТАНОВИЛ:\n1. В возбуждении дела по ст. 168 УК РУз отказать.\n2. Направить копию прокурору."
      : "QAROR\nJinoyat ishi qo'zg'atishni rad etish to'g'risida\n\nToshkent sh.                            2026 yil 30 iyun\n\nTergovchi kapitan Karimov S.B. MAT-2026-... materialni o'rganib,\nANIQLADI:\nFuqarolar o'rtasida fuqarolik-huquqiy munosabatlar mavjud...\nQAROR QILDI:\n1. JKning 168-moddasi bilan jinoyat ishi qo'zg'atish rad etilsin.\n2. Nusxasi prokurorga yuborilsin.";
  }
  else if (type === "checklist" || query.toLowerCase().includes("план") || query.toLowerCase().includes("действ")) {
    aiText = currentLang === 'ru'
      ? "Составлен алгоритм действий доследственной проверки по факту кражи имущества. Рекомендуется выполнить следующие процессуальные действия в течение 3-х суток:"
      : "Mulk o'g'irligi holati bo'yicha tergov oldi tekshiruv harakatlari algoritmi tuzildi. 3 kun ichida quyidagi protsessual harakatlarni bajarish tavsiya etiladi:";
      
    checklistHtml = currentLang === 'ru'
      ? `<li>Осмотр места происшествия с участием криминалиста (снятие отпечатков пальцев).</li>
         <li>Допрос заявителя и свидетелей, проживающих в непосредственной близости.</li>
         <li>Направление запросов в ОВД соседних районов на выявление аналогичных преступлений.</li>
         <li>Изъятие записей камер наружного видеонаблюдения по периметру.</li>`
      : `<li>Kriminalist ishtirokida voqea joyini ko'zdan kechirish (barmoq izlarini olish).</li>
         <li>Murojaatchi va yaqin atrofda yashovchi guvohlarni so'roq qilish.</li>
         <li>Qo'shni tumanlar IIObasiga shunga o'xshash jinoyatlarni aniqlash bo'yicha so'rovlar yuborish.</li>
         <li>Atrofdagi tashqi videokuzatuv kameralari yozuvlarini olish.</li>`;
         
    draftText = currentLang === 'ru'
      ? "ПЛАН ПРОВЕРОЧНЫХ ДЕЙСТВИЙ\nпо материалу № MAT-2026-...\n\n1. Провести осмотр места происшествия.\n2. Установить свидетелей.\n3. Сделать запрос в архив судимостей.\n\nИсполнитель: Каримов С."
      : "TEKSHIRUV HARAKATLARI REJASI\nMAT-2026-...-sonli material yuzasidan\n\n1. Voqea joyini ko'zdan kechirish.\n2. Guvohlarni aniqlash.\n3. Muqaddam sudlanganlar bazasiga so'rov yuborish.\n\nIjrochi: Karimov S.";
  }
  else if (type === "draft_reject" || query.toLowerCase().includes("отказ") || query.toLowerCase().includes("постановл")) {
    aiText = currentLang === 'ru'
      ? "Шаблон постановления сформирован на основании типовых реквизитов Олмазорского РУВД. Вы можете скопировать его для дальнейшего редактирования в текстовом редакторе."
      : "Qaror andozasi Olmazor tumani IIO FMB rekvizitlari asosida yaratildi. Uni matn muharririga nusxalab olishingiz mumkin.";
      
    checklistHtml = currentLang === 'ru'
      ? `<li>Проверить отсутствие ущерба (признание ущерба малозначительным).</li>
         <li>Приобщить объяснительные сторон спора.</li>
         <li>Зарегистрировать проект решения в АИС Е-Материал.</li>`
      : `<li>Zarar yetkazilmaganini tekshirish (kam ahamiyatli deb topish).</li>
         <li>Nizo taraflarining tushuntirish xatlarini ilova qilish.</li>
         <li>Qaror loyihasini E-Material tizimida ro'yxatdan o'tkazish.</li>`;
         
    draftText = currentLang === 'ru'
      ? "ПОСТАНОВЛЕНИЕ\nоб отказе в возбуждении уголовного дела\n\nг. Ташкент                               30 июня 2026 г.\n\nСледователь СО УКД ОВД Олмазорского района капитан Каримов С.Б.,\nрассмотрев заявление гр-на Абдуллаева А.У. от 20.06.2026 г.,\nУСТАНОВИЛ:\nЗаявитель сообщил о краже, однако в ходе проверки установлено, что телефон был утерян по собственной неосторожности. Признаков состава преступления, предусмотренного ст. 169 УК РУз, не обнаружено.\nРуководствуясь ст. 83 п. 2 УПК РУз,\nПОСТАНОВИЛ:\n1. В возбуждении уголовного дела отказать за отсутствием состава преступления.\n2. Уведомить заявителя о принятом решении."
      : "QAROR\nJinoyat ishi qo'zg'atishni rad etish to'g'risida\n\nToshkent sh.                            2026 yil 30 iyun\n\nOlmazor tumani IIO FMB Tergov bo'limi tergovchisi kapitan Karimov S.B.,\nfuqaro Abdullayev A.U.ning 20.06.2026 yildagi arizasini o'rganib,\nANIQLADI:\nMurojaatchi o'g'rilik haqida xabar bergan, biroq tekshiruv davomida telefon o'zining ehtiyotsizligi oqibatida yo'qolgani aniqlangan. O'g'rilik tarkibi aniqlanmadi.\nJinoyat-protsessual kodeksining 83-moddasi 2-bandiga asosan,\nQAROR QILDI:\n1. Jinoyat tarkibi bo'lmaganligi sababli jinoyat ishi qo'zg'atish rad etilsin.\n2. Murojaatchiga qaror nusxasi yuborilsin.";
  }
  else {
    aiText = currentLang === 'ru'
      ? "Я проанализировал ваш вопрос. В контексте доследственной проверки Олмазорского РУВД, для квалификации правонарушения требуется детальный разбор субъективной стороны деяния. Пожалуйста, уточните детали происшествия."
      : "Sizning savolingizni tahlil qildim. Tergovga qadar tekshiruv doirasida huquqbuzarlikni malakalash uchun qilmishning subyektiv tomonini batafsil o'rganish lozim. Iltimos, batafsilroq ma'lumot bering.";
      
    checklistHtml = `<li>${currentLang === 'ru' ? 'Сбор дополнительных объяснений' : 'Qo\'shimcha tushuntirishlar olish'}</li>`;
    draftText = `// AI Draft: Custom query response`;
  }
  
  chatHistory.innerHTML += `<div class="chat-message ai">${aiText}</div>`;
  chatHistory.scrollTop = chatHistory.scrollHeight;
  
  const resultsPanel = document.getElementById("ai-results-panel");
  document.getElementById("ai-rec-actions").innerHTML = checklistHtml;
  document.getElementById("ai-draft-resolution").textContent = draftText;
  resultsPanel.style.display = "block";
}

// ==============================================
// 4. DEPARTMENT CHIEF VIEW LOGIC (TERGOVCHI BOSHLIG'I)
// ==============================================
function renderChiefView() {
  // Read Chief Filters
  const dateFrom = document.getElementById("chief-filter-date-from").value;
  const dateTo = document.getElementById("chief-filter-date-to").value;
  const diff = document.getElementById("chief-filter-difficulty").value;
  const type = document.getElementById("chief-filter-type").value;
  const source = document.getElementById("chief-filter-source").value;
  
  const filteredCases = db.materials.filter(c => {
    if (dateFrom && new Date(c.registeredAt) < new Date(dateFrom)) return false;
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (new Date(c.registeredAt) > toDate) return false;
    }
    if (diff && c.difficulty != diff) return false;
    if (type && c.materialType !== type) return false;
    if (source && c.sourceFrom !== source) return false;
    return true;
  });

  // Global stats (ALL filtered materials for the chief's overview)
  const allCases = filteredCases;
  const total = allCases.length;
  const inWork = allCases.filter(m => m.status === "изучаемый" || m.status === "срок_приближается").length;
  const completed = allCases.filter(m => m.status === "закрыт_в_срок").length;
  const overdue = allCases.filter(m => m.status === "срок_нарушен").length;
  const approvalCount = (db.approvalRequests || []).length;
  
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl("chief-metric-total", total);
  setEl("chief-metric-new", allCases.filter(m => { const d = new Date(m.registeredAt); const now = new Date(); return (now - d) < 86400000 * 3; }).length);
  setEl("chief-metric-inwork", inWork);
  setEl("chief-metric-completed", completed);
  setEl("chief-metric-overdue", overdue);
  setEl("chief-q-resolution", approvalCount);
  setEl("chief-q-extension", 0);
  
  // Sidebar badges
  setEl("sb-chief-total", total);
  setEl("sb-chief-approvals", approvalCount);
  setEl("sb-chief-overdue", overdue);
  
  const stats = calculateDeadlineOffsets(allCases);
  setEl("chief-dl-today", stats.today);
  setEl("sb-chief-today", stats.today);
  setEl("chief-dl-tomorrow", stats.tomorrow);
  setEl("chief-dl-indinga", stats.indinga);
  setEl("chief-dl-3days", stats.days3);

  // Update difficulty breakdown counters for Chief
  const easyCount = allCases.filter(c => c.difficulty === 1 || c.difficulty === 2).length;
  const mediumCount = allCases.filter(c => c.difficulty === 3).length;
  const hardCount = allCases.filter(c => c.difficulty === 4 || c.difficulty === 5).length;
  setEl("chief-diff-easy", easyCount);
  setEl("chief-diff-medium", mediumCount);
  setEl("chief-diff-hard", hardCount);
  
  // Materials table (all cases under filters)
  const tbody = document.getElementById("chief-materials-table");
  if (tbody) {
    if (allCases.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Материалов нет</td></tr>`;
    } else {
      let html = "";
      allCases.forEach(c => {
        const summary = currentLang === 'ru' ? c.titleRu : c.titleUz;
        const officer = db.officers.find(o => o.id === c.officerId);
        const officerName = officer ? officer.nameRu.split(' ')[0] + ' ' + officer.nameRu.split(' ')[1][0] + '.' : "";
        const citizen = c.citizenName;
        
        let reassignOptions = `<option value="">-- Переназначить --</option>`;
        db.officers.filter(o => o.id !== c.officerId).forEach(o => {
          reassignOptions += `<option value="${o.id}">${o.nameRu.split(' ')[0]}</option>`;
        });
        const reassignSelect = c.status === "закрыт_в_срок" ? "" :
          `<select class="form-control" style="width:auto;padding:0.15rem 0.35rem;font-size:0.7rem;margin-top:0.2rem;" onchange="reassignCase('${c.id}',this.value)">${reassignOptions}</select>`;
        
        html += `
          <tr>
            <td><strong>${c.id}</strong></td>
            <td>${officerName}${reassignSelect}</td>
            <td>${citizen}</td>
            <td><div style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${summary}">${summary}</div></td>
            <td style="font-size:0.78rem;">${formatDate(c.deadline)}</td>
            <td>${getStatusBadge(c.status)}</td>
            <td><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;" onclick="viewCaseDetails('${c.id}')"><i class="fa-solid fa-eye"></i></button></td>
          </tr>`;
      });
      tbody.innerHTML = html;
    }
  }
  
  renderChiefApprovals(null);
  renderChiefDetailedTable();
  renderChiefRatingsTable();
  renderChiefCharts(allCases);
}

let chiefChartRegInstance = null;
let chiefChartRatingInstance = null;
let chiefChartTypeInstance = null;
let chiefChartSrcInstance = null;
let chiefChartDiffInstance = null;

function renderChiefCharts(filteredCases) {
  // 1. Dinamika (Line Chart)
  const datesMap = {};
  filteredCases.forEach(c => {
    const dStr = c.registeredAt.substring(0, 10);
    datesMap[dStr] = (datesMap[dStr] || 0) + 1;
  });
  const sortedDates = Object.keys(datesMap).sort();
  const lineLabels = sortedDates.map(d => {
    const parts = d.split('-');
    return `${parts[2]}.${parts[1]}`;
  });
  const lineData = sortedDates.map(d => datesMap[d]);

  if (chiefChartRegInstance) chiefChartRegInstance.destroy();
  const ctxReg = document.getElementById("chiefChartRegistration");
  if (ctxReg) {
    chiefChartRegInstance = new Chart(ctxReg, {
      type: 'line',
      data: {
        labels: lineLabels.length > 0 ? lineLabels : ["Нет данных"],
        datasets: [{
          label: currentLang === 'ru' ? 'Регистраций' : 'Ro\'yxatga olishlar',
          data: lineData.length > 0 ? lineData : [0],
          borderColor: '#1e3a8a',
          backgroundColor: 'rgba(30, 58, 138, 0.05)',
          tension: 0.3,
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 2. Investigator Indices (Bar Chart)
  const officers = db.officers;
  const offNames = officers.map(o => currentLang === 'ru' ? o.nameRu.split(' ')[0] : o.nameUz.split(' ')[0]);
  const offRatings = officers.map(o => o.index);
  
  if (chiefChartRatingInstance) chiefChartRatingInstance.destroy();
  const ctxRating = document.getElementById("chiefChartOfficersRating");
  if (ctxRating) {
    chiefChartRatingInstance = new Chart(ctxRating, {
      type: 'bar',
      data: {
        labels: offNames,
        datasets: [{
          label: currentLang === 'ru' ? 'Индекс удовлетворенности %' : 'Mamnunlik indeksi %',
          data: offRatings,
          backgroundColor: '#1e3a8a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100 }
        }
      }
    });
  }

  // 3. Types (Pie Chart)
  const typeCounts = { ariza: 0, bildirgi: 0, sud_ajrimi: 0, boshqa: 0 };
  filteredCases.forEach(c => {
    const t = c.materialType || 'ariza';
    if (typeCounts[t] !== undefined) typeCounts[t]++;
  });
  
  const typeLabels = {
    ru: ["Заявление", "Рапорт", "Суд. решение", "Другое"],
    uz: ["Ariza", "Bildirgi", "Sud qarori", "Boshqa"]
  };
  
  if (chiefChartTypeInstance) chiefChartTypeInstance.destroy();
  const ctxType = document.getElementById("chiefChartType");
  if (ctxType) {
    chiefChartTypeInstance = new Chart(ctxType, {
      type: 'pie',
      data: {
        labels: typeLabels[currentLang],
        datasets: [{
          data: [typeCounts.ariza, typeCounts.bildirgi, typeCounts.sud_ajrimi, typeCounts.boshqa],
          backgroundColor: ['#1e3a8a', '#3b82f6', '#64748b', '#cbd5e1']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // 4. Sources (Bar Chart)
  const srcCounts = { tashrif: 0, prakuratura: 0, prezident_aparat: 0, iio: 0, portal: 0 };
  filteredCases.forEach(c => {
    const s = c.sourceFrom || 'tashrif';
    if (srcCounts[s] !== undefined) srcCounts[s]++;
  });
  
  const srcLabels = {
    ru: ["Тамбур", "Прокуратура", "Аппарат През.", "ИИО", "Портал"],
    uz: ["Qabulxona", "Prokuratura", "Prezident ap.", "IIO", "Portal"]
  };

  if (chiefChartSrcInstance) chiefChartSrcInstance.destroy();
  const ctxSrc = document.getElementById("chiefChartSource");
  if (ctxSrc) {
    chiefChartSrcInstance = new Chart(ctxSrc, {
      type: 'bar',
      data: {
        labels: srcLabels[currentLang],
        datasets: [{
          label: currentLang === 'ru' ? 'Материалов' : 'Hujjatlar',
          data: [srcCounts.tashrif, srcCounts.prakuratura, srcCounts.prezident_aparat, srcCounts.iio, srcCounts.portal],
          backgroundColor: '#1e3a8a'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  // 5. Difficulty (Doughnut Chart)
  const diffCounts = [0, 0, 0, 0, 0];
  filteredCases.forEach(c => {
    const d = c.difficulty;
    if (d >= 1 && d <= 5) diffCounts[d - 1]++;
  });
  
  if (chiefChartDiffInstance) chiefChartDiffInstance.destroy();
  const ctxDiff = document.getElementById("chiefChartDifficulty");
  if (ctxDiff) {
    chiefChartDiffInstance = new Chart(ctxDiff, {
      type: 'doughnut',
      data: {
        labels: ["1", "2", "3", "4", "5"],
        datasets: [{
          data: diffCounts,
          backgroundColor: ['#1e3a8a', '#3b82f6', '#64748b', '#94a3b8', '#cbd5e1']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}

// New: Ratings table for all officers across all depts
function renderChiefRatingsTable() {
  const tbody = document.getElementById("chief-ratings-table");
  if (!tbody) return;
  
  let html = "";
  db.officers.forEach(o => {
    const dept = db.departments.find(d => d.id === o.deptId);
    const deptName = dept ? (currentLang === 'ru' ? dept.nameRu : dept.nameUz) : "";
    const cases = db.materials.filter(m => m.officerId === o.id);
    const total = cases.length;
    const inWork = cases.filter(m => m.status !== "закрыт_в_срок").length;
    const closed = cases.filter(m => m.status === "закрыт_в_срок").length;
    
    let badgeClass = "index-badge-green";
    if (o.index < 71) badgeClass = "index-badge-red";
    else if (o.index < 86) badgeClass = "index-badge-yellow";
    
    const name = currentLang === 'ru'
      ? o.nameRu.split(' ')[0] + ' ' + o.nameRu.split(' ')[1][0] + '.'
      : o.nameUz.split(' ')[0];
    
    html += `
      <tr>
        <td><strong>${name}</strong><br><span style="font-size:0.7rem;color:var(--text-muted);">${currentLang === 'ru' ? o.rankRu : o.rankUz}</span></td>
        <td style="font-size:0.78rem;">${deptName}</td>
        <td><span style="color:var(--color-success);font-weight:600;">${o.likes}</span></td>
        <td><span style="color:var(--color-danger);font-weight:600;">${o.dislikes}</span></td>
        <td>${total}</td>
        <td>${inWork}</td>
        <td>${closed}</td>
        <td><span class="badge ${badgeClass}">${o.index}%</span>
          <div class="rating-progress-bar" style="margin-top:0.3rem;">
            <div class="rating-progress-fill ${o.index >= 86 ? 'green' : o.index >= 71 ? 'yellow' : 'red'}" style="width:${o.index}%;"></div>
          </div>
        </td>
      </tr>`;
  });
  tbody.innerHTML = html;
}


function calculateDeadlineOffsets(materialsList) {
  const result = { today: 0, tomorrow: 0, indinga: 0, days3: 0, days4: 0, days5: 0 };
  
  const now = new Date();
  // Helper: returns date string "YYYY-MM-DD" for today + offsetDays
  function dayStr(offsetDays) {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().substring(0, 10);
  }
  
  const d0 = dayStr(0), d1 = dayStr(1), d2 = dayStr(2), d3 = dayStr(3), d4 = dayStr(4), d5 = dayStr(5);
  
  materialsList.forEach(m => {
    if (m.status === "закрыт_в_срок") return;
    
    const deadlineDate = new Date(m.deadline).toISOString().substring(0, 10);
    if (deadlineDate === d0) result.today++;
    else if (deadlineDate === d1) result.tomorrow++;
    else if (deadlineDate === d2) result.indinga++;
    else if (deadlineDate === d3) result.days3++;
    else if (deadlineDate === d4) result.days4++;
    else if (deadlineDate === d5) result.days5++;
  });
  
  return result;
}

function reassignCase(caseId, newOfficerId) {
  if (!newOfficerId) return;
  const c = db.materials.find(m => m.id === caseId);
  const oldOfficer = db.officers.find(o => o.id === c.officerId);
  const newOfficer = db.officers.find(o => o.id === newOfficerId);
  
  if (c && newOfficer) {
    c.officerId = newOfficerId;
    saveDb();
    
    addAuditLog("Начальник отделения", `Перераспределение материала ${caseId} от ${oldOfficer.nameRu} к ${newOfficer.nameRu}`, `Material ${caseId} xodim ${oldOfficer.nameUz}dan ${newOfficer.nameUz}ga qayta biriktirildi`);
    renderChiefView();
    alert(currentLang === 'ru' ? "Исполнитель успешно изменен!" : "Ijrochi muvaffaqiyatli o'zgartirildi!");
  }
}

function renderChiefApprovals(deptId) {
  const container = document.getElementById("chief-approvals-list");
  
  if (!db.approvalRequests || db.approvalRequests.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center;">Запросов на согласование нет</p>`;
    return;
  }
  
  const filtered = db.approvalRequests.filter(req => {
    const c = db.materials.find(m => m.id === req.caseId);
    if (!c) return false;
    if (deptId && c.deptId !== deptId) return false;
    return true;
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center;">Запросов на согласование нет</p>`;
    return;
  }
  
  let html = "";
  filtered.forEach(req => {
    const c = db.materials.find(m => m.id === req.caseId);
    const officer = db.officers.find(o => o.id === req.officerId);
    const offName = officer ? officer.nameRu : "";
    const typeLabel = req.type === "закрыт_в_срок" 
      ? (currentLang === 'ru' ? "Отказ в ВУД" : "JIQni rad etish") 
      : req.type === "возбуждено" ? (currentLang === 'ru' ? "Возбуждение ВУД" : "JIQ qo'zg'atish") : (currentLang === 'ru' ? "Передача дела" : "Tergovga yuborish");
      
    html += `
      <div class="approval-item">
        <div class="approval-info">
          <h5>${req.caseId} &rarr; ${typeLabel}</h5>
          <p>${currentLang === 'ru' ? 'Исполнитель' : 'Ijrochi'}: <strong>${offName}</strong></p>
          <p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">"${req.reason}"</p>
        </div>
        <div class="approval-actions">
          <button class="btn btn-success" style="padding: 0.35rem 0.65rem;" onclick="approveResolution('${req.caseId}')"><i class="fa-solid fa-check"></i></button>
          <button class="btn btn-danger" style="padding: 0.35rem 0.65rem;" onclick="rejectResolution('${req.caseId}')"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function approveResolution(caseId) {
  const reqIndex = db.approvalRequests.findIndex(r => r.caseId === caseId);
  if (reqIndex === -1) return;
  
  const req = db.approvalRequests[reqIndex];
  const c = db.materials.find(m => m.id === caseId);
  const officer = db.officers.find(o => o.id === c.officerId);
  
  if (c) {
    c.status = "закрыт_в_срок";
    c.closedAt = new Date().toISOString();
    c.statusTextRu = "Закрыт в срок (Согласовано)";
    c.statusTextUz = "Muddatida yopildi (Tasdiqlandi)";
    
    if (!c.appeals) c.appeals = [];
    c.appeals.push({ status: "Анализ и решение", time: new Date().toISOString() });
    c.appeals.push({ status: "Оперативная отправка уведомления", time: new Date().toISOString() });
    c.appeals.push({ status: "Прием гражданином уведомления", time: new Date().toISOString() });
    
    const template = db.templates.find(t => t.id === (req.type === "возбуждено" ? "tpl_initiate" : req.type === "перенаправлено" ? "tpl_transfer" : "tpl_reject"));
    let notifBody = "";
    if (template) {
      notifBody = currentLang === 'ru' ? template.contentRu : template.contentUz;
      notifBody = notifBody.replace("{name}", c.citizenName)
                            .replace("{id}", c.id)
                            .replace("{link}", `e-material.gov.uz/docs/${c.id}`)
                            .replace("{case_num}", req.caseNum || "10/26-99")
                            .replace("{officer}", officer ? officer.nameRu : "")
                            .replace("{phone}", officer ? "+998 90 123-45-67" : "")
                            .replace("{org}", req.orgName || "РУВД");
    }
    c.citizenNotificationText = notifBody;
    
    db.approvalRequests.splice(reqIndex, 1);
    saveDb();
    
    addAuditLog(currentRole === "chief" ? "Начальник отделения" : "Регистратор", `Согласовано процессуальное решение по делу ${caseId}. Отправлено авто-уведомление гражданину.`, `${caseId} material bo'yicha protsessual qaror tasdiqlandi. Fuqaroga xabarnoma yuborildi.`);
    
    if (currentRole === "chief") {
      renderChiefView();
    } else {
      renderRegistratorView();
    }
    alert(currentLang === 'ru' ? "Решение успешно утверждено! Уведомление отправлено заявителю." : "Qaror muvaffaqiyatli tasdiqlandi! Murojaatchiga xabar yuborildi.");
  }
}

function rejectResolution(caseId) {
  const reqIndex = db.approvalRequests.findIndex(r => r.caseId === caseId);
  if (reqIndex === -1) return;
  
  const c = db.materials.find(m => m.id === caseId);
  if (c) {
    c.status = "изучаемый";
    c.statusTextRu = "На доработке (Отклонено руководство)";
    c.statusTextUz = "Qayta ishlashda (Rad etildi)";
    
    db.approvalRequests.splice(reqIndex, 1);
    saveDb();
    
    addAuditLog(currentRole === "chief" ? "Начальник отделения" : "Регистратор", `Отклонен проект процессуального решения по делу ${caseId}. Отправлено на доработку.`, `${caseId} bo'yicha qaror loyihasi rad etildi va qayta ishlashga qaytarildi.`);
    
    if (currentRole === "chief") {
      renderChiefView();
    } else {
      renderRegistratorView();
    }
    alert(currentLang === 'ru' ? "Проект решения отклонен и отправлен следователю на доработку!" : "Qaror loyihasi rad etildi va tergovchiga qaytarildi!");
  }
}

function renderChiefDetailedTable() {
  const tbody = document.getElementById("chief-officers-detailed-table");
  const deptOfficers = db.officers;
  
  let html = "";
  deptOfficers.forEach(o => {
    const name = currentLang === 'ru' ? o.nameRu.split(' ')[0] + ' ' + o.nameRu.split(' ')[1][0] + '.' : o.nameUz.split(' ')[0];
    
    const officerCases = db.materials.filter(m => m.officerId === o.id);
    const total = officerCases.length;
    const inWork = officerCases.filter(m => m.status !== "закрыт_в_срок").length;
    const closed = officerCases.filter(m => m.status === "закрыт_в_срок").length;
    const overdue = officerCases.filter(m => m.status === "срок_нарушен").length;
    
    const dl = calculateDeadlineOffsets(officerCases);

    // Calculate difficulty counts for this investigator
    const d1 = officerCases.filter(m => m.difficulty === 1).length;
    const d2 = officerCases.filter(m => m.difficulty === 2).length;
    const d3 = officerCases.filter(m => m.difficulty === 3).length;
    const d4 = officerCases.filter(m => m.difficulty === 4).length;
    const d5 = officerCases.filter(m => m.difficulty === 5).length;
    
    let badgeClass = "index-badge-green";
    if (o.index < 71) badgeClass = "index-badge-red";
    else if (o.index < 86) badgeClass = "index-badge-yellow";
    
    html += `
      <tr>
        <td><strong>${name}</strong></td>
        <td>${total}</td>
        <td>${inWork}</td>
        <td>${closed}</td>
        <td style="${overdue > 0 ? 'background:#fef2f2;color:#ef4444;font-weight:bold;' : ''}">${overdue}</td>
        <td>${dl.today}</td>
        <td>${dl.tomorrow}</td>
        <td>${dl.indinga}</td>
        <td>${dl.days3}</td>
        <td>${dl.days4}</td>
        <td>${dl.days5}</td>
        <td>${d1}</td>
        <td>${d2}</td>
        <td>${d3}</td>
        <td>${d4}</td>
        <td>${d5}</td>
        <td><span class="badge ${badgeClass}">${o.index}%</span></td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

// ==============================================
// DETAILS & TIMELINE MODAL LOGIC
// ==============================================
function viewCaseDetails(caseId) {
  const c = db.materials.find(m => m.id === caseId);
  if (!c) return;
  
  document.getElementById("modal-case-id-span").textContent = c.id;
  document.getElementById("modal-citizen-name").textContent = c.citizenName;
  document.getElementById("modal-citizen-phone").textContent = c.citizenPhone;
  document.getElementById("modal-case-summary").textContent = currentLang === 'ru' ? c.titleRu : c.titleUz;
  
  const officer = db.officers.find(o => o.id === c.officerId);
  const officerName = officer ? `${officer.nameRu} (${officer.rankRu})` : "";
  document.getElementById("modal-officer-name").textContent = officerName;
  document.getElementById("modal-deadline-date").textContent = formatDate(c.deadline);
  document.getElementById("modal-extensions-count").textContent = c.extensionCount;
  
  const typesMap = {
    ariza: { ru: "Ариза (Заявление)", uz: "Ariza (Murojaat)" },
    bildirgi: { ru: "Билдирги (Рапорт)", uz: "Bildirgi (Raport)" },
    sud_ajrimi: { ru: "Суд ажрими (Определение)", uz: "Sud ajrimi" },
    boshqa: { ru: "Другое (Бошқа)", uz: "Boshqa" }
  };
  const typeObj = typesMap[c.materialType] || typesMap.ariza;
  document.getElementById("modal-material-type").textContent = currentLang === 'ru' ? typeObj.ru : typeObj.uz;

  const sourcesMap = {
    tashrif: { ru: "Лично (Тамбур)", uz: "Qabulxona (Tashrif)" },
    prakuratura: { ru: "Прокуратура", uz: "Prokuratura" },
    prezident_aparat: { ru: "Аппарат Президента", uz: "Prezident apparati" },
    iio: { ru: "Другой орган (ИИО)", uz: "Boshqa IIO" },
    portal: { ru: "Портал / Халқ қабулхонаси", uz: "Davlat portali" }
  };
  const sourceObj = sourcesMap[c.sourceFrom] || sourcesMap.tashrif;
  document.getElementById("modal-source-from").textContent = currentLang === 'ru' ? sourceObj.ru : sourceObj.uz;

  document.getElementById("modal-difficulty").textContent = c.difficulty || 3;

  const statusContainer = document.getElementById("modal-status-badge");
  if (statusContainer) {
    statusContainer.className = 'badge';
    if (c.status === "изучаемый") {
      statusContainer.classList.add('badge-info');
      statusContainer.textContent = currentLang === 'ru' ? 'Изучаемый' : 'O\'rganilmoqda';
    } else if (c.status === "закрыт_в_срок") {
      statusContainer.classList.add('badge-success');
      statusContainer.textContent = currentLang === 'ru' ? 'Закрыт в срок' : 'Muddatida yopildi';
    } else if (c.status === "срок_приближается") {
      statusContainer.classList.add('badge-warning');
      statusContainer.textContent = currentLang === 'ru' ? 'Срок приближается' : 'Yaqinlashmoqda';
    } else if (c.status === "срок_нарушен") {
      statusContainer.classList.add('badge-danger');
      statusContainer.textContent = currentLang === 'ru' ? 'Срок нарушен' : 'Muddati buzilgan';
    } else {
      statusContainer.textContent = c.status;
    }
  }
  
  const notifContainer = document.getElementById("modal-notif-body");
  if (c.citizenNotificationText) {
    notifContainer.textContent = c.citizenNotificationText;
  } else {
    const isClosed = c.status === "закрыт_в_срок";
    const template = db.templates.find(t => t.id === (isClosed ? "tpl_reject" : "tpl_initiate"));
    let bodyText = "";
    if (template) {
      bodyText = currentLang === 'ru' ? template.contentRu : template.contentUz;
      bodyText = bodyText.replace("{name}", c.citizenName)
                         .replace("{id}", c.id)
                         .replace("{link}", `e-material.gov.uz/docs/${c.id}`)
                         .replace("{case_num}", "10/26-88")
                         .replace("{officer}", officer ? officer.nameRu : "")
                         .replace("{phone}", "+998 90 123-45-67");
    } else {
      bodyText = "Нет активных уведомлений.";
    }
    notifContainer.textContent = `[Virtual SMS/Telegram] ${bodyText}`;
  }
  
  buildTimeline(c);
  switchModalTab('info');
  document.getElementById("details-modal").style.display = "flex";
}

function closeDetailsModal() {
  document.getElementById("details-modal").style.display = "none";
}

function switchModalTab(tab) {
  activeModalTab = tab;
  document.getElementById("modal-tab-info").classList.toggle("active", tab === "info");
  document.getElementById("modal-tab-timeline").classList.toggle("active", tab === "timeline");
  
  document.getElementById("modal-content-info").style.display = tab === "info" ? "flex" : "none";
  document.getElementById("modal-content-timeline").style.display = tab === "timeline" ? "block" : "none";
}

function buildTimeline(caseItem) {
  const container = document.getElementById("modal-timeline-container");
  
  const standardSteps = [
    { key: "Обращение гражданина", ru: "Обращение гражданина зарегистрировано", uz: "Fuqaro murojaati ro'yxatga olindi" },
    { key: "Анализ и решение", ru: "Проводится доследственная проверка (Анализ)", uz: "Tergov oldi tekshiruvi boshlandi (Tahlil)" },
    { key: "Оперативная отправка уведомления", ru: "Сформировано и отправлено уведомление", uz: "Xabarnoma tayyorlandi va yuborildi" },
    { key: "Прием гражданином уведомления", ru: "Уведомление доставлено адресату", uz: "Xabarnoma murojaatchiga yetkazildi" }
  ];
  
  let html = "";
  
  standardSteps.forEach((step, idx) => {
    const actual = caseItem.appeals ? caseItem.appeals.find(a => a.status === step.key) : null;
    
    let isCompleted = false;
    let isCurrent = false;
    let timeStr = "";
    
    if (actual) {
      isCompleted = true;
      timeStr = formatDate(actual.time);
    } else {
      const prevStep = idx > 0 ? caseItem.appeals.find(a => a.status === standardSteps[idx-1].key) : null;
      if (idx === 0 || prevStep) {
        isCurrent = true;
      }
    }
    
    const stepTitle = currentLang === 'ru' ? step.ru : step.uz;
    const stepClass = isCompleted ? "completed" : (isCurrent ? "current" : "");
    const circleContent = isCompleted ? "✓" : (idx + 1);
    
    html += `
      <div class="timeline-step ${stepClass}">
        <div class="timeline-circle">${circleContent}</div>
        <div class="timeline-content">
          <h4 class="timeline-title">${stepTitle}</h4>
          ${timeStr ? `<p class="timeline-time">${timeStr}</p>` : `<p class="timeline-time" style="color:var(--text-muted);">${currentLang === 'ru' ? 'Ожидание...' : 'Kutilmoqda...'}</p>`}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}
