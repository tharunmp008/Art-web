// ---------- Gallery filter ----------
    (function () {
      var chips = document.querySelectorAll('.chip');
      var items = { forEach: function (fn) { document.querySelectorAll('#galleryGrid .g-item').forEach(fn); } };

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var filter = chip.getAttribute('data-filter');

          chips.forEach(function (c) { c.classList.remove('active'); });
          chip.classList.add('active');

          items.forEach(function (item) {
            var cats = item.getAttribute('data-cat') || '';
            var show = filter === 'all' || cats.split(' ').indexOf(filter) !== -1;
            item.classList.toggle('hidden', !show);
          });
        });
      });
    })();

    

    (function () {
      var CAT_KEY = { 'Pencil Art': 'pencil', 'Sketches': 'sketches', 'Portraits': 'portraits', 'Paintings': 'paintings' };
      var MAX_SIDE = 1600;

      var grid = document.getElementById('galleryGrid');
      var modal = document.getElementById('addModal');
      var openBtn = document.getElementById('addArtBtn');
      var closeBtn = document.getElementById('addClose');
      var submitBtn = document.getElementById('addSubmit');
      var statusEl = document.getElementById('addStatus');

      function openModal() { modal.classList.add('open'); }
      function closeModal() { modal.classList.remove('open'); statusEl.textContent = ''; }

      openBtn.addEventListener('click', openModal);
      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

      function setStatus(msg, type) {
        statusEl.textContent = msg;
        statusEl.className = 'form-status ' + (type || '');
      }

      // Load the chosen file into an image element
      function readAsImage(file) {
        return new Promise(function (resolve, reject) {
          var url = URL.createObjectURL(file);
          var img = new Image();
          img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
          img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not read the image')); };
          img.src = url;
        });
      }

      // Resize to at most MAX_SIDE and re-encode as JPEG (keeps uploads small)
      function toJpegBase64(file) {
        return readAsImage(file).then(function (img) {
          var scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
          var w = Math.round(img.width * scale);
          var h = Math.round(img.height * scale);
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        });
      }

      // Build a gallery card with text set via textContent (safe from markup injection)
      function createCard(item) {
        var article = document.createElement('article');
        article.className = 'g-item span-4 uploaded';
        article.setAttribute('data-cat', CAT_KEY[item.category] || '');

        var media = document.createElement('div');
        media.className = 'g-media';
        var img = document.createElement('img');
        img.className = 'art-img';
        img.loading = 'lazy';
        img.alt = item.title;
        img.src = item.image;
        media.appendChild(img);

        var foot = document.createElement('div');
        foot.className = 'g-foot';
        var meta = document.createElement('div');
        meta.className = 'g-meta';
        var title = document.createElement('h3');
        title.className = 'g-title';
        title.textContent = item.title;
        var sub = document.createElement('span');
        sub.className = 'g-sub';
        sub.textContent = 'M.P. Tharun';
        meta.appendChild(title);
        meta.appendChild(sub);

        var tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = item.category;

        foot.appendChild(meta);
        foot.appendChild(tag);
        article.appendChild(media);
        article.appendChild(foot);
        return article;
      }

      // Load saved artworks from the sheet and add them after the original cards
      function loadGallery() {
        fetch(SCRIPT_URL + '?action=artworks')
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data.success) return;
            grid.querySelectorAll('.g-item.uploaded').forEach(function (n) { n.remove(); });
            data.artworks.forEach(function (item) { grid.appendChild(createCard(item)); });
            var active = document.querySelector('.chip.active');
            if (active) active.click(); // re-apply the current filter
          })
          .catch(function () { /* keep the built-in gallery if the list cannot load */ });
      }

      submitBtn.addEventListener('click', function () {
        var password = document.getElementById('adminPassword').value;
        var title = document.getElementById('artTitle').value.trim();
        var category = document.getElementById('artCategory').value;
        var file = document.getElementById('artFile').files[0];

        if (!password) { setStatus('Enter the admin password.', 'err'); return; }
        if (!title) { setStatus('Enter a title.', 'err'); return; }
        if (!category) { setStatus('Choose a category.', 'err'); return; }
        if (!file) { setStatus('Choose an image.', 'err'); return; }
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setStatus('Use a JPG, PNG or WebP image.', 'err'); return; }

        submitBtn.disabled = true;
        setStatus('Uploading…');

        toJpegBase64(file)
          .then(function (b64) {
            var payload = {
              action: 'addArtwork',
              password: password,
              title: title,
              category: category,
              filename: title.replace(/[^a-z0-9]+/gi, '-').toLowerCase(),
              data: b64
            };
            return fetch(SCRIPT_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(payload)
            });
          })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.success) {
              setStatus('Artwork added to the gallery.', 'ok');
              document.getElementById('artTitle').value = '';
              document.getElementById('artCategory').value = '';
              document.getElementById('artFile').value = '';
              loadGallery();
              setTimeout(closeModal, 1200);
            } else {
              setStatus(res.error || 'Upload failed. Check the password and try again.', 'err');
            }
          })
          .catch(function () {
            setStatus('Upload failed. Please try again.', 'err');
          })
          .then(function () {
            submitBtn.disabled = false;
          });
      });

      loadGallery();
    })();
  

    (function () {
      var grid = document.getElementById('galleryGrid');
      var lightbox = document.getElementById('lightbox');
      var lightboxImg = document.getElementById('lightboxImg');
      var lightboxCaption = document.getElementById('lightboxCaption');
      var data = { likes: {}, comments: {} };

      function el(tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined) node.textContent = text;
        return node;
      }

      function keyOf(card) {
        var title = card.querySelector('.g-title');
        return title ? title.textContent.trim() : '';
      }

      function imageOf(card) {
        var img = card.querySelector('.g-media img');
        return img ? img.getAttribute('src') : '';
      }

      function isLiked(key) {
        try { return localStorage.getItem('liked:' + key) === '1'; } catch (e) { return false; }
      }
      function markLiked(key) {
        try { localStorage.setItem('liked:' + key, '1'); } catch (e) {}
      }

      // Send a JSON action to Apps Script (POST as text/plain)
      function postAction(payload) {
        return fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (!res.success) throw new Error(res.error || 'Request failed');
            return res;
          });
      }

      // Full-size viewer
      function openViewer(card) {
        lightboxImg.src = imageOf(card);
        lightboxImg.alt = keyOf(card);
        lightboxCaption.textContent = keyOf(card);
        lightbox.classList.add('open');
      }
      function closeViewer() {
        lightbox.classList.remove('open');
        lightboxImg.removeAttribute('src');
      }
      document.getElementById('lightboxClose').addEventListener('click', closeViewer);
      lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeViewer(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeViewer(); });

      // Update counts, liked state, and comments on a card from the cached data
      function refresh(card) {
        var key = card.getAttribute('data-key');
        if (!key) return;

        var likeBtn = card.querySelector('.like-btn');
        var likeCount = likeBtn.querySelector('.action-count');
        likeCount.textContent = data.likes[key] || 0;
        likeBtn.classList.toggle('liked', isLiked(key));

        var commentBtn = card.querySelector('.comment-btn');
        var list = data.comments[key] || [];
        commentBtn.querySelector('.action-count').textContent = list.length;

        var listEl = card.querySelector('.comment-list');
        listEl.textContent = '';
        if (list.length === 0) {
          listEl.appendChild(el('p', 'comment-empty', 'No comments yet. Be the first to share your thoughts.'));
        } else {
          list.forEach(function (c) {
            var item = el('div', 'comment-item');
            item.appendChild(el('strong', '', c.name));
            item.appendChild(document.createTextNode(c.comment));
            listEl.appendChild(item);
          });
        }
      }

      // Add the View / Like / Comment controls to a card (once)
      function decorate(card) {
        if (card.querySelector('.g-actions')) return;
        var key = keyOf(card);
        if (!key) return;
        card.setAttribute('data-key', key);

        var actions = el('div', 'g-actions');

        var viewBtn = el('button', 'action-btn view-btn', 'View');
        viewBtn.type = 'button';
        viewBtn.addEventListener('click', function () { openViewer(card); });

        var likeBtn = el('button', 'action-btn like-btn');
        likeBtn.type = 'button';
        likeBtn.appendChild(document.createTextNode('Like '));
        likeBtn.appendChild(el('span', 'action-count', '0'));
        likeBtn.addEventListener('click', function () {
          if (isLiked(key)) return;
          markLiked(key);
          data.likes[key] = (data.likes[key] || 0) + 1;
          refreshAllFor(key);
          postAction({ action: 'like', artwork: key }).catch(function () {
            markUnliked(key);
            data.likes[key] = Math.max(0, (data.likes[key] || 1) - 1);
            refreshAllFor(key);
          });
        });

        var commentBtn = el('button', 'action-btn comment-btn');
        commentBtn.type = 'button';
        commentBtn.appendChild(document.createTextNode('Comments '));
        commentBtn.appendChild(el('span', 'action-count', '0'));

        actions.appendChild(viewBtn);
        actions.appendChild(likeBtn);
        actions.appendChild(commentBtn);

        // Comment panel: list of comments plus a form
        var panel = el('div', 'comment-panel');
        panel.hidden = true;

        var listEl = el('div', 'comment-list');

        var form = el('div', 'comment-form');
        var nameInput = el('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Your name (optional)';
        nameInput.maxLength = 60;
        var textInput = el('textarea');
        textInput.placeholder = 'Write your comment about this artwork...';
        textInput.maxLength = 300;
        var postBtn = el('button', 'post-btn', 'Post comment');
        postBtn.type = 'button';
        var status = el('p', 'comment-status');
        status.setAttribute('role', 'status');

        form.appendChild(nameInput);
        form.appendChild(textInput);
        form.appendChild(postBtn);
        form.appendChild(status);

        panel.appendChild(listEl);
        panel.appendChild(form);

        commentBtn.addEventListener('click', function () {
          panel.hidden = !panel.hidden;
        });

        postBtn.addEventListener('click', function () {
          var text = textInput.value.trim();
          var name = nameInput.value.trim();
          if (!text) {
            status.textContent = 'Please write a comment first.';
            status.className = 'comment-status err';
            return;
          }
          postBtn.disabled = true;
          status.textContent = 'Posting…';
          status.className = 'comment-status';

          postAction({ action: 'comment', artwork: key, name: name, comment: text })
            .then(function () {
              data.comments[key] = data.comments[key] || [];
              data.comments[key].push({ name: name || 'Visitor', comment: text, time: new Date().toISOString() });
              textInput.value = '';
              status.textContent = 'Thank you! Your comment was posted.';
              refreshAllFor(key);
            })
            .catch(function () {
              status.textContent = 'Could not post the comment. Please try again.';
              status.className = 'comment-status err';
            })
            .then(function () {
              postBtn.disabled = false;
            });
        });

        card.appendChild(actions);
        card.appendChild(panel);
        refresh(card);
      }

      function markUnliked(key) {
        try { localStorage.removeItem('liked:' + key); } catch (e) {}
      }

      function refreshAllFor(key) {
        grid.querySelectorAll('.g-item').forEach(function (card) {
          if (card.getAttribute('data-key') === key) refresh(card);
        });
      }

      // Decorate cards that appear later (for example, after an upload)
      var observer = new MutationObserver(function () {
        grid.querySelectorAll('.g-item').forEach(function (card) {
          if (!card.querySelector('.g-actions')) decorate(card);
        });
      });
      observer.observe(grid, { childList: true });

      // Load like counts and comments from the sheet
      function loadEngagement() {
        fetch(SCRIPT_URL + '?action=engagement')
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (!res.success) return;
            data.likes = res.likes || {};
            data.comments = res.comments || {};
            grid.querySelectorAll('.g-item').forEach(function (card) {
              decorate(card);
              refresh(card);
            });
          })
          .catch(function () {
            // Buttons still work without the saved counts
            grid.querySelectorAll('.g-item').forEach(decorate);
          });
      }

      grid.querySelectorAll('.g-item').forEach(decorate);
      loadEngagement();
    })();
