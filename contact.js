// ---------- Copy email ----------
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var text = btn.getAttribute('data-copy');
        var original = btn.textContent;

        function done() {
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = original; }, 1500);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
        } else {
          fallbackCopy(text);
          done();
        }
      });
    });

    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }

    // ---------- Contact form → Google Apps Script ----------

    var form = document.getElementById('contactForm');
    var submitBtn = document.getElementById('submitBtn');
    var statusEl = document.getElementById('formStatus');

    function setStatus(msg, type) {
      statusEl.textContent = msg;
      statusEl.className = 'form-status ' + (type || '');
    }

    function showSuccess() {
      setStatus('Thank you! Your message has been sent. Tharun will reply within 24–48 hours.', 'ok');
      ['name', 'email', 'phone'].forEach(function (id) {
        document.getElementById(id).value = '';
      });
      document.getElementById('description').value = '';
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Send Message';
    }

    function showError() {
      setStatus('Something went wrong while sending. Please try again or email tharunmp008@gmail.com directly.', 'err');
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Send Message';
    }

    function sendForm() {

      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim();
      var phone = document.getElementById('phone').value.trim();
      var description = document.getElementById('description').value.trim().slice(0, 500);

      if (!name || !email) {
        setStatus('Please fill in your name and email address.', 'err');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus('Please enter a valid email address.', 'err');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Sending…';
      setStatus('');

      var url = SCRIPT_URL + "?" + new URLSearchParams({ name: name, email: email, phone: phone, description: description });

      fetch(url, { method: "GET", mode: "no-cors" })
        .then(() => showSuccess())
        .catch(() => showError());
    }

    submitBtn.addEventListener('click', sendForm);
    ['name', 'email', 'phone'].forEach(function (id) {
      document.getElementById(id).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); sendForm(); }
      });
    });
