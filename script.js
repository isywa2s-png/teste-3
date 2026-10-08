/* =========================================================
   FANTASMAS — SISTEMA DE GERENCIAMENTO
   SCRIPT COMPLETO E ATUALIZADO (SUPABASE + REALTIME)
========================================================= */

/* ---------------------------------------------------------
   1. CONFIGURAÇÕES & CONSTANTES DE REGRAS
--------------------------------------------------------- */
const CONFIG = {
    MIN_CHARS: 4,
    INTRO_FIRST_TIME: 1700,
    INTRO_SECOND_TIME: 1800,
    STORAGE_USER: "fantasmas_user",
    STORAGE_SESSION: "fantasmas_session"
};

// Mapeamento exato da Hierarquia BFE
const BFE_RANKS = [
    "〔CR〕Criador",
    "〔2º CR〕Segundo Criador",
    "〔DN〕Dono",
    "〔CMT〕Comandante",
    "〔SCMT〕Subcomandante",
    "〔SUP-G〕Supervisor Geral",
    "〔SUP〕Supervisor",
    "〔GEN〕General",
    "〔OF〕Oficial",
    "〔GD〕Graduado",
    "〔PR〕Praça",
    "〔CANDT〕Candidato"
];

// Mapeamento exato da Hierarquia SGB
const SGB_RANKS = [
    "@[CR] Criador",
    "@[2° CR] Segundo Criador",
    "@[DR] Diretor",
    "@[MN-GR] Manager",
    "@[ADM] Administrador",
    "@[SCR] Sub Criador",
    "@Donos do BFE",
    "@[ENC-G] Encarregado Geral",
    "@[SEC-G] Secretario Geral",
    "@[SEC-DEP] Secretário de departamento",
    "@[CG-G] Corregedor Geral",
    "@[SGB-CG] Corregedor",
    "@[SGB-CRD] Coordenador",
    "@[SGB-SUP] Supervisor",
    "@[SGB-ANST] Analista",
    "@[SGB-SÊN] Sênior",
    "@[SGB-APR] Aprendiz",
    "@[SGB-EST] Estagiários"
];

// Mapeamento exato da Hierarquia JORNAL
const JORNAL_RANKS = [
    "@[CS] Chefe Sombrio",
    "@[DS] Diretor Sombrio",
    "@[ES] Encarregado Sombrio",
    "@[ED] Editor Sombrio",
    "@[OV] Observador do Véu",
    "@[RS] Repórter das Sombras"
];

/* ---------------------------------------------------------
   2. ESTADO DA APLICAÇÃO & BANCO DE DADOS LOCAL (FALLBACK)
--------------------------------------------------------- */
const state = {
    currentUser: null,
    currentPage: "dashboard",
    sidebarOpen: false,

    // Dados carregados (do Supabase ou Memory/LocalStorage)
    bfe: {
        members: [],
        daily: [],
        weekly: [],
        punishments: [],
        warnings: [],
        inactivity: [],
        trainings: [],
        evaluations: []
    },
    sgb: {
        members: [],
        weekly: [],
        warnings: [],
        evaluations: []
    },
    jornal: {
        members: [],
        daily: [],
        weekly: [],
        evaluations: []
    },
    logs: []
};

/* ---------------------------------------------------------
   3. REFERÊNCIAS DOM
--------------------------------------------------------- */
const elements = {
    introScreen: document.getElementById("intro-screen"),
    introFirstMessage: document.getElementById("intro-first-message"),
    introSecondMessage: document.getElementById("intro-second-message"),

    authScreen: document.getElementById("auth-screen"),
    loginPanel: document.getElementById("login-panel"),
    registerPanel: document.getElementById("register-panel"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),

    loginUsername: document.getElementById("login-username"),
    loginPassword: document.getElementById("login-password"),
    registerUsername: document.getElementById("register-username"),
    registerPassword: document.getElementById("register-password"),
    registerConfirmPassword: document.getElementById("register-password-confirm"),

    loginMessage: document.getElementById("login-message"),
    registerMessage: document.getElementById("register-message"),
    showRegisterButton: document.getElementById("show-register"),
    showLoginButton: document.getElementById("show-login"),

    app: document.getElementById("app"),
    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebar-overlay"),

    mobileMenuButton: document.getElementById("mobile-menu-button"),
    mobileProfileButton: document.getElementById("mobile-profile-button"),
    logoutButton: document.getElementById("logout-button"),

    currentUsername: document.getElementById("current-user-name"),
    pageTitle: document.getElementById("page-title"),
    pageBreadcrumb: document.getElementById("page-breadcrumb"),

    toastContainer: document.getElementById("toast-container"),
    modal: document.getElementById("global-modal"),
    modalBody: document.getElementById("modal-body"),
    modalClose: document.getElementById("modal-close")
};

/* ---------------------------------------------------------
   4. INICIALIZAÇÃO
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

async function initializeApp() {
    setupIntro();
    setupAuthentication();
    setupNavigation();
    setupMobileMenu();
    setupLogout();
    setupModal();
    
    // Tenta inicializar dados do Supabase ou carregar do LocalStorage
    await fetchAllData();
    setupRealtimeSubscriptions();
    checkAutoResetDaily();
    
    loadSavedSession();
}

/* ---------------------------------------------------------
   5. ANIMAÇÃO DE INTRO
--------------------------------------------------------- */
function setupIntro() {
    if (!elements.introScreen) {
        showAuthentication();
        return;
    }

    const firstMessage = elements.introFirstMessage;
    const secondMessage = elements.introSecondMessage;

    if (firstMessage) firstMessage.style.opacity = "1";
    if (secondMessage) {
        secondMessage.style.opacity = "0";
        secondMessage.style.display = "none";
    }

    setTimeout(() => {
        if (firstMessage) {
            firstMessage.style.transition = "opacity 900ms ease";
            firstMessage.style.opacity = "0";
        }
    }, CONFIG.INTRO_FIRST_TIME);

    setTimeout(() => {
        if (secondMessage) {
            secondMessage.style.display = "block";
            requestAnimationFrame(() => {
                secondMessage.style.opacity = "1";
            });
        }
    }, CONFIG.INTRO_FIRST_TIME + 900);

    setTimeout(() => {
        finishIntro();
    }, CONFIG.INTRO_FIRST_TIME + 900 + CONFIG.INTRO_SECOND_TIME);
}

function finishIntro() {
    if (!elements.introScreen) return;
    elements.introScreen.style.transition = "opacity 800ms ease, visibility 800ms ease";
    elements.introScreen.style.opacity = "0";
    elements.introScreen.style.visibility = "hidden";

    setTimeout(() => {
        elements.introScreen.classList.add("hidden");
        showAuthentication();
    }, 850);
}

/* ---------------------------------------------------------
   6. AUTENTICAÇÃO (LOGIN & CRIAR CONTA)
--------------------------------------------------------- */
function setupAuthentication() {
    if (elements.showRegisterButton) {
        elements.showRegisterButton.addEventListener("click", showRegister);
    }
    if (elements.showLoginButton) {
        elements.showLoginButton.addEventListener("click", showLogin);
    }
    if (elements.loginForm) {
        elements.loginForm.addEventListener("submit", handleLogin);
    }
    if (elements.registerForm) {
        elements.registerForm.addEventListener("submit", handleRegister);
    }
}

function showAuthentication() {
    if (elements.authScreen) elements.authScreen.classList.remove("hidden");
    if (elements.app) elements.app.classList.add("hidden");
    showLogin();
}

function showLogin() {
    if (elements.loginPanel) elements.loginPanel.classList.remove("hidden");
    if (elements.registerPanel) elements.registerPanel.classList.add("hidden");
    clearMessage(elements.loginMessage);
    clearMessage(elements.registerMessage);
}

function showRegister() {
    if (elements.loginPanel) elements.loginPanel.classList.add("hidden");
    if (elements.registerPanel) elements.registerPanel.classList.remove("hidden");
    clearMessage(elements.loginMessage);
    clearMessage(elements.registerMessage);
}

function handleLogin(event) {
    event.preventDefault();
    const username = elements.loginUsername ? elements.loginUsername.value.trim() : "";
    const password = elements.loginPassword ? elements.loginPassword.value.trim() : "";

    clearMessage(elements.loginMessage);

    if (username.length <= 3 || password.length <= 3) {
        showMessage(elements.loginMessage, "Usuário ou senha está incorreto. Tente novamente!", "error");
        return;
    }

    const user = { username, loggedAt: new Date().toISOString() };
    state.currentUser = user;
    saveSession(user);

    showMessage(elements.loginMessage, "Login concluído com sucesso. Seja bem-vindo, Fantasmas!", "success");

    setTimeout(() => {
        openApplication();
    }, 700);
}

