/**
 * CPM 5.0 — App.js: Khởi tạo Dashboard
 * Layer: 03_Outputs/assets/js
 */

document.addEventListener('DOMContentLoaded', async () => {

  // Hiển thị ngày hiện tại
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('dateDisplay').textContent =
    new Date().toLocaleDateString('vi-VN', opts);

  // Refresh button
  document.getElementById('btnRefresh')?.addEventListener('click', loadDashboard);

  await loadDashboard();
});

async function loadDashboard() {
  try {
    const [projects, tasks, contracts] = await Promise.all([
      ApiClient.list('projects'),
      ApiClient.list('tasks'),
      ApiClient.list('contracts')
    ]);

    State.set('projects', projects);
    State.set('tasks', tasks);
    State.set('contracts', contracts);

    renderKPIs(projects, tasks, contracts);
    renderProjectsTable(projects.slice(0, 8));
    renderChartProjects(projects);
    renderChartTasks(tasks);

  } catch (err) {
    Utils.toast('Lỗi tải dữ liệu: ' + err.message, 'danger');
  }
}

function renderKPIs(projects, tasks, contracts) {
  const activeProjects = projects.filter(p => p.trangThai === 'Đang thi công').length;
  const doneTasks      = tasks.filter(t => t.trangThai === 'Hoàn thành').length;
  const lateTasks      = tasks.filter(t => t.trangThai === 'Trễ hạn').length;
  const activeContracts = contracts.length;

  document.getElementById('kpiProjects').textContent  = activeProjects;
  document.getElementById('kpiTasksDone').textContent = doneTasks;
  document.getElementById('kpiTasksLate').textContent = lateTasks;
  document.getElementById('kpiContracts').textContent = activeContracts;
}

function renderProjectsTable(projects) {
  const tbody = document.getElementById('bodyRecentProjects');
  if (!projects.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Không có dữ liệu</td></tr>`;
    return;
  }

  const statusBadge = {
    'Chuẩn bị':      'badge bg-secondary',
    'Đang thi công':  'badge bg-primary',
    'Hoàn thành':     'badge bg-success',
    'Tạm dừng':       'badge bg-warning text-dark'
  };

  tbody.innerHTML = projects.map(p => `
    <tr>
      <td><code class="text-primary">${p.maDA}</code></td>
      <td class="fw-medium">${p.tenDA}</td>
      <td><span class="${statusBadge[p.trangThai] || 'badge bg-light text-dark'}">${p.trangThai}</span></td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="progress flex-grow-1" style="min-width:80px">
            <div class="progress-bar" style="width:${p.tiDo || 0}%"></div>
          </div>
          <small class="text-muted">${p.tiDo || 0}%</small>
        </div>
      </td>
      <td class="text-muted">${p.ngayKetThuc || '—'}</td>
    </tr>
  `).join('');
}

function renderChartProjects(projects) {
  const ctx = document.getElementById('chartProjects');
  if (!ctx) return;

  const top8   = projects.slice(0, 8);
  const labels = top8.map(p => p.tenDA?.substring(0, 20) + '...' || p.maDA);
  const values = top8.map(p => Number(p.tiDo) || 0);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tiến độ (%)',
        data: values,
        backgroundColor: 'rgba(26, 86, 219, 0.75)',
        borderRadius: 6
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 100 } },
      plugins: { legend: { display: false } }
    }
  });
}

function renderChartTasks(tasks) {
  const ctx = document.getElementById('chartTasks');
  if (!ctx) return;

  const counts = {
    'Chưa bắt đầu':   tasks.filter(t => t.trangThai === 'Chưa bắt đầu').length,
    'Đang thực hiện':  tasks.filter(t => t.trangThai === 'Đang thực hiện').length,
    'Hoàn thành':      tasks.filter(t => t.trangThai === 'Hoàn thành').length,
    'Trễ hạn':         tasks.filter(t => t.trangThai === 'Trễ hạn').length
  };

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: ['#94a3b8', '#3b82f6', '#22c55e', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: { plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }
  });
}
