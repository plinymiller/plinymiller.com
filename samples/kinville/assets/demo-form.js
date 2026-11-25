(function () {
  var params = new URLSearchParams(window.location.search);
  var interest = params.get("interest");
  var field = document.getElementById("interest");
  if (interest && field && !field.value) {
    field.value = interest;
  }

  document.querySelectorAll("form[data-demo]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var note = form.querySelector("[data-demo-note]");
      if (note) {
        note.hidden = false;
        note.focus();
      }
    });
  });
})();