function handleRegister(event) {
    event.preventDefault();

    const usernameInput = elements.registerUsername;
    const passwordInput = elements.registerPassword;
    const confirmInput = elements.registerConfirmPassword;

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";
    const confirm = confirmInput ? confirmInput.value.trim() : "";

    clearRegisterErrors();
    let valid = true;

    if (username.length < 4) {
        showFieldError("register-username-error", "Este campo é obrigatório a ter mais de 4 caracteres.");
        valid = false;
    }
    if (password.length < 4) {
        showFieldError("register-password-error", "Este campo é obrigatório a ter mais de 4 caracteres.");
        valid = false;
    }
    if (confirm.length < 4) {
        showFieldError("register-confirm-error", "Este campo é obrigatório a ter mais de 4 caracteres.");
        valid = false;
    }

    if (!valid) return;

    if (password !== confirm) {
        showFieldError("register-confirm-error", "As senhas não coincidem.");
        return;
    }

    showMessage(elements.registerMessage, "Conta criada com sucesso!", "success");

    setTimeout(() => {
        showLogin();
        if (elements.loginUsername) elements.loginUsername.value = username;
        if (elements.loginPassword) elements.loginPassword.value = password;
    }, 900);
}

function clearRegisterErrors() {
    ["register-username-error", "register-password-error", "register-confirm-error"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
    });
}

function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

function showMessage(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = `form-message ${type}`;
}

function clearMessage(el) {
    if (!el) return;
    el.textContent = "";
    el.className = "form-message";
}

/* ---------------------------------------------------------
   7. NAVEGAÇÃO & PAINEL PRINCIPAL
--------------------------------------------------------- */
function checkLogsAccess() {
    if (!state.currentUser || !state.currentUser.username) return false;
    const lower = state.currentUser.username.toLowerCase();
    return lower.includes("davi") || lower.includes("ana") || lower.includes("none");
}

function updateLogsVisibility() {
    const logsBtn = document.querySelector('.menu-item[data-page="logs"]');
    const hasAccess = checkLogsAccess();
    if (logsBtn) {
        const parent = logsBtn.closest('.menu-section') || logsBtn;
        if (hasAccess) {
            parent.style.display = "";
        } else {
            parent.style.display = "none";
        }
    }
}

function openApplication() {
    if (elements.authScreen) elements.authScreen.classList.add("hidden");
    if (elements.app) elements.app.classList.remove("hidden");

    if (state.currentUser && elements.currentUsername) {
        elements.currentUsername.textContent = state.currentUser.username;
    }

    updateLogsVisibility();
    navigateToPage("dashboard");
    renderDashboardCounters();
}

function setupNavigation() {
    document.querySelectorAll("[data-page]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const page = btn.dataset.page;
            if (!page) return;
            
            if (page === "bfe") navigateToPage("bfe-members");
            else if (page === "sgb") navigateToPage("sgb-members");
            else if (page === "jornal") navigateToPage("jornal-members");
            else navigateToPage(page);

            closeMobileMenu();
        });
    });
}

function navigateToPage(pageName) {
    if (pageName === "logs" && !checkLogsAccess()) {
        showToast("Acesso Negado", "Você não tem permissão para visualizar os LOGS.", "error");
        pageName = "dashboard";
    }

    state.currentPage = pageName;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    const target = document.getElementById(`page-${pageName}`);
    if (target) {
        target.classList.add("active-page");
    }

    document.querySelectorAll(".menu-item").forEach(item => {
        if (item.dataset.page === pageName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    renderPageContent(pageName);
    updateHeaderTitles(pageName);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateHeaderTitles(pageName) {
    const titles = {
        "dashboard": { title: "PAINEL GERAL 👋", breadcrumb: "FANTASMAS / PAINEL GERAL" },
        "bfe-members": { title: "BFE - ADICIONAR MEMBRO 👥", breadcrumb: "BFE / MEMBROS" },
        "bfe-hierarchy": { title: "BFE - HIERARQUIA 👑", breadcrumb: "BFE / HIERARQUIA" },
        "bfe-daily": { title: "BFE - COTA DIÁRIA 📅", breadcrumb: "BFE / COTA DIÁRIA" },
        "bfe-weekly": { title: "BFE - COTA SEMANAL 🗓️", breadcrumb: "BFE / COTA SEMANAL" },
        "bfe-ghosts": { title: "BFE - FANTASMAS EM TESTE 👻", breadcrumb: "BFE / EM TESTE" },
        "bfe-punishments": { title: "BFE - PUNIÇÃO ⚖️", breadcrumb: "BFE / PUNIÇÃO" },
        "bfe-warnings": { title: "BFE - ADVERTÊNCIA ⚠️", breadcrumb: "BFE / ADVERTÊNCIA" },
        "bfe-inactivity": { title: "BFE - INATIVIDADE 💤", breadcrumb: "BFE / INATIVIDADE" },
        "bfe-training": { title: "BFE - TREINOS 🎯", breadcrumb: "BFE / TREINOS" },
        "bfe-evaluation": { title: "BFE - AVAL 🛡️", breadcrumb: "BFE / AVAL" },

        "sgb-members": { title: "SGB - ADICIONAR MEMBRO 👥", breadcrumb: "SGB / MEMBROS" },
        "sgb-hierarchy": { title: "SGB - HIERARQUIA 👑", breadcrumb: "SGB / HIERARQUIA" },
        "sgb-evaluation": { title: "SGB - AVAL 🛡️", breadcrumb: "SGB / AVAL" },
        "sgb-weekly": { title: "SGB - COTA SEMANAL 🗓️", breadcrumb: "SGB / COTA SEMANAL" },
        "sgb-warnings": { title: "SGB - ADVERTÊNCIA ⚠️", breadcrumb: "SGB / ADVERTÊNCIA" },

        "jornal-members": { title: "JORNAL - ADICIONAR MEMBRO 👥", breadcrumb: "JORNAL / MEMBROS" },
        "jornal-hierarchy": { title: "JORNAL - HIERARQUIA 👑", breadcrumb: "JORNAL / HIERARQUIA" },
        "jornal-daily": { title: "JORNAL - COTA DIÁRIA 📅", breadcrumb: "JORNAL / COTA DIÁRIA" },
        "jornal-weekly": { title: "JORNAL - COTA SEMANAL 🗓️", breadcrumb: "JORNAL / COTA SEMANAL" },
        "jornal-evaluation": { title: "JORNAL - AVAL 🛡️", breadcrumb: "JORNAL / AVAL" },

        "logs": { title: "LOGS DO SISTEMA 📁", breadcrumb: "FANTASMAS / LOGS" }
    };

    const current = titles[pageName] || { title: pageName.toUpperCase(), breadcrumb: "FANTASMAS" };
    if (elements.pageTitle) elements.pageTitle.textContent = current.title;
    if (elements.pageBreadcrumb) elements.pageBreadcrumb.textContent = current.breadcrumb;
}

/* ---------------------------------------------------------
   8. MENU MOBILE & SESSÃO
--------------------------------------------------------- */
function setupMobileMenu() {
    if (elements.mobileMenuButton) {
        elements.mobileMenuButton.addEventListener("click", () => {
            state.sidebarOpen = !state.sidebarOpen;
            if (state.sidebarOpen) {
                elements.sidebar.classList.add("open");
                elements.sidebarOverlay.classList.remove("hidden");
            } else {
                closeMobileMenu();
            }
        });
    }

    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener("click", closeMobileMenu);
    }
}

function closeMobileMenu() {
    state.sidebarOpen = false;
    if (elements.sidebar) elements.sidebar.classList.remove("open");
    if (elements.sidebarOverlay) elements.sidebarOverlay.classList.add("hidden");
}

function setupLogout() {
    if (elements.logoutButton) {
        elements.logoutButton.addEventListener("click", () => {
            if (confirm("Deseja realmente sair?")) {
                localStorage.removeItem(CONFIG.STORAGE_USER);
                localStorage.removeItem(CONFIG.STORAGE_SESSION);
                state.currentUser = null;
                showAuthentication();
            }
        });
    }
}

function saveSession(user) {
    try {
        localStorage.setItem(CONFIG.STORAGE_USER, JSON.stringify(user));
        localStorage.setItem(CONFIG.STORAGE_SESSION, "true");
    } catch (e) {
        console.error(e);
    }
}

function loadSavedSession() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_USER);
        if (saved) {
            state.currentUser = JSON.parse(saved);
        }
    } catch (e) {
        console.error(e);
    }
}

