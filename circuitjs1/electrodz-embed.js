/**
 * SwissDZ — optimisations Falstad (circuitjs).
 * Pas de zoom CSS : il décale les coordonnées tactiles / souris sur le canvas.
 */
(function () {
  try {
    var isTouch =
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
      "ontouchstart" in window;

    function injectStyles() {
      var sid = "electrodz-falstad-touch";
      var el = document.getElementById(sid);
      if (!el) {
        el = document.createElement("style");
        el.id = sid;
        (document.head || document.documentElement).appendChild(el);
      }
      el.textContent = [
        "html, body { overscroll-behavior: none; margin: 0; -webkit-text-size-adjust: 100%; }",
        "canvas { touch-action: none !important; }",
        'body { -webkit-tap-highlight-color: transparent; background-color: #ffffff; background-image: url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2728%27 height=%2720%27 viewBox=%270 0 28 20%27%3E%3Cg opacity=%270.20%27%3E%3Crect width=%2714%27 height=%2720%27 fill=%27%23008000%27/%3E%3Crect x=%2714%27 width=%2714%27 height=%2720%27 fill=%27%23ffffff%27/%3E%3Ccircle cx=%2714%27 cy=%2710%27 r=%274%27 fill=%27none%27 stroke=%27%23d21034%27 stroke-width=%272%27/%3E%3C/g%3E%3C/svg%3E"); background-size: 46px 34px; background-repeat: repeat; }',
      ].join("\n");
    }

    function shrinkToolbarCanvases() {
      if (!isTouch) return;
      var canvases = document.getElementsByTagName("canvas");
      for (var i = 0; i < canvases.length; i++) {
        var c = canvases[i];
        var rw = c.width;
        var rh = c.height;
        if (rw > 0 && rh > 0 && rw <= 64 && rh <= 64) {
          c.style.maxWidth = Math.round(rw * 0.84) + "px";
          c.style.maxHeight = Math.round(rh * 0.72) + "px";
          c.style.margin = "1px";
        }
      }
    }

    function wrapBottomScrollbars() {
      if (!isTouch) return;
      var innerH = window.innerHeight || document.documentElement.clientHeight || 600;
      var divs = document.getElementsByTagName("div");
      for (var i = 0; i < divs.length; i++) {
        var d = divs[i];
        var r = d.getBoundingClientRect();
        if (r.top < innerH * 0.28) continue;
        var st = window.getComputedStyle(d);
        if (
          (st.overflowX === "scroll" || st.overflowX === "auto") &&
          d.scrollWidth > d.clientWidth + 40 &&
          r.height > 0 &&
          r.height < 160
        ) {
          d.style.display = "flex";
          d.style.flexWrap = "wrap";
          d.style.justifyContent = "center";
          d.style.alignContent = "center";
          d.style.alignItems = "center";
          d.style.whiteSpace = "normal";
          d.style.overflowX = "visible";
          d.style.overflowY = "visible";
          d.style.maxHeight = "none";
          d.style.width = "100%";
        }
      }
    }

    function tick() {
      injectStyles();
      shrinkToolbarCanvases();
      wrapBottomScrollbars();
      try {
        window.dispatchEvent(new Event("resize"));
      } catch (e) {}
    }

    tick();
    [400, 1000, 2200].forEach(function (ms) {
      setTimeout(tick, ms);
    });

    window.addEventListener("resize", function () {
      setTimeout(tick, 150);
    });
  } catch (e) {}
})();
