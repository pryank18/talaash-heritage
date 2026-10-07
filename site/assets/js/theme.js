// Chooses light or dark, and English or Hindi, before the page draws, so there is no flash.
// 1. A choice the visitor made with the header switch is kept.
// 2. Otherwise a device set to dark gets dark.
// 3. Otherwise dark from 7 pm to 6 am on the visitor's own clock.
// The theme is fixed when the page opens and never changes while someone reads.
(function () {
  var saved = null;
  try { saved = localStorage.getItem("th_theme"); } catch (e) { /* storage blocked */ }
  var hour = new Date().getHours();
  var deviceDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = saved === "dark" || saved === "light" ? saved : deviceDark || hour >= 19 || hour < 6 ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);

  // Language: the visitor's choice from the header, else Hindi if the browser asks for it first.
  var lang = null;
  try { lang = localStorage.getItem("th_lang"); } catch (e) { /* storage blocked */ }
  if (lang !== "hi" && lang !== "en") {
    var first = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    lang = /^hi\b/i.test(first) ? "hi" : "en";
  }
  document.documentElement.setAttribute("data-lang", lang);
  if (lang === "hi") document.documentElement.setAttribute("lang", "hi");
})();
