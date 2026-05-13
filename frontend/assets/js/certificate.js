/* =========================================================
   AMDOX — Certificate Page JS
   ========================================================= */

const certData = JSON.parse(sessionStorage.getItem('cert_data') || 'null');

if (!certData) {
  document.getElementById('certificateDoc')?.classList.add('hidden');
  document.getElementById('certNotFound')?.classList.remove('hidden');
} else {
  populate(certData);
  if (new URLSearchParams(window.location.search).get('download') === 'true') {
    window.addEventListener('load', () => setTimeout(downloadPDF, 1000));
  }
}

function populate(c) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '—'; };
  set('certIdDisplay',  c.certificate_id);
  set('certIdFooter',   c.certificate_id);
  set('certStudentName', c.student_name);
  set('certDomain',     c.domain);
  set('certStartDate',  c.start_date);
  set('certEndDate',    c.end_date);
  set('certGrade',      c.grade || 'Excellent');
  set('certIssueDate',  c.issued_on || new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'}));
  set('certYear',       new Date().getFullYear());

  if (c.duration) {
    set('certDuration', c.duration);
  } else {
    const dw = document.getElementById('durationWrap');
    const dd = document.getElementById('durationDotWrap');
    if (dw) dw.style.display = 'none';
    if (dd) dd.style.display = 'none';
  }
  document.title = `Certificate — ${c.student_name} | AMDOX`;
}

function printCert() { window.print(); }

async function downloadPDF() {
  const btn    = document.getElementById('downloadBtn');
  const btnTxt = document.getElementById('downloadBtnText');
  const sp     = document.getElementById('downloadSpinner');

  if (btnTxt) btnTxt.textContent = 'Generating PDF...';
  sp?.classList.remove('hidden');
  if (btn) btn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const certEl  = document.getElementById('certificateDoc');
    const actionBar = document.getElementById('actionBar');

    if (actionBar) actionBar.style.display = 'none';

    const canvas = await html2canvas(certEl, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#fdfaf2',
      logging: false,
    });

    if (actionBar) actionBar.style.display = '';

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / canvas.height;
    let iw = pw - 16, ih = iw / ratio;
    if (ih > ph - 16) { ih = ph - 16; iw = ih * ratio; }
    const x = (pw - iw) / 2, y = (ph - ih) / 2;
    pdf.addImage(imgData, 'PNG', x, y, iw, ih);
    pdf.save(`AMDOX_Certificate_${certData?.certificate_id || 'cert'}.pdf`);
    toast.success('Certificate downloaded successfully!');
  } catch (err) {
    console.error('PDF error:', err);
    toast.error('PDF generation failed. Try the Print button instead.');
  } finally {
    if (btnTxt) btnTxt.textContent = '⬇ Download PDF';
    sp?.classList.add('hidden');
    if (btn) btn.disabled = false;
  }
}