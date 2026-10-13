const FANKIT_JOBS = ["job-paladin.png", "job-darkknight.png", "job-blackmage.png", ...Array.from({ length: 9 }, (_, i) => "job-" + String(i + 4).padStart(2, "0") + ".png")];
const paradeTrack = document.getElementById("parade-track");
if (paradeTrack) {
  const group = '<div class="parade-group">' + FANKIT_JOBS.map(file => '<img src="assets/fankit/' + file + '" alt="" loading="lazy" decoding="async">').join("") + '</div>';
  paradeTrack.innerHTML = group + group;
}

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionToggle = document.getElementById("motion-toggle");
let motionEnabled = !motionPreference.matches;
try { if (localStorage.getItem("eorzea-weather:motion") === "still") motionEnabled = false; } catch (_) {}
function applyMotionPreference() {
  const enabled = motionEnabled && !motionPreference.matches;
  document.documentElement.dataset.motion = enabled ? "full" : "still";
  motionToggle.setAttribute("aria-pressed", String(enabled));
  motionToggle.textContent = motionPreference.matches ? "演出は停止中" : enabled ? "演出を止める" : "演出を動かす";
  motionToggle.disabled = motionPreference.matches;
  motionToggle.title = motionPreference.matches ? "端末の「視差効果を減らす」設定に合わせて停止しています。" : "装飾アニメーションの切り替え";
}
motionToggle.addEventListener("click", () => {
  motionEnabled = !motionEnabled;
  try { localStorage.setItem("eorzea-weather:motion", motionEnabled ? "full" : "still"); } catch (_) {}
  applyMotionPreference();
});
motionPreference.addEventListener("change", applyMotionPreference);
applyMotionPreference();

const motionZones = document.querySelectorAll(".motion-zone");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle("is-in-view", entry.isIntersecting);
    if (entry.isIntersecting) entry.target.classList.add("has-entered");
  }), { threshold: 0, rootMargin: "80px 0px" });
  motionZones.forEach(zone => observer.observe(zone));
} else motionZones.forEach(zone => zone.classList.add("is-in-view", "has-entered"));
function updateMotionVisibility() { document.documentElement.dataset.pageHidden = String(document.hidden); }
document.addEventListener("visibilitychange", updateMotionVisibility);
updateMotionVisibility();
