(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const nav = $('#navMap');
  const menuToggle = $('#menuToggle');

  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.textContent = open ? '×' : '☰';
  });
  $$('.nav-link').forEach(link => link.addEventListener('click', () => {
    $$('.nav-link').forEach(item => item.classList.remove('active'));
    link.classList.add('active');
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = '☰';
  }));

  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id));
        }
      });
    }, { rootMargin: '-25% 0px -60% 0px' });
    sections.forEach(section => observer.observe(section));
  }

  $$('.filter-pill').forEach(button => button.addEventListener('click', () => {
    $$('.filter-pill').forEach(pill => pill.classList.remove('selected'));
    button.classList.add('selected');
    const filter = button.dataset.filter;
    $$('.event-card').forEach(card => {
      card.hidden = !(filter === 'all' || card.dataset.category === filter);
    });
  }));

  const form = $('#registrationForm');
  const select = $('#eventChoice');
  const message = $('#formMessage');
  const toast = $('#toast');

  // Existing event-card buttons now take visitors to the visible registration form.
  $$('.register-trigger').forEach(button => button.addEventListener('click', () => {
    const requested = button.dataset.event || 'Future VVITU IEEE events';
    const match = [...select.options].find(option => option.value.toLowerCase().includes(requested.toLowerCase()));
    if (match) select.value = match.value;
    $('#register').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => $('#fullName').focus({ preventScroll: true }), 450);
  }));

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const entry = { ...data, createdAt: new Date().toISOString() };
    try {
      const existing = JSON.parse(localStorage.getItem('vvituIeeeDemoRegistrations') || '[]');
      existing.push(entry);
      localStorage.setItem('vvituIeeeDemoRegistrations', JSON.stringify(existing));
      message.textContent = 'Interest saved on this device. This is not an official registration and no details were sent to VVITU/IEEE.';
      toast.textContent = 'Your demo interest has been saved on this device.';
      toast.classList.add('show');
      form.reset();
      window.setTimeout(() => toast.classList.remove('show'), 3500);
    } catch (error) {
      message.textContent = 'Browser storage is unavailable. Your entry was not saved; please try another browser.';
    }
  });

  $('#downloadEntries').addEventListener('click', () => {
    let entries = [];
    try {
      entries = JSON.parse(localStorage.getItem('vvituIeeeDemoRegistrations') || '[]');
    } catch (error) {
      message.textContent = 'Could not read saved entries from this browser.';
      return;
    }
    if (!entries.length) {
      message.textContent = 'No saved entries yet. Submit the form first, then download the CSV.';
      return;
    }
    const columns = ['fullName', 'email', 'phone', 'studentId', 'studyYear', 'department', 'interest', 'eventChoice', 'createdAt'];
    const escapeCsv = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const csv = [columns.join(','), ...entries.map(entry => columns.map(key => escapeCsv(entry[key])).join(','))].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vvitu-ieee-interest-entries.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    message.textContent = 'CSV downloaded. Keep these personal details private.';
  });
})();