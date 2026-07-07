/**
 * auth.js — Controle de acesso (admin via Supabase Auth / visitante)
 *
 * Cada página define window.__AUTH_CONFIG__ antes de carregar este script:
 *   { adminOnly: bool, loginPath: '...login.html', homePath: '...index.html' }
 */
(function () {
  const VISITOR_KEY = 'repo_visitor';
  const cfg = window.__AUTH_CONFIG__ || {};
  const loginPath = cfg.loginPath || 'login.html';
  const homePath  = cfg.homePath  || 'index.html';
  const adminOnly = !!cfg.adminOnly;

  function showBody() {
    document.body.style.visibility = 'visible';
  }

  function getInitials(email) {
    const local = (email.split('@')[0] || '').trim();
    const parts = local.split(/[.\-_]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return local.slice(0, 2).toUpperCase();
  }

  function renderAuthStatus(isAdmin, session) {
    const el = document.getElementById('authStatus');
    if (!el) return;
    if (isAdmin) {
      const email = session.user.email;
      el.innerHTML =
        '<div class="user-menu">' +
          '<button type="button" id="userMenuBtn" class="user-avatar-btn" title="' + email + '">' + getInitials(email) + '</button>' +
          '<div id="userMenuDropdown" class="user-menu-dropdown">' +
            '<div class="user-menu-email">' + email + '</div>' +
            '<button type="button" id="changePasswordBtn" class="user-menu-item">Alterar Senha</button>' +
            '<button type="button" id="logoutMenuBtn" class="user-menu-item user-menu-item--danger">Sair</button>' +
          '</div>' +
        '</div>';

      const dropdown = document.getElementById('userMenuDropdown');
      document.getElementById('userMenuBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      dropdown.addEventListener('click', (e) => e.stopPropagation());
      document.addEventListener('click', () => dropdown.classList.remove('open'));

      document.getElementById('logoutMenuBtn').addEventListener('click', async () => {
        await db.auth.signOut();
        localStorage.removeItem(VISITOR_KEY);
        window.location.href = loginPath;
      });

      document.getElementById('changePasswordBtn').addEventListener('click', () => {
        dropdown.classList.remove('open');
        openChangePasswordModal();
      });
    } else {
      el.innerHTML =
        '<span class="auth-visitor-badge">Visitante</span>' +
        '<button type="button" id="authLoginBtn" class="auth-logout-btn">Entrar como admin</button>';
      document.getElementById('authLoginBtn').addEventListener('click', () => {
        window.location.href = loginPath;
      });
    }
  }

  function openChangePasswordModal() {
    let modal = document.getElementById('changePasswordModal');
    if (modal) {
      modal.classList.add('modal-open');
      return;
    }

    modal = document.createElement('div');
    modal.id = 'changePasswordModal';
    modal.className = 'modal-overlay modal-open';
    modal.innerHTML =
      '<div class="modal-dialog" style="max-width:380px">' +
        '<div class="modal-header">' +
          '<h2 class="modal-title">Alterar Senha</h2>' +
          '<button type="button" id="cpModalClose" class="modal-close-btn" aria-label="Fechar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="18" height="18">' +
              '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<form id="cpForm" class="add-form">' +
            '<div class="form-group">' +
              '<label for="cpNewPassword">Nova senha</label>' +
              '<input type="password" id="cpNewPassword" required minlength="6" autocomplete="new-password" placeholder="Mínimo 6 caracteres" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label for="cpConfirmPassword">Confirmar nova senha</label>' +
              '<input type="password" id="cpConfirmPassword" required minlength="6" autocomplete="new-password" />' +
            '</div>' +
            '<div id="cpMessage" class="login-error" style="display:none"></div>' +
            '<div class="form-actions">' +
              '<button type="submit" class="btn btn-primary">Salvar</button>' +
              '<button type="button" id="cpCancelBtn" class="btn btn-secondary">Cancelar</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    const close = () => modal.classList.remove('modal-open');
    modal.querySelector('#cpModalClose').addEventListener('click', close);
    modal.querySelector('#cpCancelBtn').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    modal.querySelector('#cpForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = document.getElementById('cpNewPassword').value;
      const confirm = document.getElementById('cpConfirmPassword').value;
      const msg = document.getElementById('cpMessage');
      msg.style.display = 'none';

      if (pass !== confirm) {
        msg.textContent = 'As senhas não coincidem.';
        msg.style.display = '';
        return;
      }

      const { error } = await db.auth.updateUser({ password: pass });
      if (error) {
        msg.textContent = 'Não foi possível alterar a senha: ' + error.message;
        msg.style.display = '';
        return;
      }

      msg.style.color = '#166534';
      msg.style.background = '#f0fdf4';
      msg.style.borderColor = '#bbf7d0';
      msg.textContent = 'Senha alterada com sucesso!';
      msg.style.display = '';
      setTimeout(close, 1200);
    });
  }

  async function run() {
    let session = null;
    try {
      const { data } = await db.auth.getSession();
      session = data.session;
    } catch (err) {
      console.error('Falha ao verificar sessão:', err);
    }

    const isAdmin = !!session;
    const isVisitor = localStorage.getItem(VISITOR_KEY) === '1';

    if (!isAdmin && !isVisitor) {
      window.location.replace(loginPath);
      return;
    }
    if (adminOnly && !isAdmin) {
      window.location.replace(homePath);
      return;
    }

    window.__isAdmin = isAdmin;
    document.documentElement.classList.add(isAdmin ? 'is-admin' : 'is-visitor');
    renderAuthStatus(isAdmin, session);
    showBody();
  }

  run();
})();
