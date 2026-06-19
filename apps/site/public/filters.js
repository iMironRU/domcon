// Ванильный остров фильтров над objects.json. Прогрессивно:
// без JS витрина показывает все карточки (отрендерены на билде).
(async () => {
  const grid = document.querySelector("[data-grid]");
  const chips = document.querySelectorAll("[data-type]");
  const sortSel = document.querySelector("[data-sort]");
  if (!grid) return;

  let data = [];
  try { data = await (await fetch("/objects.json")).json(); } catch { return; }

  const byId = new Map([...grid.children].map((el) => [el.dataset.id, el]));
  let type = "все";

  const sorters = {
    new: (a, b) => (b.created || "").localeCompare(a.created || ""),
    priceUp: (a, b) => a.price - b.price,
    priceDown: (a, b) => b.price - a.price,
    area: (a, b) => (b.area || 0) - (a.area || 0),
  };

  function apply() {
    const sort = (sortSel && sortSel.value) || "new";
    const active = data.filter((o) => o.status !== "sold" && (type === "все" || o.type === type));
    const sold = data.filter((o) => o.status === "sold" && (type === "все" || o.type === type));
    active.sort(sorters[sort]);
    const order = [...active, ...sold];
    order.forEach((o) => { const el = byId.get(o.id); if (el) grid.appendChild(el); });
    byId.forEach((el, id) => { el.style.display = order.some((o) => o.id === id) ? "" : "none"; });
    const cnt = document.querySelector("[data-count]");
    if (cnt) cnt.textContent = order.length + " объектов";
  }

  chips.forEach((c) => c.addEventListener("click", () => {
    type = c.dataset.type;
    chips.forEach((x) => x.removeAttribute("data-on"));
    c.setAttribute("data-on", "1");
    apply();
  }));
  if (sortSel) sortSel.addEventListener("change", apply);
  apply();
})();
