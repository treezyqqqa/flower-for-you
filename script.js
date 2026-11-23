(() => {
  "use strict";

  const canvas = document.querySelector(".bouquet canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const WIDTH = 440;
  const HEIGHT = 454;
  const INTRO = 4.2;
  const DX = 4.75;
  const DY = 6.2;
  const FONT = 'Consolas, "Liberation Mono", "Courier New", monospace';
  const ROOT = [47 * DX, 55 * DY];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const fade = (n) => {
    const t = clamp(n);
    return t * t * (3 - 2 * t);
  };

  // The spaces and repeated glyphs in these rows describe the petal folds.
  const patterns = {
    cream: [
      "      ..::.",
      "   .::===-:.-::.",
      "  :/==+*++=/=++-:.",
      " .-++*=-:::-=+*+=:.",
      " :+*+=-:/@*+-:=*+=:",
      " .-+=::\\++**/:-=+=:.",
      "  :-*++=-:::-=+++-.",
      "   .-=***+++=++-.",
      "     .:==++==:.",
      "        .::."
    ],
    lavender: [
      "        .:*.",
      "      .:+**:.",
      "       :+=*:.",
      "    .:+*-\\| .",
      "  .:+**==++*=:.",
      "   .-+*=|=**++:.",
      "     .:/+***-:",
      " .:-++*==+:..",
      " :++**-\\|#=+*:.",
      "  .:-=:|=***+=:.",
      "       .:=+=:.",
      "        .:|."
    ],
    rose: [
      "          .:::..",
      "     .::--===++=::..",
      "   .:==++****++==---:.",
      "  .-=+**+=----=+++**=:.",
      " .-++*=--:/++\\:-=+***=-.",
      " :+*+=-:/+*@*+=:-=+%*+=:.",
      " .+*=:%+==-+*/::=+%=+*+:.",
      " .-+=:=+**++=-:-=+#-+*+:.",
      "  :=*+-:--=====+**--+*=:",
      "   :++**+++***+==--=+=:",
      "    .:=++====-:::-++=.",
      "      .:-=####==++=:.",
      "        ..:===+=:.",
      "            ..:"
    ],
    gold: [
      "         :-:",
      "     :: .-*=  .:.",
      "    :*+=.=*=./++:.",
      "  .:==+=\\:-:/=+-.",
      " .:=+==-:%@*-===-:.",
      "    .-+*%@*%*++=:",
      " .-=++=:\\%%/:==++:.",
      "  .::  :++*+=-:.",
      "      .=*-\\+*:.",
      "      .::  .::"
    ],
    coral: [
      "      .::.",
      " .:: :=**=:",
      " :++=-:--:.:-:.",
      "  :++:#*+--=+*=.",
      " .-+*-%@%+=++-.",
      " :+*==::+*+=:.",
      "   :=*++\\++=:",
      "  .:+*=. .-=.",
      "     .:."
    ],
    ruby: [
      "         ..:..",
      "   ..:--=++++=-..",
      " .:-=++*++===++=--::.",
      " :=***+=::-====+***=:.",
      " :+*%=-.:++**-:-=+%+=.",
      " .+*=#:-+*@%*=-:-=+*+:.",
      "  -*+==:-=+*+=--+%#++=.",
      "  .=**+==-::-=+**=-+*=:",
      "   .-==+******+=-:=++:",
      "     .-==+===--==++=:",
      "      .:=#%%#====-:.",
      "         ..:::.."
    ],
    blush: [
      "       .::..",
      "  .:--=+*++-:...",
      " .-+++*+=-====--:.",
      " :-+*=--:-=++**+=:.",
      " .-+=-:+@+%=-:=**+=.",
      " .-+*-:\\**/::-=+*+-.",
      "  .-+**==--=+++*+=.",
      "    :-=++++*+==-.",
      "      ..:-==-:.",
      "          .."
    ],
    ribbon: [
      "   .::..           ..::.",
      "  /++***=-:.   .:=***++\\",
      " :*-. .:-+**: :**+-:. -*:",
      " |+       .=*@*=.      +|",
      " \\*==--=+**=%@%=**+=--=* /",
      "  .:-====-:/++\\:-====-:.",
      "        .:+*-:*+:.",
      "       .:+*-: :+*=.",
      "      .:=*+.   :=*-.",
      "     .-=*+:     :=*:.",
      "   .-=*+-.      .-+=.",
      "   .:==:.         .::."
    ]
  };

  const shade = {
    ".": 0, ":": 1, "-": 1, "|": 1,
    "/": 2, "\\": 2, "=": 2, "#": 2, "%": 3, "+": 3, "*": 4, "@": 5
  };

  const flowers = [
    [192, 59, "cream", ["#63433c", "#a27459", "#d4ac83", "#edca9e", "#ffe4bc", "#fff1d1"]],
    [273, 66, "lavender", ["#593d64", "#8a548e", "#ad74b5", "#cb93ca", "#e6b8e4", "#f7d7ef"]],
    [133, 109, "rose", ["#703047", "#af4e68", "#d5718d", "#e98fa7", "#ffc2cf", "#ffe1e5"]],
    [330, 126, "gold", ["#67401d", "#996130", "#cc8d47", "#eeb668", "#ffd78d", "#fff0bc"]],
    [82, 172, "coral", ["#663b32", "#a35845", "#cc765f", "#e89477", "#ffc0a4", "#ffdfbf"]],
    [218, 152, "ruby", ["#75243a", "#b63d58", "#d95168", "#ec667d", "#ff96a7", "#ffbdc6"]],
    [288, 199, "blush", ["#744658", "#a9657a", "#cd8197", "#e7a2b2", "#ffd0d6", "#ffe5dc"]]
  ].map(([x, y, type, palette]) => ({
    x: Math.round(x / DX) * DX,
    y: Math.round(y / DY) * DY,
    cells: textCells(patterns[type]),
    palette
  }));

  function textCells(rows, pivotRow = Math.floor(rows.length / 2)) {
    const middle = Math.floor(Math.max(...rows.map(row => row.length)) / 2);
    return rows.flatMap((line, row) => Array.from(line).flatMap((glyph, col) =>
      glyph === " " ? [] : [{ col: col - middle, row: row - pivotRow, glyph }]
    ));
  }

  const leafPalette = ["#345340", "#4e7155", "#65895f", "#86a66e", "#a2c086", "#c5d9a2"];
  const leaves = [
    [0, .56, -2.55, 67, 15], [0, .77, -0.42, 33, 8],
    [1, .46, -0.44, 54, 12], [1, .76, -0.12, 48, 10],
    [2, .46, -2.68, 76, 17], [2, .65, -3.04, 48, 10],
    [3, .44, 0.05, 68, 14], [3, .74, -0.49, 55, 11],
    [4, .47, -2.96, 66, 13], [4, .72, -1.83, 40, 9],
    [5, .20, -2.45, 54, 10], [5, .36, -1.96, 54, 10], [5, .56, -2.45, 47, 11],
    [6, .20, 0.15, 60, 11], [6, .43, -0.35, 61, 14]
  ].map(([stem, at, angle, length, width], index) => ({
    stem, at,
    y: Math.round((ROOT[1] + (flowers[stem].y - ROOT[1]) * at) / DY) * DY,
    cells: leafCells(angle, length, width, index)
  }));

  function leafCells(angle, length, width, index) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const cells = [];
    const extent = length + width;
    for (let row = -Math.ceil(extent / DY); row <= Math.ceil(extent / DY); row++) {
      for (let col = -Math.ceil(extent / DX); col <= Math.ceil(extent / DX); col++) {
        const x = col * DX;
        const y = row * DY;
        const u = (x * cos + y * sin) / length;
        if (u <= 0 || u >= 1) continue;
        const v = -x * sin + y * cos - Math.sin(u * Math.PI / 2) * (index % 2 ? 8 : -6);
        const edge = width * Math.sin(Math.PI * u ** 0.82) ** 0.95;
        if (Math.abs(v) > edge) continue;
        const stitch = Math.abs(col * 19 + row * 31 + index * 7) % 11;
        const diagonal = sin * cos < 0 ? "/" : "\\";
        let glyph;
        if (Math.abs(v) < 1.8) glyph = stitch < 4 ? "+" : diagonal;
        else if (Math.abs(v) > edge * 0.77) glyph = stitch < 6 ? diagonal : ".";
        else if (stitch < 3) glyph = v > 0 ? "\\" : "/";
        else glyph = stitch < 7 ? "=" : "#";
        cells.push({ col, row, glyph });
      }
    }
    return cells;
  }

  const ribbon = {
    cells: textCells(patterns.ribbon, 4),
    palette: ["#774257", "#a7677e", "#d3859f", "#efabc0", "#ffd0dc", "#ffedf0"]
  };

  function textStyle(brush, fontSize) {
    brush.font = fontSize + "px " + FONT;
    brush.textAlign = "center";
    brush.textBaseline = "middle";
  }

  function stamp(cells, palette, fontSize, pixelScale, mask = false) {
    const minCol = Math.min(...cells.map(cell => cell.col));
    const maxCol = Math.max(...cells.map(cell => cell.col));
    const minRow = Math.min(...cells.map(cell => cell.row));
    const maxRow = Math.max(...cells.map(cell => cell.row));
    const left = (minCol - 1.5) * DX;
    const top = (minRow - 1.5) * DY;
    const width = (maxCol - minCol + 3) * DX;
    const height = (maxRow - minRow + 3) * DY;
    const layer = document.createElement("canvas");
    layer.width = Math.ceil(width * pixelScale);
    layer.height = Math.ceil(height * pixelScale);
    const brush = layer.getContext("2d");
    brush.setTransform(layer.width / width, 0, 0, layer.height / height,
      -left * layer.width / width, -top * layer.height / height);
    textStyle(brush, fontSize);

    if (mask) {
      brush.fillStyle = "#000000db";
      for (const { col, row, glyph } of cells) {
        if (glyph === ".") continue;
        brush.fillRect((col - 0.5) * DX, (row - 0.5) * DY, DX + 0.2, DY + 0.2);
      }
    }

    for (const { col, row, glyph } of cells) {
      const color = palette[shade[glyph]];
      brush.fillStyle = color;
      brush.shadowColor = color + "65";
      brush.shadowBlur = shade[glyph] >= 4 ? 1.35 * pixelScale : 0;
      brush.fillText(glyph, col * DX, row * DY);
    }
    return { layer, left, top, width, height, minRow, maxRow };
  }

  function drawArt(art, x, y, rows, tilt = 0) {
    if (rows <= 0) return;
    const { layer, left, top, width, height, minRow, maxRow } = art;
    ctx.save();
    ctx.translate(x, y);
    if (tilt) ctx.transform(1, 0, tilt, 1, 0, 0);
    if (rows >= maxRow - minRow + 1) {
      ctx.drawImage(layer, left, top, width, height);
    } else {
      const wholeRows = Math.floor(rows);
      const edge = (maxRow + 0.5 - wholeRows) * DY - top;
      const scale = layer.height / height;
      ctx.drawImage(layer, 0, edge * scale, layer.width, (height - edge) * scale,
        left, top + edge, width, height - edge);
      ctx.globalAlpha = rows - wholeRows;
      ctx.drawImage(layer, 0, (edge - DY) * scale, layer.width, DY * scale,
        left, top + edge - DY, width, DY);
    }
    ctx.restore();
  }

  function stemX(flower, u, index) {
    const spread = u * u * (2.65 - 1.65 * u);
    return ROOT[0] + (flower.x - ROOT[0]) * spread + (index - 2) * 5 * u * (1 - u);
  }

  function wind(u, t, index) {
    const breeze = Math.sin(t * 0.76 + index * 0.63) * (2.8 + index % 3);
    const flutter = Math.sin(t * 1.21 + index * 1.4) * 0.9;
    return (breeze + flutter) * u ** 2 * Math.min(t, 1);
  }

  const stems = flowers.map((flower, index) => {
    const cells = [];
    const lastRow = 64 + index % 3;
    let previousX;
    for (let row = lastRow; row >= Math.round(flower.y / DY); row--) {
      const y = row * DY;
      const u = (ROOT[1] - y) / (ROOT[1] - flower.y);
      const x = u >= 0
        ? stemX(flower, u, index)
        : ROOT[0] + (index - 3) * 6.2 * ((y - ROOT[1]) / ((lastRow - 55) * DY)) ** 1.35;
      const col = Math.round(x / DX);
      const step = previousX === undefined ? 0 : col - previousX;
      const glyph = step > 0 ? "/" : step < 0 ? "\\" : "|";
      cells.push({ x: col * DX, y, u: Math.max(0, u), glyph });
      previousX = col;
    }
    return cells;
  });

  function rowTime(y, index = 0) {
    return 0.24 + (410 - y) * 0.0064 + (index % 4) * 0.075;
  }

  function drawStem(cells, elapsed, t, index) {
    for (const { x, y, u, glyph } of cells) {
      if (elapsed < rowTime(y, index)) break;
      ctx.globalAlpha = fade((elapsed - rowTime(y, index)) * 14);
      ctx.fillStyle = y > ROOT[1] ? "#627a55" : index % 2 ? "#749361" : "#8da56f";
      ctx.fillText(glyph, x + wind(u, t, index), y);
    }
    ctx.globalAlpha = 1;
  }

  function fall(heads, elapsed) {
    const time = elapsed - 9.2;
    if (time < 0) return;
    const cycle = Math.floor(time / 8.6);
    for (let i = 0; i < 1 + cycle % 2; i++) {
      const t = (time % 8.6 - i * 0.48) / 5.5;
      if (t < 0 || t >= 1) continue;
      const index = (cycle * 3 + i + 2) % flowers.length;
      const { x, y } = heads[index];
      ctx.save();
      ctx.globalAlpha = 0.82 * fade(t * 15) * (1 - fade((t - 0.64) / 0.36));
      ctx.fillStyle = flowers[index].palette[4];
      ctx.fillText(i ? ":" : "*", x + (i ? -40 : 44) * t + Math.sin(t * 8) * 8, y + 14 + 195 * t ** 1.25);
      ctx.restore();
    }
  }

  function render(elapsed, still = false) {
    ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    if (elapsed < 0.24 || !ribbon.art) return;

    const t = still ? 0 : Math.max(0, elapsed - INTRO);
    const breath = Math.sin(t * 0.85);
    ctx.save();
    ctx.translate(ROOT[0], ROOT[1] - breath * 0.7);
    ctx.scale(1 + breath * 0.002, 1 + breath * 0.003);
    ctx.translate(-ROOT[0], -ROOT[1]);

    stems.forEach((cells, i) => drawStem(cells, elapsed, t, i));

    leaves.forEach(({ stem, at, y, art }, i) => {
      const x = Math.round(stemX(flowers[stem], at, stem) / DX) * DX;
      const open = (elapsed - rowTime(y, stem) - 0.12) * 14;
      const tremble = Math.sin(t * 0.89 + i * 1.2) * Math.min(1, t);
      drawArt(art, x + wind(at, t, stem), y + tremble * at * 1.35, open, tremble * 0.033);
    });

    const heads = flowers.map((flower, i) => ({
      x: flower.x + wind(1, t, i),
      y: flower.y + Math.sin(t * 0.92 + i * 1.08) * Math.min(1, t) * (0.45 + i % 3 * 0.18)
    }));
    flowers.forEach(({ art, y }, i) => {
      const open = (elapsed - rowTime(y + art.maxRow * DY, i) - 0.18) * 12;
      const tilt = Math.sin(t * 0.8 + i * 0.85) * Math.min(1, t) * 0.028;
      drawArt(art, heads[i].x, heads[i].y, open, tilt);
    });

    drawArt(ribbon.art, ...ROOT, (elapsed - 0.62) * 13);
    if (!still) fall(heads, elapsed);
    ctx.restore();
  }

  let frame = 0;
  let start = performance.now();
  let paused = document.hidden ? start : null;
  if (!motion.matches) document.documentElement.classList.add("has-bouquet");

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 3);
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (ribbon.art && canvas.width === pixelWidth && canvas.height === pixelHeight) return;
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const scale = width / WIDTH;
    const fontSize = Math.min(8.4, Math.max(7.65, 5.1 / scale));
    const pixelScale = pixelWidth / WIDTH;
    textStyle(ctx, fontSize);
    for (const flower of flowers) flower.art = stamp(flower.cells, flower.palette, fontSize, pixelScale, true);
    for (const leaf of leaves) leaf.art = stamp(leaf.cells, leafPalette, fontSize, pixelScale);
    ribbon.art = stamp(ribbon.cells, ribbon.palette, fontSize, pixelScale, true);
    if (motion.matches) render(INTRO, true);
  }

  function tick(now) {
    render((now - start) / 1000);
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    const now = performance.now();
    if (motion.matches) {
      document.documentElement.classList.remove("has-bouquet");
      start = now - INTRO * 1000;
      paused = document.hidden ? now : null;
      render(INTRO, true);
    } else if (document.hidden) {
      paused ??= now;
    } else {
      if (paused !== null) start += now - paused;
      paused = null;
      frame = requestAnimationFrame(tick);
    }
  }

  new ResizeObserver(resize).observe(canvas);
  motion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  resize();
  sync();
})();
