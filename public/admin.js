async function fetchRequests() {
  const container = document.getElementById('requests');
  container.innerHTML = '';
  try {
    const res = await fetch('/api/requests');
    if (!res.ok) throw new Error('Failed to fetch requests');
    const data = await res.json();
    if (!data.length) {
      container.textContent = 'No requests yet.';
      return;
    }

    data.forEach(r => {
      const el = document.createElement('div');
      el.className = 'requestItem';

      const title = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = r.programName || r.raw || 'Unknown';
      const meta = document.createElement('span');
      meta.style.float = 'right';
      meta.textContent = r.timestamp || '';

      title.appendChild(name);
      title.appendChild(meta);

      const info = document.createElement('div');
      info.innerHTML = `— requested by <em>${escapeHtml(r.requestedBy || '')}</em>`;

      el.appendChild(title);
      el.appendChild(info);

      if (r.programDescription) {
        const d = document.createElement('div');
        d.className = 'desc';
        d.textContent = r.programDescription;
        el.appendChild(d);
      }

      // approval controls
      const ctrl = document.createElement('div');
      ctrl.style.marginTop = '8px';
      if (r.approved) {
        const span = document.createElement('span');
        span.textContent = `Approved by ${r.approvedBy || 'admin'} at ${r.approvedAt || ''}`;
        ctrl.appendChild(span);
      } else {
        const approveBtn = document.createElement('button');
        approveBtn.className = 'admin-btn';
        approveBtn.textContent = 'Approve';
        approveBtn.addEventListener('click', async () => {
          if (!confirm('Approve this request?')) return;
          try {
            const res = await fetch(`/api/requests/${encodeURIComponent(r.id)}/approve`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ approvedBy: 'admin' }) });
            if (!res.ok) throw new Error('approve failed');
            await fetchRequests();
            alert('Request approved');
          } catch (e) { alert('Approve failed: ' + e.message); }
        });
        ctrl.appendChild(approveBtn);
      }
      el.appendChild(ctrl);

      container.appendChild(el);
    });
  } catch (err) {
    container.textContent = 'Error loading requests: ' + err.message;
  }
}

async function loadLog() {
  const type = document.getElementById('logType').value;
  const res = await fetch(`/api/logs?type=${encodeURIComponent(type)}`);
  const data = await res.json();
  const out = document.getElementById('logOutput');
  if (!data || !data.length) {
    out.textContent = 'No log entries';
    return;
  }
  out.textContent = data.join('\n');
}

window.addEventListener('DOMContentLoaded', () => {
  fetchRequests();
  document.getElementById('loadLog').addEventListener('click', loadLog);
  // add a refresh button for requests
  const refresh = document.createElement('button');
  refresh.textContent = 'Refresh Requests';
  refresh.className = 'admin-btn';
  refresh.style.marginBottom = '12px';
  refresh.addEventListener('click', fetchRequests);
  const requestsSection = document.getElementById('requests');
  requestsSection.parentNode.insertBefore(refresh, requestsSection);

  // add clear log controls
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear Selected Log';
  clearBtn.className = 'admin-btn';
  clearBtn.style.marginLeft = '8px';
  clearBtn.addEventListener('click', async () => {
    const type = document.getElementById('logType').value;
    if (!confirm('Clear ' + type + ' log? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/logs/clear?type=' + encodeURIComponent(type), { method: 'POST' });
      const j = await res.json();
      alert('Cleared: ' + (j.cleared || 'none'));
      loadLog();
    } catch (e) { alert('Clear failed: ' + e.message); }
  });

  const clearAllBtn = document.createElement('button');
  clearAllBtn.textContent = 'Clear All Logs';
  clearAllBtn.className = 'admin-btn';
  clearAllBtn.style.marginLeft = '8px';
  clearAllBtn.addEventListener('click', async () => {
    if (!confirm('Clear all logs? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/logs/clear?type=all', { method: 'POST' });
      const j = await res.json();
      alert('Cleared all logs');
      loadLog();
    } catch (e) { alert('Clear failed: ' + e.message); }
  });

  // attach clear buttons next to loadLog
  const loadBtn = document.getElementById('loadLog');
  loadBtn.parentNode.insertBefore(clearBtn, loadBtn.nextSibling);
  loadBtn.parentNode.insertBefore(clearAllBtn, clearBtn.nextSibling);
});

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s];
  });
}
