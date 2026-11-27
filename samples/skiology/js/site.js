(function () {
  var SETUPS = {
    "adult-daily": "Adult daily rental — Rossignol skis, Nordica boots",
    "youth-daily": "Youth daily rental — Rossignol skis, Nordica boots",
    "demo": "Demo skis — Kästle, Fischer, or Elan",
    "lease": "Adult season lease — $299, skis, boots, and poles"
  };

  var SEED = {
    "SKI-1842": {
      code: "SKI-1842",
      name: "Hannah Cho",
      phone: "802-555-0142",
      date: "2026-01-17",
      time: "7:30a",
      status: "ready",
      sample: true,
      note: "Sample reservation. First day for Mina.",
      riders: [
        { name: "Hannah Cho", setup: "adult-daily" },
        { name: "David Cho", setup: "adult-daily" },
        { name: "Mina Cho", setup: "youth-daily" }
      ]
    },
    "SKI-2207": {
      code: "SKI-2207",
      name: "Evan Brooks",
      phone: "802-555-0194",
      date: "2026-01-17",
      time: "8:00a",
      status: "pull",
      sample: true,
      note: "Sample reservation. Asked for a demo if a Fischer is on the wall.",
      riders: [
        { name: "Evan Brooks", setup: "demo" },
        { name: "Jules Brooks", setup: "youth-daily" }
      ]
    },
    "SKI-3091": {
      code: "SKI-3091",
      name: "Priya Shah",
      phone: "802-555-0160",
      date: "2026-01-17",
      time: "8:30a",
      status: "pulled",
      sample: true,
      note: "Sample reservation. Season lease pickup.",
      riders: [{ name: "Priya Shah", setup: "lease" }]
    },
    "SKI-4410": {
      code: "SKI-4410",
      name: "Chris Hale",
      phone: "802-555-0177",
      date: "2026-01-17",
      time: "9:00a",
      status: "out",
      sample: true,
      note: "Sample reservation. Already out on the hill.",
      riders: [
        { name: "Chris Hale", setup: "adult-daily" },
        { name: "Jordan Hale", setup: "youth-daily" },
        { name: "Leo Hale", setup: "youth-daily" }
      ]
    }
  };

  var STATUS = {
    pull: "Needs pull",
    pulled: "Pulled",
    ready: "Ready",
    in: "Checked in",
    out: "Out"
  };

  function read(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch (e) {
      return {};
    }
  }

  function bookings() {
    return read("skiology-bookings");
  }

  function statuses() {
    return read("skiology-desk-status");
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function setupLabel(id) {
    return SETUPS[id] || id;
  }

  function lookup(code) {
    var saved = bookings();
    if (saved[code]) return saved[code];
    if (SEED[code]) return SEED[code];
    return null;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    var dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function firstName(name) {
    return (name || "there").trim().split(/\s+/)[0];
  }

  function partyLine(pass) {
    var riders = pass.riders || [];
    if (!riders.length) return "Gear to be set at the shop.";
    return riders.map(function (r) {
      return r.name + " — " + setupLabel(r.setup);
    }).join("\n");
  }

  function sms(pass) {
    return "Skiology: You're booked, " + firstName(pass.name) + ". " +
      formatDate(pass.date) + " at " + pass.time + ". Code " + pass.code + ". " +
      "We'll pull the gear at 937 Killington Road. Show this pass at the door.";
  }

  function renderPass() {
    var root = document.getElementById("pass-root");
    if (!root) return;
    var params = new URLSearchParams(window.location.search);
    var code = (params.get("code") || "SKI-1842").trim().toUpperCase();
    var pass = lookup(code);
    var missing = document.getElementById("pass-missing");
    var ticket = document.getElementById("pass-ticket");
    if (!pass) {
      missing.hidden = false;
      ticket.hidden = true;
      document.getElementById("missing-code").textContent = code;
      return;
    }
    missing.hidden = true;
    ticket.hidden = false;
    document.getElementById("pass-code").textContent = pass.code;
    document.getElementById("stub-code").textContent = pass.code;
    document.getElementById("pass-who").textContent = pass.name;
    document.getElementById("pass-when").textContent = formatDate(pass.date) + " · " + pass.time;
    document.getElementById("pass-count").textContent = String((pass.riders || []).length);
    var gear = document.getElementById("pass-gear");
    gear.innerHTML = "";
    (pass.riders || []).forEach(function (r) {
      var li = document.createElement("li");
      li.textContent = r.name + " — " + setupLabel(r.setup);
      gear.appendChild(li);
    });
    document.getElementById("pass-sms").textContent = sms(pass);
    var stamp = document.getElementById("pass-stamp");
    stamp.textContent = pass.sample ? "Sample" : "Reserved";
    var qr = qrcode(0, "M");
    qr.addData("https://plinymiller.com/samples/skiology/r/?code=" + encodeURIComponent(pass.code));
    qr.make();
    document.getElementById("pass-qr").innerHTML = qr.createSvgTag(4, 0);
  }

  function allPasses() {
    var map = {};
    Object.keys(SEED).forEach(function (k) { map[k] = SEED[k]; });
    var saved = bookings();
    Object.keys(saved).forEach(function (k) { map[k] = saved[k]; });
    var state = statuses();
    return Object.keys(map).map(function (k) {
      var pass = Object.assign({}, map[k]);
      if (state[k]) pass.status = state[k];
      return pass;
    }).sort(function (a, b) {
      return (a.time || "").localeCompare(b.time || "");
    });
  }

  function renderDesk() {
    var list = document.getElementById("desk-list");
    if (!list) return;
    var rows = allPasses();
    var counts = { pull: 0, pulled: 0, ready: 0, in: 0, out: 0 };
    rows.forEach(function (p) { counts[p.status] = (counts[p.status] || 0) + 1; });
    ["pull", "ready", "out", "in"].forEach(function (key) {
      var el = document.getElementById("count-" + key);
      if (el) el.textContent = String(counts[key] || 0);
    });
    list.innerHTML = "";
    rows.forEach(function (pass) {
      var row = document.createElement("article");
      row.className = "pickup";
      var when = document.createElement("p");
      when.className = "when";
      when.textContent = pass.time;
      var body = document.createElement("div");
      var who = document.createElement("p");
      who.className = "who";
      who.textContent = pass.code + " · " + pass.name;
      var meta = document.createElement("p");
      meta.className = "meta";
      var tally = {};
      (pass.riders || []).forEach(function (r) {
        var label = setupLabel(r.setup).split("—")[0].trim();
        tally[label] = (tally[label] || 0) + 1;
      });
      var summary = Object.keys(tally).map(function (label) {
        return tally[label] + " " + label.toLowerCase();
      }).join(", ");
      meta.textContent = formatDate(pass.date) + " · " + (pass.riders || []).length + " on the pass · " + summary;
      body.appendChild(who);
      body.appendChild(meta);
      var actions = document.createElement("div");
      actions.className = "statuses";
      Object.keys(STATUS).forEach(function (key) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = key === "in" ? "Check in" : STATUS[key];
        btn.setAttribute("aria-pressed", pass.status === key ? "true" : "false");
        btn.addEventListener("click", function () {
          var next = statuses();
          next[pass.code] = key;
          save("skiology-desk-status", next);
          renderDesk();
        });
        actions.appendChild(btn);
      });
      row.appendChild(when);
      row.appendChild(body);
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  function newCode() {
    var taken = bookings();
    var code;
    do {
      code = "SKI-" + String(1000 + Math.floor(Math.random() * 9000));
    } while (taken[code] || SEED[code]);
    return code;
  }

  function bindBook() {
    var form = document.getElementById("reserve-form");
    if (!form) return;
    var riders = document.getElementById("riders");
    document.getElementById("add-rider").addEventListener("click", function () {
      var first = riders.querySelector(".rider");
      var copy = first.cloneNode(true);
      copy.querySelectorAll("input").forEach(function (input) { input.value = ""; });
      riders.appendChild(copy);
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var data = new FormData(form);
      var names = Array.prototype.slice.call(form.querySelectorAll("[name=rider-name]"));
      var setups = Array.prototype.slice.call(form.querySelectorAll("[name=rider-setup]"));
      var party = [];
      names.forEach(function (input, i) {
        var name = input.value.trim();
        if (!name) return;
        party.push({ name: name, setup: setups[i].value });
      });
      var code = newCode();
      var pass = {
        code: code,
        name: String(data.get("name") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        email: String(data.get("email") || "").trim(),
        date: String(data.get("date") || ""),
        time: String(data.get("time") || ""),
        note: String(data.get("note") || "").trim(),
        riders: party,
        status: "pull",
        sample: false
      };
      var saved = bookings();
      saved[code] = pass;
      save("skiology-bookings", saved);
      window.location.href = "/samples/skiology/r/?code=" + encodeURIComponent(code);
    });
  }

  document.getElementById("year") && (document.getElementById("year").textContent = "");
  bindBook();
  renderPass();
  renderDesk();
})();
