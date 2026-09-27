// UI helpers — shared components & utilities
export function showToast(message, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.hidden = false;
  setTimeout(() => t.hidden = true, duration);
}

export function openModal(title, contentHTML) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = contentHTML;
  document.getElementById('modal').showModal();
}

export function closeModal() {
  document.getElementById('modal').close();
}

document.getElementById('close-modal').addEventListener('click', closeModal);

export function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'});
}

export function requiredFields(form, fields) {
  const missing = fields.filter(f => !form[f]?.value?.trim());
  if (missing.length) {
    showToast(`Please fill in: ${missing.join(', ')}`);
    return false;
  }
 
