/**
 * auth.js — Handles sign-in (member) and admin-login forms.
 * Depends on api.js being loaded first.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ─── MEMBER SIGN-IN FORM (sign-in) ──────────────────
  const memberForm = document.querySelector('.signin-form');
  if (memberForm) {
    // If already logged in, redirect to home
    if (BSC.isLoggedIn() && BSC.getUser()?.role === 'member') {
      window.location.href = '/pages/home';
      return;
    }

    // Check for sign-up link and toggle behaviour
    const signUpLink = document.querySelector('.signin-card__signup-link');
    let isSignUpMode = false;

    if (signUpLink) {
      signUpLink.addEventListener('click', (e) => {
        e.preventDefault();
        isSignUpMode = !isSignUpMode;
        toggleSignUpMode(isSignUpMode);
      });
    }

    function toggleSignUpMode(show) {
      const title = document.querySelector('.signin-card__title');
      const eyebrow = document.querySelector('.signin-card__eyebrow');
      const signUpText = document.querySelector('.signin-card__signup-text');
      const submitBtn = memberForm.querySelector('.signin-form__button');

      if (show) {
        // Inject extra fields
        if (!document.getElementById('signup-extra-fields')) {
          const extra = document.createElement('div');
          extra.id = 'signup-extra-fields';
          extra.innerHTML = `
            <div class="signin-form__group">
              <label class="signin-form__label">First Name</label>
              <input id="signup-firstname" type="text" placeholder="Enter your first name" class="signin-form__input" required />
            </div>
            <div class="signin-form__group">
              <label class="signin-form__label">Last Name</label>
              <input id="signup-lastname" type="text" placeholder="Enter your last name" class="signin-form__input" required />
            </div>
            <div class="signin-form__group">
              <label class="signin-form__label">Phone Number</label>
              <input id="signup-phone" type="tel" placeholder="e.g. 0812345678" class="signin-form__input" required />
            </div>
          `;
          memberForm.insertBefore(extra, memberForm.querySelector('.signin-form__group'));
        }
        if (title) title.textContent = 'Create your account';
        if (eyebrow) eyebrow.textContent = 'New here?';
        if (submitBtn) submitBtn.textContent = 'Sign Up';
        if (signUpLink) signUpLink.textContent = 'Log In';
        signUpText.innerHTML = `Already have an account? <a href="#" class="signin-card__signup-link">Log In</a>`;
      } else {
        document.getElementById('signup-extra-fields')?.remove();
        if (title) title.textContent = 'Sign in to your account';
        if (eyebrow) eyebrow.textContent = 'Welcome back';
        if (submitBtn) submitBtn.textContent = 'Log In';
        signUpText.innerHTML = `<a href="#" class="signin-card__signup-link">Sign Up</a> here if you do not have an account`;
      }

      // Re-bind signup link click
      document.querySelector('.signin-card__signup-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        isSignUpMode = !isSignUpMode;
        toggleSignUpMode(isSignUpMode);
      });
    }

    memberForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = memberForm.querySelector('.signin-form__button');
      const emailEl = document.getElementById('email');
      const passwordEl = document.getElementById('password');

      if (!emailEl || !passwordEl) return;

      btn.disabled = true;
      btn.textContent = isSignUpMode ? 'Creating account…' : 'Signing in…';

      try {
        if (isSignUpMode) {
          const firstName = document.getElementById('signup-firstname')?.value.trim();
          const lastName  = document.getElementById('signup-lastname')?.value.trim();
          const phone     = document.getElementById('signup-phone')?.value.trim();

          const data = await BSC.apiFetch('/api/auth/member/register', {
            method: 'POST',
            body: JSON.stringify({
              firstName, lastName, phone,
              email: emailEl.value.trim(),
              password: passwordEl.value,
            }),
          });

          // BSC.saveSession(data.token, data.user); // Removed auto-login
          BSC.showToast('Account created! Please log in.', 'success');
          setTimeout(() => { window.location.href = 'sign-in'; }, 1000);

        } else {
          const data = await BSC.apiFetch('/api/auth/member/login', {
            method: 'POST',
            body: JSON.stringify({
              email: emailEl.value.trim(),
              password: passwordEl.value,
            }),
          });

          BSC.saveSession('member', data.token, data.user);
          BSC.showToast(`Welcome back, ${data.user.firstName}!`, 'success');
          setTimeout(() => { window.location.href = 'home'; }, 1000);
        }
      } catch (err) {
        BSC.showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = isSignUpMode ? 'Sign Up' : 'Log In';
      }
    });
  }

  // ─── ADMIN LOGIN FORM (admin-login) ─────────────────
  const adminForm = document.querySelector('.admin-login-form');
  if (adminForm) {
    // If already logged in as admin, redirect to admin-panel
    if (BSC.isLoggedIn('admin')) {
      window.location.href = '/pages/admin-panel';
      return;
    }
    adminForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = adminForm.querySelector('.admin-login-form__button');
      const emailEl = adminForm.querySelector('input[type="email"]');
      const passwordEl = adminForm.querySelector('input[type="password"]');

      btn.disabled = true;
      btn.textContent = 'Signing in…';

      try {
        const data = await BSC.apiFetch('/api/auth/admin/login', {
          method: 'POST',
          body: JSON.stringify({
            email: emailEl.value.trim(),
            password: passwordEl.value,
          }),
        });

        BSC.saveSession('admin', data.token, data.user);
        BSC.showToast('Welcome, Admin!', 'success');
        setTimeout(() => { window.location.href = 'admin-panel'; }, 1000);
      } catch (err) {
        BSC.showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Log In';
      }
    });
  }

  // ─── ADMIN SIGNUP FORM (admin-signup) ──────────────
  const adminSignupForm = document.querySelector('.admin-signup-form');
  if (adminSignupForm) {
    adminSignupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = adminSignupForm.querySelector('.admin-login-form__button');
      
      const firstNameEl = document.getElementById('signup-firstname');
      const lastNameEl = document.getElementById('signup-lastname');
      const emailEl = document.getElementById('signup-email');
      const passwordEl = document.getElementById('signup-password');
      const addressEl = document.getElementById('signup-address');
      const ageEl = document.getElementById('signup-age');
      const phoneEl = document.getElementById('signup-phone');

      btn.disabled = true;
      btn.textContent = 'Creating account…';

      try {
        const data = await BSC.apiFetch('/api/auth/admin/register', {
          method: 'POST',
          body: JSON.stringify({
            firstName: firstNameEl.value.trim(),
            lastName: lastNameEl.value.trim(),
            email: emailEl.value.trim(),
            password: passwordEl.value,
            address: addressEl.value.trim(),
            age: ageEl.value,
            phone: phoneEl.value.trim(),
          }),
        });

        // BSC.saveSession(data.token, data.user); // Removed auto-login
        BSC.showToast('Admin account created! Please log in.', 'success');
        setTimeout(() => { window.location.href = 'admin-login'; }, 1000);
      } catch (err) {
        BSC.showToast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }

  // Note: Global logout handler moved to api.js for unified multi-session support.

});
