const form = document.getElementById('requestForm');
const errorBox = document.getElementById('errorBox');

form.addEventListener('submit', function (e) {
  const programName = form.programName.value.trim();
  const requestedBy = form.requestedBy.value.trim();

  if (!programName || !requestedBy) {
    e.preventDefault();
    errorBox.textContent = 'Please fill out all fields.';
    errorBox.classList.remove('hidden');
  } else {
    errorBox.classList.add('hidden');
  }
});
