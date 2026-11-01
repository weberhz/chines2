(() => {
  const { vocabulary, grammar, topics } = window.HSK_DATA;
  const $ = (selector) => document.querySelector(selector);
  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);
  const audioButton = (file, label = "Ouvir áudio") => file ? `<button class="audio-button" type="button" data-audio="assets/audio/${encodeURIComponent(file)}" aria-label="${label}">▶ <span>${label}</span></button>` : "";
  const play = (path) => { const audio = new Audio(path); audio.play().catch(() => {}); };
  document.addEventListener("click", (event) => { const button = event.target.closest("[data-audio]"); if (button) play(button.dataset.audio); });

  const normalize = (value) => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const saved = JSON.parse(localStorage.getItem("hanzi-hsk-progress") || "{}");
  let deck = [...vocabulary]; let cardIndex = 0; let flipped = false; let smallDeck = false;
  const card = $("#flashcard");
  const renderCard = () => {
    const item = deck[cardIndex]; if (!item) return;
    const reverse = $("#card-mode").value === "meaning";
    $("#card-hanzi").textContent = reverse ? item.meaning : item.hanzi;
    $("#card-hanzi").lang = reverse ? "pt-BR" : "zh-Hans";
    $("#card-meaning").textContent = reverse ? item.hanzi : item.meaning;
    $("#card-pinyin").textContent = $("#hide-pinyin").checked ? "" : item.pinyin;
    $("#card-back-label").textContent = reverse ? "CHINÊS" : "SIGNIFICADO";
    $("#card-count").textContent = `${cardIndex + 1} / ${deck.length} · palavra #${item.id}`;
    $("#deck-label").textContent = smallDeck ? "Baralho: 20 palavras para revisão" : "Baralho: todas as 300 palavras do nível 1";
    $("#card-context").innerHTML = `<div class="card-audio-row">${audioButton(item.audio, "Ouvir palavra")}</div><p class="card-example-title">Frases de exemplo</p>${item.examples.map((x) => `<div class="card-example"><strong lang="zh-Hans">${escape(x.hanzi)}</strong>${audioButton(x.audio, "Ouvir frase")}<span>${escape(x.pinyin)}</span><small>${escape(x.translation)}</small></div>`).join("")}`;
    card.classList.toggle("is-flipped", flipped);
    const studied = Object.keys(saved).length;
    $("#progress-copy").textContent = `${studied} de 300 palavras marcadas nesta sessão de estudo.`;
  };
  const move = (step) => { cardIndex = (cardIndex + step + deck.length) % deck.length; flipped = false; renderCard(); };
  card.addEventListener("click", () => { flipped = !flipped; renderCard(); });
  $("#prev-card").onclick = () => move(-1); $("#next-card").onclick = () => move(1);
  ["#card-mode", "#hide-pinyin", "#hide-meaning"].forEach((id) => $(id).addEventListener("change", renderCard));
  $("#study-twenty").onclick = () => { deck = [...vocabulary].sort(() => Math.random() - .5).slice(0, 20); cardIndex = 0; smallDeck = true; flipped = false; renderCard(); };
  $("#all-deck").onclick = () => { deck = [...vocabulary]; cardIndex = 0; smallDeck = false; flipped = false; renderCard(); };
  $("#shuffle-deck").onclick = () => { deck.sort(() => Math.random() - .5); cardIndex = 0; flipped = false; renderCard(); };
  $("#clear-progress").onclick = () => { Object.keys(saved).forEach((key) => delete saved[key]); localStorage.removeItem("hanzi-hsk-progress"); renderCard(); };
  document.querySelectorAll("[data-rating]").forEach((button) => button.onclick = () => { saved[deck[cardIndex].id] = button.dataset.rating; localStorage.setItem("hanzi-hsk-progress", JSON.stringify(saved)); move(1); });
  $("#download-csv").onclick = () => { const body = vocabulary.map((x) => [x.id,x.hanzi,x.pinyin,x.meaning,x.pos].map((v) => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["Nº,Chinês,Pinyin,Português,Classe\n" + body], {type:"text/csv;charset=utf-8"})); a.download = "vocabulario-hsk-1.csv"; a.click(); URL.revokeObjectURL(a.href); };
  document.addEventListener("keydown", (event) => { if (event.target.matches("input,select")) return; if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1); });

  const renderVocab = () => {
    const query = normalize($("#vocab-search").value); const pos = $("#pos-filter").value;
    let rows = vocabulary.filter((x) => (!query || normalize(`${x.hanzi} ${x.pinyin} ${x.meaning}`).includes(query)) && (pos === "all" || normalize(x.pos).includes(pos)));
    if ($("#order-filter").value === "random") rows = [...rows].sort(() => Math.random() - .5);
    if ($("#order-filter").value === "unlearned") rows = rows.filter((x) => !saved[x.id]);
    $("#vocab-body").innerHTML = rows.map((x) => `<tr><td>${x.id}</td><td class="hanzi-cell" lang="zh-Hans">${escape(x.hanzi)} ${audioButton(x.audio, "Ouvir")}</td><td class="pinyin">${escape(x.pinyin)}</td><td>${escape(x.meaning)}</td><td>${escape(x.pos)}</td><td><details><summary>${x.examples.length} frases</summary>${x.examples.map((e) => `<p class="table-example"><b lang="zh-Hans">${escape(e.hanzi)}</b>${audioButton(e.audio, "Ouvir")}<br><span>${escape(e.pinyin)}</span><br>${escape(e.translation)}</p>`).join("")}</details></td></tr>`).join("");
    $("#table-count").textContent = `${rows.length} de 300 palavras exibidas`;
  };
  ["#vocab-search", "#pos-filter", "#order-filter"].forEach((id) => $(id).addEventListener(id === "#vocab-search" ? "input" : "change", renderVocab));

  $("#grammar-grid").innerHTML = grammar.map((g) => `<article class="grammar-card"><p class="grammar-category">${escape(g.category)}</p><h3>${g.id}. ${escape(g.title)}</h3><p class="pattern">${escape(g.structure)}</p><p>${escape(g.explanation)}</p><p class="grammar-tip"><b>Dica:</b> ${escape(g.tip)}</p><details><summary>${g.examples.length} frases desta estrutura</summary>${g.examples.map((e) => `<div class="grammar-example"><b lang="zh-Hans">${escape(e.hanzi)}</b>${audioButton(e.audio, "Ouvir frase")}<span>${escape(e.pinyin)}</span><small>${escape(e.translation)}</small>${e.note ? `<em>${escape(e.note)}</em>` : ""}</div>`).join("")}</details></article>`).join("");

  let activeTopic = "Todos"; let shown = 15;
  const topicEntries = () => activeTopic === "Todos" ? Object.values(topics).flat() : topics[activeTopic];
  const renderTopics = () => {
    const entries = topicEntries();
    $("#topic-tabs").innerHTML = ["Todos", ...Object.keys(topics)].map((topic) => `<button class="${topic === activeTopic ? "is-active" : ""}" type="button" data-topic="${escape(topic)}">${escape(topic)}${topic === "Todos" ? ` (${entries.length})` : ` (${topics[topic].length})`}</button>`).join("");
    $("#sentences-grid").innerHTML = entries.slice(0, shown).map((e) => `<article class="sentence-card"><p class="sentence-word">${escape(e.word)}</p><b lang="zh-Hans">${escape(e.hanzi)}</b>${audioButton(e.audio, "Ouvir frase")}<span>${escape(e.pinyin)}</span><small>${escape(e.translation)}</small></article>`).join("") + (shown < entries.length ? `<button class="show-more" id="show-more" type="button">Mostrar mais frases (${entries.length - shown} restantes)</button>` : "");
    document.querySelectorAll("[data-topic]").forEach((button) => button.onclick = () => { activeTopic = button.dataset.topic; shown = 15; renderTopics(); });
    $("#show-more")?.addEventListener("click", () => { shown += 30; renderTopics(); });
  };
  $("#category-grid").innerHTML = Object.entries(topics).map(([topic, entries]) => `<article class="category-card"><h3>${escape(topic)}</h3><p>${entries.length} frases de exemplo</p><button type="button" data-category-topic="${escape(topic)}">Ver frases →</button></article>`).join("");
  document.querySelectorAll("[data-category-topic]").forEach((button) => button.onclick = () => { activeTopic = button.dataset.categoryTopic; shown = 15; renderTopics(); $("#frases").scrollIntoView({behavior:"smooth"}); });
  renderCard(); renderVocab(); renderTopics();
  $("#menu-button")?.addEventListener("click", () => { const nav = $("#primary-nav"); const open = nav.classList.toggle("is-open"); $("#menu-button").setAttribute("aria-expanded", open); });
})();