/* ---------------------------------------------------------
   9. GERENCIAMENTO DE DADOS (SUPABASE + REALTIME)
--------------------------------------------------------- */
async function fetchAllData() {
    try {
        if (window.supabaseClient) {
            const { data: bfeMemb } = await window.supabaseClient.from("bfe_members").select("*");
            if (bfeMemb) {
                state.bfe.members = bfeMemb.map(m => ({
                    id: m.id,
                    roblox: m.roblox,
                    discord: m.discord,
                    rank: m.rank,
                    inTest: m.in_test ? "Sim" : "Não"
                }));
            }

            const { data: sgbMemb } = await window.supabaseClient.from("sgb_members").select("*");
            if (sgbMemb) {
                state.sgb.members = sgbMemb.map(m => ({
                    id: m.id,
                    roblox: m.roblox,
                    discord: m.discord,
                    rank: m.rank,
                    inTest: "Não"
                }));
            }

            const { data: jorMemb } = await window.supabaseClient.from("jornal_members").select("*");
            if (jorMemb) {
                state.jornal.members = jorMemb.map(m => ({
                    id: m.id,
                    roblox: m.roblox,
                    discord: m.discord,
                    rank: m.rank,
                    inTest: "Não"
                }));
            }

            const { data: logsData } = await window.supabaseClient.from("system_logs").select("*").order("created_at", { ascending: false });
            if (logsData) {
                state.logs = logsData.map(l => ({
                    id: l.id,
                    user: l.usuario,
                    action: l.acao,
                    timestamp: new Date(l.created_at).toLocaleString("pt-BR")
                }));
            }

            loadLocalData();
            renderDashboardCounters();
            renderPageContent(state.currentPage);
        } else {
            loadLocalData();
        }
    } catch (err) {
        console.warn("Supabase não configurado ou indisponível. Usando armazenamento local.", err);
        loadLocalData();
    }
}

function setupRealtimeSubscriptions() {
    if (!window.supabaseClient) return;

    const tables = ['bfe_members', 'sgb_members', 'jornal_members', 'cotas_diarias', 'cotas_semanais', 'system_logs'];

    tables.forEach(tableName => {
        window.supabaseClient
            .channel(`public:${tableName}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
                fetchAllData();
            })
            .subscribe();
    });
}

function loadLocalData() {
    const local = localStorage.getItem("fantasmas_db");
    if (local) {
        const parsed = JSON.parse(local);
        if (!window.supabaseClient) {
            state.bfe.members = parsed.bfe?.members || [];
            state.sgb.members = parsed.sgb?.members || [];
            state.jornal.members = parsed.jornal?.members || [];
            state.logs = parsed.logs || [];
        }
        state.bfe.daily = parsed.bfe?.daily || [];
        state.bfe.weekly = parsed.bfe?.weekly || [];
        state.bfe.punishments = parsed.bfe?.punishments || [];
        state.bfe.warnings = parsed.bfe?.warnings || [];
        state.bfe.inactivity = parsed.bfe?.inactivity || [];
        state.bfe.trainings = parsed.bfe?.trainings || [];
        state.bfe.evaluations = parsed.bfe?.evaluations || [];

        state.sgb.weekly = parsed.sgb?.weekly || [];
        state.sgb.warnings = parsed.sgb?.warnings || [];
        state.sgb.evaluations = parsed.sgb?.evaluations || [];

        state.jornal.daily = parsed.jornal?.daily || [];
        state.jornal.weekly = parsed.jornal?.weekly || [];
        state.jornal.evaluations = parsed.jornal?.evaluations || [];
    }
}

function saveLocalData() {
    localStorage.setItem("fantasmas_db", JSON.stringify({
        bfe: state.bfe,
        sgb: state.sgb,
        jornal: state.jornal,
        logs: state.logs
    }));
    renderDashboardCounters();
}

async function addLog(action) {
    const user = state.currentUser ? state.currentUser.username : "Sistema";
    const log = {
        id: Date.now(),
        user,
        action,
        timestamp: new Date().toLocaleString("pt-BR")
    };
    state.logs.unshift(log);
    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("system_logs").insert([{
            usuario: user,
            acao: action
        }]);
    }
}

function renderDashboardCounters() {
    const bfeCount = document.getElementById("bfe-member-count");
    const sgbCount = document.getElementById("sgb-member-count");
    const jorCount = document.getElementById("jornal-member-count");

    if (bfeCount) bfeCount.textContent = state.bfe.members.length;
    if (sgbCount) sgbCount.textContent = state.sgb.members.length;
    if (jorCount) jorCount.textContent = state.jornal.members.length;
}

/* ---------------------------------------------------------
   10. RESET AUTOMÁTICO DE COTA DIÁRIA (08:00 DO DIA SEGUINTE)
--------------------------------------------------------- */
function checkAutoResetDaily() {
    const lastReset = localStorage.getItem("fantasmas_last_daily_reset");
    const now = new Date();
    
    const todayEightAM = new Date();
    todayEightAM.setHours(8, 0, 0, 0);

    if (now >= todayEightAM) {
        if (!lastReset || new Date(lastReset) < todayEightAM) {
            resetDailyQuotaData();
            localStorage.setItem("fantasmas_last_daily_reset", now.toISOString());
        }
    }
}

function resetDailyQuotaData() {
    state.bfe.daily = state.bfe.daily.map(item => ({ ...item, done: "", result: "Incompleto, 800 JJ´s", punished: "Sim" }));
    state.jornal.daily = state.jornal.daily.map(item => ({ ...item, done: 0, result: "Não realizada" }));
    saveLocalData();
    addLog("Reset automático das Cotas Diárias executado (08:00).");
}

/* ---------------------------------------------------------
   11. RENDERIZAÇÃO DAS PÁGINAS MÓDULO POR MÓDULO
--------------------------------------------------------- */
function renderPageContent(pageName) {
    const container = document.getElementById(`page-${pageName}`);
    if (!container) return;

    switch (pageName) {
        case "dashboard":
            renderDashboardCounters();
            break;

        // --- BFE ---
        case "bfe-members":
            renderAddMemberPage(container, "BFE", BFE_RANKS, state.bfe.members, addBfeMember, deleteBfeMember);
            break;
        case "bfe-hierarchy":
            renderHierarchyPage(container, "BFE", BFE_RANKS, state.bfe.members);
            break;
        case "bfe-daily":
            renderBfeDailyPage(container);
            break;
        case "bfe-weekly":
            renderBfeWeeklyPage(container);
            break;
        case "bfe-ghosts":
            renderBfeGhostsPage(container);
            break;
        case "bfe-punishments":
            renderBfePunishmentsPage(container);
            break;
        case "bfe-warnings":
            renderBfeWarningsPage(container);
            break;
        case "bfe-inactivity":
            renderBfeInactivityPage(container);
            break;
        case "bfe-training":
            renderBfeTrainingPage(container);
            break;
        case "bfe-evaluation":
            renderEvaluationPage(container, "BFE", state.bfe.evaluations, saveBfeEval);
            break;

        // --- SGB ---
        case "sgb-members":
            renderAddMemberPage(container, "SGB", SGB_RANKS, state.sgb.members, addSgbMember, deleteSgbMember);
            break;
        case "sgb-hierarchy":
            renderHierarchyPage(container, "SGB", SGB_RANKS, state.sgb.members);
            break;
        case "sgb-evaluation":
            renderEvaluationPage(container, "SGB", state.sgb.evaluations, saveSgbEval);
            break;
        case "sgb-weekly":
            renderSgbWeeklyPage(container);
            break;
        case "sgb-warnings":
            renderSgbWarningsPage(container);
            break;

        // --- JORNAL ---
        case "jornal-members":
            renderAddMemberPage(container, "JORNAL", JORNAL_RANKS, state.jornal.members, addJornalMember, deleteJornalMember);
            break;
        case "jornal-hierarchy":
            renderHierarchyPage(container, "JORNAL", JORNAL_RANKS, state.jornal.members);
            break;
        case "jornal-daily":
            renderJornalDailyPage(container);
            break;
        case "jornal-weekly":
            renderJornalWeeklyPage(container);
            break;
        case "jornal-evaluation":
            renderEvaluationPage(container, "JORNAL", state.jornal.evaluations, saveJornalEval);
            break;

        // --- LOGS ---
        case "logs":
            renderLogsPage(container);
            break;
    }
}

/* ---------------------------------------------------------
   12. PÁGINAS COMPARTILHADAS (ADICIONAR MEMBRO & HIERARQUIA)
--------------------------------------------------------- */
function renderAddMemberPage(container, dept, ranks, memberList, addFn, deleteFn) {
    const isBfe = dept === "BFE";
    
    container.innerHTML = `
        <div class="card-panel">
            <h2>ADICIONAR MEMBRO - ${dept} 👥</h2>
            <form id="form-add-member" class="styled-form">
                <div class="form-group">
                    <label>NOME ROBLOX:</label>
                    <input type="text" id="mb-roblox" placeholder="Digite o nick no Roblox" required>
                </div>
                <div class="form-group">
                    <label>NOME DISCORD:</label>
                    <input type="text" id="mb-discord" placeholder="Digite o usuário do Discord" required>
                </div>
                <div class="form-group">
                    <label>PATENTE:</label>
                    <select id="mb-rank" required>
                        ${ranks.map(r => `<option value="${r}">${r}</option>`).join("")}
                    </select>
                </div>
                ${isBfe ? `
                <div class="form-group">
                    <label>FANTASMA EM TESTE?:</label>
                    <select id="mb-test">
                        <option value="Não">Não</option>
                        <option value="Sim">Sim</option>
                    </select>
                </div>` : ""}
                <button type="submit" class="main-button">ADICIONAR MEMBRO</button>
            </form>

            <div class="divider"></div>

            <h3>MEMBROS CADASTRADOS (${memberList.length})</h3>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>DISCORD</th>
                            <th>PATENTE</th>
                            ${isBfe ? "<th>EM TESTE</th>" : ""}
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${memberList.length === 0 ? `<tr><td colspan="${isBfe ? 5 : 4}">Nenhum membro cadastrado.</td></tr>` : 
                        memberList.map((m, idx) => `
                            <tr>
                                <td><strong>${m.roblox}</strong></td>
                                <td>${m.discord}</td>
                                <td><span class="rank-tag">${m.rank}</span></td>${isBfe ? `<td>${m.inTest === "Sim" ? "👻 Sim" : "Não"}</td>` : ""}
                                <td>
                                    <button class="action-btn delete-btn" onclick="${deleteFn.name}(${idx})">Excluir</button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById("form-add-member").addEventListener("submit", (e) => {
        e.preventDefault();
        const roblox = document.getElementById("mb-roblox").value.trim();
        const discord = document.getElementById("mb-discord").value.trim();
        const rank = document.getElementById("mb-rank").value;
        const inTest = isBfe ? document.getElementById("mb-test").value : "Não";

        addFn({ id: Date.now(), roblox, discord, rank, inTest });
    });
}

async function addBfeMember(member) {
    if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient.from("bfe_members").insert([{
            roblox: member.roblox,
            discord: member.discord,
            rank: member.rank,
            in_test: member.inTest === "Sim"
        }]).select();

        if (error) {
            console.error("Erro ao adicionar membro BFE no Supabase:", error);
            showToast("Erro", "Não foi possível salvar no banco.", "error");
            return;
        }

        if (data && data[0]) {
            member.id = data[0].id;
        }
    }

    state.bfe.members.push(member);
    saveLocalData();
    await addLog(`Adicionou membro BFE: ${member.roblox}`);
    showToast("Sucesso", "Membro adicionado ao BFE!", "success");
    navigateToPage("bfe-members");
}

async function deleteBfeMember(idx) {
    const removed = state.bfe.members[idx];
    if (removed && window.supabaseClient && removed.id) {
        const { error } = await window.supabaseClient.from("bfe_members").delete().eq("id", removed.id);
        if (error) {
            console.error("Erro ao deletar membro BFE no Supabase:", error);
        }
    }

    state.bfe.members.splice(idx, 1);
    saveLocalData();
    await addLog(`Removeu membro BFE: ${removed?.roblox}`);
    navigateToPage("bfe-members");
}

async function addSgbMember(member) {
    if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient.from("sgb_members").insert([{
            roblox: member.roblox,
            discord: member.discord,
            rank: member.rank
        }]).select();

        if (error) {
            console.error("Erro ao adicionar membro SGB no Supabase:", error);
            showToast("Erro", "Não foi possível salvar no banco.", "error");
            return;
        }

        if (data && data[0]) {
            member.id = data[0].id;
        }
    }

    state.sgb.members.push(member);
    saveLocalData();
    await addLog(`Adicionou membro SGB: ${member.roblox}`);
    showToast("Sucesso", "Membro adicionado à SGB!", "success");
    navigateToPage("sgb-members");
}

async function deleteSgbMember(idx) {
    const removed = state.sgb.members[idx];
    if (removed && window.supabaseClient && removed.id) {
        const { error } = await window.supabaseClient.from("sgb_members").delete().eq("id", removed.id);
        if (error) {
            console.error("Erro ao deletar membro SGB no Supabase:", error);
        }
    }

    state.sgb.members.splice(idx, 1);
    saveLocalData();
    await addLog(`Removeu membro SGB: ${removed?.roblox}`);
    navigateToPage("sgb-members");
}

async function addJornalMember(member) {
    if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient.from("jornal_members").insert([{
            roblox: member.roblox,
            discord: member.discord,
            rank: member.rank
        }]).select();

        if (error) {
            console.error("Erro ao adicionar membro Jornal no Supabase:", error);
            showToast("Erro", "Não foi possível salvar no banco.", "error");
            return;
        }

        if (data && data[0]) {
            member.id = data[0].id;
        }
    }

    state.jornal.members.push(member);
    saveLocalData();
    await addLog(`Adicionou membro Jornal: ${member.roblox}`);
    showToast("Sucesso", "Membro adicionado ao Jornal!", "success");
    navigateToPage("jornal-members");
}

async function deleteJornalMember(idx) {
    const removed = state.jornal.members[idx];
    if (removed && window.supabaseClient && removed.id) {
        const { error } = await window.supabaseClient.from("jornal_members").delete().eq("id", removed.id);
        if (error) {
            console.error("Erro ao deletar membro Jornal no Supabase:", error);
        }
    }

    state.jornal.members.splice(idx, 1);
    saveLocalData();
    await addLog(`Removeu membro Jornal: ${removed?.roblox}`);
    navigateToPage("jornal-members");
}

function renderHierarchyPage(container, dept, ranks, members) {
    const colors = [
        "rgba(114, 169, 255, 0.25)",
        "rgba(85, 239, 196, 0.25)",
        "rgba(253, 121, 168, 0.25)",
        "rgba(254, 202, 87, 0.25)",
        "rgba(255, 159, 243, 0.25)",
        "rgba(72, 219, 251, 0.25)",
        "rgba(29, 209, 161, 0.25)",
        "rgba(255, 107, 107, 0.25)",
        "rgba(200, 214, 229, 0.25)",
        "rgba(131, 149, 167, 0.25)",
        "rgba(224, 86, 36, 0.25)",
        "rgba(16, 172, 137, 0.25)",
        "rgba(156, 136, 255, 0.25)",
        "rgba(251, 197, 49, 0.25)",
        "rgba(232, 65, 24, 0.25)",
        "rgba(0, 168, 255, 0.25)",
        "rgba(140, 122, 230, 0.25)",
        "rgba(78, 205, 196, 0.25)"
    ];

    container.innerHTML = `
        <div class="card-panel">
            <h2>HIERARQUIA DA CATEGORIA ${dept} 👑</h2>
            <div class="hierarchy-container" style="display: flex; flex-direction: column; gap: 20px;">
                ${ranks.map((rank, idx) => {
                    const assigned = members.filter(m => m.rank === rank);
                    const groupColor = colors[idx % colors.length];
                    return `
                        <div class="hierarchy-group" style="background: ${groupColor}; padding: 15px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px;">
                            <div class="rank-header" style="font-weight: 800; font-size: 1.1rem; margin-bottom: 10px; color: var(--rank-header-color, #101010); text-shadow: 0 1px 2px rgba(255, 255, 255, 0.2);">${rank}</div>
                            <div class="rank-members" style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${assigned.length === 0 ? `<span class="empty-rank" style="opacity: 0.7;">Sem membros</span>` : 
                                assigned.map(m => `<div class="rank-user" style="background: rgba(0,0,0,0.4); padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.15);">👤 ${m.roblox}</div>`).join("")}
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}

/* ---------------------------------------------------------
   13. BFE - MODULOS ESPECÍFICOS
--------------------------------------------------------- */
function renderBfeDailyPage(container) {
    const members = state.bfe.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>BFE - COTA DIÁRIA 📅</h2>
            <p class="muted">Os valores são resetados automaticamente às 08:00 do dia seguinte.</p>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>RESULTADO</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="4">Nenhum membro cadastrado.</td></tr>` : 
                        members.map(m => {
                            const data = state.bfe.daily.find(d => d.roblox === m.roblox) || {
                                result: "Incompleto, 800 JJ´s",
                                done: "Não realizado"
                            };
                            const isOk = data.result.includes("concluída") || data.result.includes("certo");
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td><span class="${isOk ? 'status-ok' : 'status-danger'}">${isOk ? "Está tudo certo!" : "Incompleto, 800 JJ´s"}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditBfeDaily('${m.roblox}')">✏️ Editar</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditBfeDaily(roblox) {
    const member = state.bfe.members.find(m => m.roblox === roblox);
    const data = state.bfe.daily.find(d => d.roblox === roblox) || {};

    let requirement = "1 hora de patrulhamento diário.";
    if (member.rank.includes("CANDT")) requirement = "1 hora e 30 minutos de patrulhamento diário.";
    else if (member.rank.includes("OF")) requirement = "3 TAF's diários (ou 30m Patrulha).";
    else if (member.rank.includes("GEN")) requirement = "2 TAF's diários (ou 30m Patrulha).";
    else if (member.rank.includes("SUP")) requirement = "1 TAF diário (ou 30m Patrulha).";

    openModal(`
        <h3>EDITAR COTA DIÁRIA - ${roblox}</h3>
        <p><strong>Discord:</strong> ${member.discord} | <strong>Patente:</strong> ${member.rank}</p>
        <p><strong>Precisava fazer:</strong> ${requirement}</p>
        <div class="form-group">
            <label>Quantidade realizada (TAFs / Minutos / Horas):</label>
            <input type="text" id="edit-daily-done" value="${data.done || ''}" placeholder="Ex: 3 TAFs ou 1h" oninput="autoCalcBfeDaily('${member.rank}')">
        </div>
        <div class="form-group">
            <label>Resultado:</label>
            <select id="edit-daily-res">
                <option value="Cota Diária concluída" ${data.result?.includes("concluída") ? "selected" : ""}>Cota Diária concluída</option>
                <option value="Cota diária não realizada" ${data.result?.includes("não realizada") ? "selected" : ""}>Cota diária não realizada</option>
            </select>
        </div>
        <div class="form-group">
            <label>Punição? (800 JJ's):</label>
            <select id="edit-daily-punish">
                <option value="Não" ${data.punished === "Não" ? "selected" : ""}>Não</option>
                <option value="Sim" ${data.punished === "Sim" ? "selected" : ""}>Sim</option>
            </select>
        </div>
        <div class="form-group">
            <label>Quantas punições já tem nesse mês?:</label>
            <select id="edit-daily-count">
                ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${data.count == n ? "selected" : ""}>${n}</option>`).join("")}
            </select>
        </div>
        <button class="main-button" onclick="saveBfeDaily('${roblox}')">SALVAR COTA DIÁRIA</button>
    `);
}

function autoCalcBfeDaily(rank) {
    const val = document.getElementById("edit-daily-done").value.toLowerCase().trim();
    const resSelect = document.getElementById("edit-daily-res");
    const punishSelect = document.getElementById("edit-daily-punish");
    if (!resSelect || !punishSelect) return;

    let targetTAFs = 0;
    if (rank.includes("OF")) targetTAFs = 3;
    else if (rank.includes("GEN")) targetTAFs = 2;
    else if (rank.includes("SUP")) targetTAFs = 1;

    let isComplete = false;
    const num = parseInt(val) || 0;

    if (targetTAFs > 0) {
        if (num >= targetTAFs || val.includes("30") || val.includes("hora") || val.includes("1h")) {
            isComplete = true;
        }
    } else {
        if (val.includes("1h") || val.includes("60") || val.includes("hora") || num >= 1) {
            isComplete = true;
        }
    }

    if (isComplete) {
        resSelect.value = "Cota Diária concluída";
        punishSelect.value = "Não";
    } else {
        resSelect.value = "Cota diária não realizada";
        punishSelect.value = "Sim";
    }
}

async function saveBfeDaily(roblox) {
    const done = document.getElementById("edit-daily-done").value;
    const result = document.getElementById("edit-daily-res").value;
    const punished = document.getElementById("edit-daily-punish").value;
    const count = document.getElementById("edit-daily-count").value;

    const idx = state.bfe.daily.findIndex(d => d.roblox === roblox);
    const record = { roblox, done, result, punished, count };

    if (idx >= 0) state.bfe.daily[idx] = record;
    else state.bfe.daily.push(record);

    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("cotas_diarias").insert([{
            roblox,
            divisao: "BFE",
            status: result
        }]);
    }

    closeModal();
    navigateToPage("bfe-daily");
    showToast("Salvo", "Cota diária atualizada!", "success");
}

function renderBfeWeeklyPage(container) {
    const members = state.bfe.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>BFE - COTA SEMANAL 🗓️</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="4">Nenhum membro cadastrado.</td></tr>` : 
                        members.map(m => {
                            const data = state.bfe.weekly.find(w => w.roblox === m.roblox) || {
                                result: "Cota Semanal não concluída"
                            };
                            const isOk = data.result.includes("concluída");
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td>
                                        ${isOk ? '<span class="status-ok">Está tudo certo!</span>' : '<span class="status-warning">⚠️ Advertência!</span>'}
                                    </td>
                                    <td><button class="action-btn edit-btn" onclick="openEditBfeWeekly('${m.roblox}')">✏️ Editar</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditBfeWeekly(roblox) {
    const member = state.bfe.members.find(m => m.roblox === roblox);
    const data = state.bfe.weekly.find(w => w.roblox === roblox) || {};

    let req = "8 horas de patrulhamento semanal.";
    if (member.rank.includes("CANDT")) req = "10 horas semanal.";
    else if (member.rank.includes("PR")) req = "9 horas semanal.";
    else if (member.rank.includes("OF")) req = "11 TAF's ou 7h Patrulha.";

    openModal(`
        <h3>EDITAR COTA SEMANAL - ${roblox}</h3>
        <p><strong>Meta da Patente:</strong> ${req}</p>
        <div class="form-group">
            <label>Fez (Horas / TAFs / Tempo):</label>
            <input type="text" id="edit-weekly-time" value="${data.time || ''}" placeholder="Ex: 8h ou 11 TAFs" oninput="autoCalcBfeWeekly('${member.rank}')">
        </div>
        <div class="form-group">
            <label>Resultado:</label>
            <select id="edit-weekly-res">
                <option value="Cota Semanal concluída" ${data.result?.includes("concluída") ? "selected" : ""}>Cota Semanal concluída</option>
                <option value="Cota Semanal não concluída" ${!data.result?.includes("concluída") ? "selected" : ""}>Cota Semanal não concluída</option>
            </select>
        </div>
        <button class="main-button" onclick="saveBfeWeekly('${roblox}')">SALVAR</button>
    `);
}

function autoCalcBfeWeekly(rank) {
    const val = document.getElementById("edit-weekly-time").value.toLowerCase().trim();
    const resSelect = document.getElementById("edit-weekly-res");
    if (!resSelect) return;

    let reqHours = 8;
    if (rank.includes("CANDT")) reqHours = 10;
    else if (rank.includes("PR")) reqHours = 9;
    else if (rank.includes("OF")) reqHours = 7;

    const num = parseInt(val) || 0;
    if (num >= reqHours || val.includes("11 taf") || val.includes("concluido")) {
        resSelect.value = "Cota Semanal concluída";
    } else {
        resSelect.value = "Cota Semanal não concluída";
    }
}

async function saveBfeWeekly(roblox) {
    const time = document.getElementById("edit-weekly-time").value;
    const result = document.getElementById("edit-weekly-res").value;

    const idx = state.bfe.weekly.findIndex(w => w.roblox === roblox);
    const record = { roblox, time, result };

    if (idx >= 0) state.bfe.weekly[idx] = record;
    else state.bfe.weekly.push(record);

    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("cotas_semanais").insert([{
            roblox,
            divisao: "BFE",
            status: result,
            semana: new Date().toISOString().substring(0, 10)
        }]);
    }

    closeModal();
    navigateToPage("bfe-weekly");
}

function renderBfeGhostsPage(container) {
    const ghosts = state.bfe.members.filter(m => m.inTest === "Sim");

    container.innerHTML = `
        <div class="card-panel">
            <h2>FANTASMAS EM TESTE 👻</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>DISCORD</th>
                            <th>PATENTE</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ghosts.length === 0 ? `<tr><td colspan="4">Nenhum fantasma em teste no momento.</td></tr>` : 
                        ghosts.map(g => `
                            <tr>
                                <td><strong>${g.roblox}</strong></td>
                                <td>${g.discord}</td>
                                <td>${g.rank}</td>
                                <td><button class="action-btn edit-btn" onclick="finishGhostTest('${g.roblox}')">✅ Finalizar Aula (Remover de teste)</button></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function finishGhostTest(roblox) {
    const m = state.bfe.members.find(x => x.roblox === roblox);
    if (m) {
        if (window.supabaseClient && m.id) {
            const { error } = await window.supabaseClient
                .from("bfe_members")
                .update({ in_test: false })
                .eq("id", m.id);
            if (error) {
                console.error("Erro ao atualizar status de teste no Supabase:", error);
            }
        }
        m.inTest = "Não";
        saveLocalData();
        await addLog(`Concluiu aula do fantasma em teste: ${roblox}`);
        showToast("Sucesso", "Status alterado para Não!", "success");
        navigateToPage("bfe-ghosts");
    }
}

function renderBfePunishmentsPage(container) {
    const members = state.bfe.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>BFE - PUNIÇÃO ⚖️</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PUNIÇÃO?</th>
                            <th>QUANTIDADE</th>
                            <th>PRAZO</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">Nenhum membro cadastrado.</td></tr>` : 
                        members.map(m => {
                            const p = state.bfe.punishments.find(x => x.roblox === m.roblox) || { active: "Não", qty: "0", limit: "-" };
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${p.active === "Sim" ? "⚠️ Sim" : "Não"}</td>
                                    <td>${p.qty || 0}</td>
                                    <td>${p.limit || "-"}</td>
                                    <td><button class="action-btn edit-btn" onclick="openEditBfePunishment('${m.roblox}')">✏️ Editar</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditBfePunishment(roblox) {
    const p = state.bfe.punishments.find(x => x.roblox === roblox) || {};

    openModal(`
        <h3>GERENCIAR PUNIÇÃO - ${roblox}</h3>
        <div class="form-group">
            <label>Punição?:</label>
            <select id="pun-active">
                <option value="Não" ${p.active === "Não" ? "selected" : ""}>Não</option>
                <option value="Sim" ${p.active === "Sim" ? "selected" : ""}>Sim</option>
            </select>
        </div>
        <div class="form-group">
            <label>Quantidade:</label>
            <input type="number" id="pun-qty" value="${p.qty || 0}">
        </div>
        <div class="form-group">
            <label>Tem até que dia e hora para pagar:</label>
            <input type="datetime-local" id="pun-limit" value="${p.limitRaw || ''}">
        </div>
        <button class="main-button" onclick="saveBfePunishment('${roblox}')">SALVAR PUNIÇÃO</button>
    `);
}

function saveBfePunishment(roblox) {
    const active = document.getElementById("pun-active").value;
    const qty = document.getElementById("pun-qty").value;
    const limitRaw = document.getElementById("pun-limit").value;
    const limit = limitRaw ? new Date(limitRaw).toLocaleString("pt-BR") : "-";

    const idx = state.bfe.punishments.findIndex(x => x.roblox === roblox);
    const rec = { roblox, active, qty, limitRaw, limit };

    if (idx >= 0) state.bfe.punishments[idx] = rec;
    else state.bfe.punishments.push(rec);

    saveLocalData();
    closeModal();
    navigateToPage("bfe-punishments");
}

function renderBfeWarningsPage(container) {
    const members = state.bfe.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>BFE - ADVERTÊNCIA ⚠️</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>ADVERTÊNCIAS</th>
                            <th>AÇÃO RECOMENDADA</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">Nenhum membro cadastrado.</td></tr>` : 
                        members.map(m => {
                            const w = state.bfe.warnings.find(x => x.roblox === m.roblox) || { active: "Não", qty: "0" };
                            const qty = parseInt(w.qty || "0");
                            const isLowRank = m.rank.includes("CANDT") || m.rank.includes("PR");
                            
                            let actionMsg = "-";
                            if (qty >= 2) {
                                actionMsg = isLowRank ? "🚨 EXÍLIO" : "📉 REBAIXAMENTO";
                            }

                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td>${w.active === "Sim" ? qty : 0}</td>
                                    <td><span class="status-danger"><strong>${actionMsg}</strong></span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditBfeWarning('${m.roblox}')">✏️ Editar</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditBfeWarning(roblox) {
    const w = state.bfe.warnings.find(x => x.roblox === roblox) || {};

    openModal(`
        <h3>ADVERTÊNCIA - ${roblox}</h3>
        <div class="form-group">
            <label>Advertência?:</label>
            <select id="warn-active">
                <option value="Não" ${w.active === "Não" ? "selected" : ""}>Não</option>
                <option value="Sim" ${w.active === "Sim" ? "selected" : ""}>Sim</option>
            </select>
        </div>
        <div class="form-group">
            <label>Quantidade:</label>
            <select id="warn-qty">
                <option value="1" ${w.qty == 1 ? "selected" : ""}>1</option>
                <option value="2" ${w.qty == 2 ? "selected" : ""}>2</option>
                <option value="3" ${w.qty == 3 ? "selected" : ""}>3</option>
            </select>
        </div>
        <button class="main-button" onclick="saveBfeWarning('${roblox}')">SALVAR ADVERTÊNCIA</button>
    `);
}

function saveBfeWarning(roblox) {
    const active = document.getElementById("warn-active").value;
    const qty = document.getElementById("warn-qty").value;

    const idx = state.bfe.warnings.findIndex(x => x.roblox === roblox);
    const rec = { roblox, active, qty };

    if (idx >= 0) state.bfe.warnings[idx] = rec;
    else state.bfe.warnings.push(rec);

    saveLocalData();
    closeModal();
    navigateToPage("bfe-warnings");
}

function renderBfeInactivityPage(container) {
    const members = state.bfe.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>BFE - INATIVIDADE 💤</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>DIAS OFF</th>
                            <th>CONSEQUÊNCIA</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="4">Nenhum membro cadastrado.</td></tr>` : 
                        members.map(m => {
                            const inat = state.bfe.inactivity.find(x => x.roblox === m.roblox) || { days: 0 };
                            const d = parseInt(inat.days || 0);

                            let msg = "Normal";
                            if (d >= 7) msg = "🚨 EXÍLIO";
                            else if (d >= 5) msg = "⚠️ ADVERTÊNCIA";
                            else if (d >= 2) msg = "💰 700 JJS";

                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${d} dia(s)</td>
                                    <td><span class="${d >= 2 ? 'status-danger' : 'status-ok'}">${msg}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditInactivity('${m.roblox}')">✏️ Editar</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditInactivity(roblox) {
    const inat = state.bfe.inactivity.find(x => x.roblox === roblox) || { days: 0 };

    openModal(`
        <h3>INATIVIDADE - ${roblox}</h3>
        <div class="form-group">
            <label>Dias OFF:</label>
            <input type="number" id="inat-days" min="0" max="30" value="${inat.days}">
        </div>
        <button class="main-button" onclick="saveInactivity('${roblox}')">SALVAR</button>
    `);
}

function saveInactivity(roblox) {
    const days = document.getElementById("inat-days").value;
    const idx = state.bfe.inactivity.findIndex(x => x.roblox === roblox);
    const rec = { roblox, days };

    if (idx >= 0) state.bfe.inactivity[idx] = rec;
    else state.bfe.inactivity.push(rec);

    saveLocalData();
    closeModal();
    navigateToPage("bfe-inactivity");
}

function renderBfeTrainingPage(container) {
    const members = state.bfe.members;

    container.innerHTML = `
        <div class="card-panel" style="margin-bottom: 25px;">
            <h2>BFE - REGISTRO DE TREINOS 🎯</h2>
            <form id="form-training" class="styled-form">
                <div class="form-group">
                    <label>TIPO DE TREINO:</label>
                    <select id="tr-type">
                        <option value="Operação">Operação</option>
                        <option value="Patrulhamento Geral">Patrulhamento Geral</option>
                        <option value="Treino PVP">Treino PVP</option>
                        <option value="Treino Parkuor">Treino Parkuor</option>
                        <option value="Ranqueado">Ranqueado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>QUEM ESTAVA NO TREINAMENTO (Nicks Roblox separados por vírgula):</label>
                    <input type="text" id="tr-present" placeholder="ex: davi6796, 1davizxx">
                </div>
                <div class="form-group">
                    <label>QUEM ESTAVA DE AVAL (Nicks Roblox separados por vírgula):</label>
                    <input type="text" id="tr-aval" placeholder="ex: koee_annaa">
                </div>
                <div class="form-group">
                    <label>QUEM JUSTIFICOU (Nicks Roblox separados por vírgula):</label>
                    <input type="text" id="tr-justified" placeholder="ex: pão batata">
                </div>
                <button type="submit" class="main-button">GERAR RELATÓRIO DE TREINO</button>
            </form>

            <div id="training-report" class="report-box hidden" style="margin-top: 20px; padding: 15px; border-radius: var(--radius-md); background: rgba(0,0,0,0.3); border: 1px solid var(--border);"></div>
        </div>
    `;

    document.getElementById("form-training").addEventListener("submit", async (e) => {
        e.preventDefault();
        const type = document.getElementById("tr-type").value;
        const presentList = document.getElementById("tr-present").value.split(",").map(x => x.trim().toLowerCase());
        const avalList = document.getElementById("tr-aval").value.split(",").map(x => x.trim().toLowerCase());
        const justList = document.getElementById("tr-justified").value.split(",").map(x => x.trim().toLowerCase());

        const absentList = members.filter(m => {
            const nick = m.roblox.toLowerCase();
            return !presentList.includes(nick) && !avalList.includes(nick) && !justList.includes(nick);
        }).map(m => m.roblox);

        const report = document.getElementById("training-report");
        report.classList.remove("hidden");
        report.innerHTML = `
            <h3>RELATÓRIO DE TREINAMENTO (${type})</h3>
            <p><strong>Presentes:</strong> ${presentList.join(", ") || "Nenhum"}</p>
            <p><strong>Aval:</strong> ${avalList.join(", ") || "Nenhum"}</p>
            <p><strong>Justificados:</strong> ${justList.join(", ") || "Nenhum"}</p>
            <hr style="margin: 10px 0; border-color: var(--border);">
            <p class="status-danger"><strong>LISTA DE FALTOSOS:</strong> ${absentList.join(", ") || "Ninguém faltou!"}</p>
        `;

        await addLog(`Registrou treinamento BFE (${type}).`);
    });
}

/* ---------------------------------------------------------
   14. AVAL (BFE, SGB E JORNAL)
--------------------------------------------------------- */
function renderEvaluationPage(container, dept, evalList, saveFn) {
    const members = state[dept.toLowerCase()].members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>${dept} - AVAL 🛡️</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>INÍCIO</th>
                            <th>TÉRMINO</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">Nenhum membro cadastrado.</td></tr>` : 
                        members.map(m => {
                            const ev = evalList.find(x => x.roblox === m.roblox);
                            const active = ev && ev.endDate && new Date(ev.endDate) > new Date();
                            const expired = ev && ev.endDate && new Date(ev.endDate) <= new Date();

                            let statusHtml = "Sem Aval";
                            if (active) {
                                statusHtml = '<span class="status-warning">🛡️ EM AVAL</span>';
                            } else if (expired) {
                                statusHtml = `<button class="action-btn finish-aval-btn" onclick="finishEval('${m.roblox}', '${dept}')">Aval Finalizado</button>`;
                            }

                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${ev && ev.startDate ? new Date(ev.startDate).toLocaleString("pt-BR") : "-"}</td>
                                    <td>${ev && ev.endDate ? new Date(ev.endDate).toLocaleString("pt-BR") : "-"}</td>
                                    <td>${statusHtml}</td>
                                    <td><button class="action-btn edit-btn" onclick="openEditEval('${m.roblox}', '${dept}')">✏️ Configurar Aval</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function finishEval(roblox, dept) {
    const key = dept.toLowerCase();
    const idx = state[key].evaluations.findIndex(x => x.roblox === roblox);
    if (idx >= 0) {
        state[key].evaluations.splice(idx, 1);
        saveLocalData();
        await addLog(`Finalizou Aval de ${roblox} no ${dept}`);
        showToast("Aval Finalizado", `Aval de ${roblox} retornado ao padrão.`, "success");
        navigateToPage(`${key}-evaluation`);
    }
}

function openEditEval(roblox, dept) {
    openModal(`
        <h3>CONFIGURAR AVAL - ${roblox} (${dept})</h3>
        <div class="form-group">
            <label>Dia que começa:</label>
            <input type="datetime-local" id="ev-start">
        </div>
        <div class="form-group">
            <label>Dia que finaliza:</label>
            <input type="datetime-local" id="ev-end">
        </div>
        <button class="main-button" onclick="saveEval('${roblox}', '${dept}')">SALVAR AVAL</button>
    `);
}

function saveEval(roblox, dept) {
    const startDate = document.getElementById("ev-start").value;
    const endDate = document.getElementById("ev-end").value;

    const key = dept.toLowerCase();
    const idx = state[key].evaluations.findIndex(x => x.roblox === roblox);
    const rec = { roblox, startDate, endDate };

    if (idx >= 0) state[key].evaluations[idx] = rec;
    else state[key].evaluations.push(rec);

    saveLocalData();
    closeModal();
    navigateToPage(`${key}-evaluation`);
}

function saveBfeEval(roblox) { saveEval(roblox, "BFE"); }
function saveSgbEval(roblox) { saveEval(roblox, "SGB"); }
function saveJornalEval(roblox) { saveEval(roblox, "JORNAL"); }

/* ---------------------------------------------------------
   15. SGB - COTA SEMANAL & ADVERTÊNCIA
--------------------------------------------------------- */
function renderSgbWeeklyPage(container) {
    const members = state.sgb.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>SGB - COTA SEMANAL 🗓️</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="4">Nenhum membro cadastrado.</td></tr>` : 
                        members.map(m => {
                            const w = state.sgb.weekly.find(x => x.roblox === m.roblox) || { tickets: 0, result: "Não realizada" };
                            const ok = w.result.includes("concluída");
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td><span class="${ok ? 'status-ok' : 'status-danger'}">${ok ? "Está tudo certo!" : "Incompleto"}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditSgbWeekly('${m.roblox}')">✏️ Editar</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditSgbWeekly(roblox) {
    const w = state.sgb.weekly.find(x => x.roblox === roblox) || {};

    openModal(`
        <h3>COTA SEMANAL SGB - ${roblox}</h3>
        <p><strong>Meta:</strong> Atender tickets e requisições semanais.</p>
        <div class="form-group">
            <label>Quantos tickets atendeu?:</label>
            <input type="number" id="sgb-w-tickets" value="${w.tickets || 0}" min="0" placeholder="Ex: 5" oninput="autoCalcSgbWeekly()">
        </div>
        <div class="form-group">
            <label>Requerente / Observações:</label>
            <input type="text" id="sgb-w-req" value="${w.requerente || ''}" placeholder="Ex: Ticket #1042">
        </div>
        <div class="form-group">
            <label>Status:</label>
            <select id="sgb-w-res">
                <option value="Cota Semanal concluída" ${w.result?.includes("concluída") ? "selected" : ""}>Cota Semanal concluída</option>
                <option value="Cota Semanal não realizada" ${!w.result?.includes("concluída") ? "selected" : ""}>Cota Semanal não realizada</option>
            </select>
        </div>
        <button class="main-button" onclick="saveSgbWeekly('${roblox}')">SALVAR</button>
    `);
}

function autoCalcSgbWeekly() {
    const tickets = parseInt(document.getElementById("sgb-w-tickets").value) || 0;
    const resSelect = document.getElementById("sgb-w-res");
    if (!resSelect) return;

    if (tickets >= 3) {
        resSelect.value = "Cota Semanal concluída";
    } else {
        resSelect.value = "Cota Semanal não realizada";
    }
}

async function saveSgbWeekly(roblox) {
    const tickets = document.getElementById("sgb-w-tickets").value;
    const requerente = document.getElementById("sgb-w-req").value;
    const result = document.getElementById("sgb-w-res").value;

    const idx = state.sgb.weekly.findIndex(x => x.roblox === roblox);
    const rec = { roblox, tickets, requerente, result };

    if (idx >= 0) state.sgb.weekly[idx] = rec;
    else state.sgb.weekly.push(rec);

    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("cotas_semanais").insert([{
            roblox,
            divisao: "SGB",
            status: result,
            semana: new Date().toISOString().substring(0, 10)
        }]);
    }

    closeModal();
    navigateToPage("sgb-weekly");
}

function renderSgbWarningsPage(container) {
    const members = state.sgb.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>SGB - ADVERTÊNCIA ⚠️</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>ADVERTÊNCIAS</th>
                            <th>AÇÃO</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">Nenhum membro cadastrado.</td></tr>` : 
                        members.map(m => {
                            const w = state.sgb.warnings.find(x => x.roblox === m.roblox) || { qty: 0 };
                            const qty = parseInt(w.qty || 0);
                            const isLow = m.rank.includes("EST") || m.rank.includes("APR");
                            let msg = "-";
                            if (qty >= 2) msg = isLow ? "🚨 EXÍLIO" : "📉 REBAIXAMENTO";

                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td>${qty}</td>
                                    <td><span class="status-danger">${msg}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditSgbWarn('${m.roblox}')">✏️ Editar</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditSgbWarn(roblox) {
    openModal(`
        <h3>ADVERTÊNCIA SGB - ${roblox}</h3>
        <div class="form-group">
            <label>Quantidade de Advertências:</label>
            <select id="sgb-warn-qty">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
            </select>
        </div>
        <button class="main-button" onclick="saveSgbWarn('${roblox}')">SALVAR</button>
    `);
}

function saveSgbWarn(roblox) {
    const qty = document.getElementById("sgb-warn-qty").value;
    const idx = state.sgb.warnings.findIndex(x => x.roblox === roblox);
    if (idx >= 0) state.sgb.warnings[idx] = { roblox, qty };
    else state.sgb.warnings.push({ roblox, qty });

    saveLocalData();
    closeModal();
    navigateToPage("sgb-warnings");
}

/* ---------------------------------------------------------
   16. JORNAL - COTAS
--------------------------------------------------------- */
function renderJornalDailyPage(container) {
    const members = state.jornal.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>JORNAL - COTA DIÁRIA 📅</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>RESULTADO</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="4">Nenhum membro cadastrado.</td></tr>` : 
                        members.map(m => {
                            const d = state.jornal.daily.find(x => x.roblox === m.roblox) || { result: "Incompleta" };
                            const ok = d.result.includes("Concluída") || d.result.includes("concluída");
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td><span class="${ok ? 'status-ok' : 'status-danger'}">${ok ? "Está tudo certo!" : "Incompleta"}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditJornalDaily('${m.roblox}')">✏️ Editar</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditJornalDaily(roblox) {
    const d = state.jornal.daily.find(x => x.roblox === roblox) || {};

    openModal(`
        <h3>COTA DIÁRIA JORNAL - ${roblox}</h3>
        <div class="form-group">
            <label>Quantidade de posts/notícias diárias:</label>
            <input type="number" id="jor-d-count" value="${d.count || 0}" min="0" placeholder="Ex: 1" oninput="autoCalcJornalDaily()">
        </div>
        <div class="form-group">
            <label>Resultado:</label>
            <select id="jor-d-res">
                <option value="Cota Diária Concluída" ${d.result?.includes("Concluída") ? "selected" : ""}>Cota Diária Concluída</option>
                <option value="Cota Diária Incompleta" ${!d.result?.includes("Concluída") ? "selected" : ""}>Cota Diária Incompleta</option>
            </select>
        </div>
        <button class="main-button" onclick="saveJornalDaily('${roblox}')">SALVAR</button>
    `);
}

function autoCalcJornalDaily() {
    const count = parseInt(document.getElementById("jor-d-count").value) || 0;
    const resSelect = document.getElementById("jor-d-res");
    if (!resSelect) return;

    if (count >= 1) {
        resSelect.value = "Cota Diária Concluída";
    } else {
        resSelect.value = "Cota Diária Incompleta";
    }
}

async function saveJornalDaily(roblox) {
    const count = document.getElementById("jor-d-count").value;
    const result = document.getElementById("jor-d-res").value;

    const idx = state.jornal.daily.findIndex(x => x.roblox === roblox);
    const rec = { roblox, count, result };

    if (idx >= 0) state.jornal.daily[idx] = rec;
    else state.jornal.daily.push(rec);

    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("cotas_diarias").insert([{
            roblox,
            divisao: "JORNAL",
            status: result
        }]);
    }

    closeModal();
    navigateToPage("jornal-daily");
}

function renderJornalWeeklyPage(container) {
    const members = state.jornal.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>JORNAL - COTA SEMANAL 🗓️</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>MATÉRIAS/JORNAIS FEITOS</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">Nenhum membro cadastrado.</td></tr>` : 
                        members.map(m => {
                            const w = state.jornal.weekly.find(x => x.roblox === m.roblox) || { count: 0, result: "Cota Semanal não está concluída!" };
                            const ok = w.result.includes("concluída") && !w.result.includes("não");
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td>${w.count || 0}</td>
                                    <td>${ok ? '<span class="status-ok">Está tudo certo!</span>' : '<span class="status-warning">⚠️ Advertência!</span>'}</td>
                                    <td><button class="action-btn edit-btn" onclick="openEditJornalWeekly('${m.roblox}')">✏️ Editar</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditJornalWeekly(roblox) {
    const w = state.jornal.weekly.find(x => x.roblox === roblox) || {};

    openModal(`
        <h3>COTA SEMANAL JORNAL - ${roblox}</h3>
        <div class="form-group">
            <label>Quantas matérias/jornais realizou?:</label>
            <input type="number" id="jor-w-count" value="${w.count || 0}" min="0" oninput="autoCalcJornalWeekly()">
        </div>
        <div class="form-group">
            <label>Resultado:</label>
            <select id="jor-w-res">
                <option value="Cota Semanal concluída" ${w.result?.includes("concluída") && !w.result?.includes("não") ? "selected" : ""}>Cota Semanal concluída</option>
                <option value="Cota Semanal não está concluída!" ${w.result?.includes("não") ? "selected" : ""}>Cota Semanal não está concluída!</option>
            </select>
        </div>
        <button class="main-button" onclick="saveJornalWeekly('${roblox}')">SALVAR</button>
    `);
}

function autoCalcJornalWeekly() {
    const count = parseInt(document.getElementById("jor-w-count").value) || 0;
    const resSelect = document.getElementById("jor-w-res");
    if (!resSelect) return;

    if (count >= 2) {
        resSelect.value = "Cota Semanal concluída";
    } else {
        resSelect.value = "Cota Semanal não está concluída!";
    }
}

async function saveJornalWeekly(roblox) {
    const count = document.getElementById("jor-w-count").value;
    const result = document.getElementById("jor-w-res").value;

    const idx = state.jornal.weekly.findIndex(x => x.roblox === roblox);
    if (idx >= 0) state.jornal.weekly[idx] = { roblox, count, result };
    else state.jornal.weekly.push({ roblox, count, result });

    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("cotas_semanais").insert([{
            roblox,
            divisao: "JORNAL",
            status: result,
            semana: new Date().toISOString().substring(0, 10)
        }]);
    }

    closeModal();
    navigateToPage("jornal-weekly");
}

/* ---------------------------------------------------------
   17. PÁGINA DE LOGS
--------------------------------------------------------- */
function renderLogsPage(container) {
    if (!checkLogsAccess()) {
        container.innerHTML = `
            <div class="card-panel">
                <h2>ACESSO RESTRITO 🔒</h2>
                <p class="status-danger">Você não tem permissão para visualizar os LOGS do sistema.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="card-panel">
            <h2>LOGS DO SISTEMA 📁</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>DATA/HORA</th>
                            <th>USUÁRIO</th>
                            <th>AÇÃO</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.logs.length === 0 ? `<tr><td colspan="3">Nenhum log registrado ainda.</td></tr>` : 
                        state.logs.map(l => `
                            <tr>
                                <td>${l.timestamp}</td>
                                <td><strong>${l.user}</strong></td>
                                <td>${l.action}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/* ---------------------------------------------------------
   18. MODAL GLOBAL & TOASTS
--------------------------------------------------------- */
function setupModal() {
    if (elements.modalClose) {
        elements.modalClose.addEventListener("click", closeModal);
    }
}

function openModal(contentHtml) {
    if (elements.modalBody) elements.modalBody.innerHTML = contentHtml;
    if (elements.modal) elements.modal.classList.remove("hidden");
}

function closeModal() {
    if (elements.modal) elements.modal.classList.add("hidden");
}

function showToast(title, msg, type = "info") {
    if (!elements.toastContainer) return;
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    t.innerHTML = `<strong>${title}</strong><p>${msg}</p>`;
    elements.toastContainer.appendChild(t);

    setTimeout(() => {
        t.remove();
    }, 3500);
}

// Funções expostas para escopo global (modais/onClick)
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.saveBfeDaily = saveBfeDaily;
window.saveBfeWeekly = saveBfeWeekly;
window.saveBfePunishment = saveBfePunishment;
window.saveBfeWarning = saveBfeWarning;
window.saveInactivity = saveInactivity;
window.saveEval = saveEval;
window.finishEval = finishEval;
window.saveSgbWeekly = saveSgbWeekly;
window.saveSgbWarn = saveSgbWarn;
window.saveJornalDaily = saveJornalDaily;
window.saveJornalWeekly = saveJornalWeekly;
window.finishGhostTest = finishGhostTest;
window.deleteBfeMember = deleteBfeMember;
window.deleteSgbMember = deleteSgbMember;
window.deleteJornalMember = deleteJornalMember;