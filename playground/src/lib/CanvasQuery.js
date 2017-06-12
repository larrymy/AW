/*     

  Canvas Query r9
  
  http://canvasquery.com
  
  (c) 2012-2016 http://rezoner.net
  
  Canvas Query may be freely distributed under the MIT license.

  r9

  + even more precise fontHeight and fontTop
  + textBoundaries and wrappedText use same alg for maxWidth when newline is detected

  r8

  + improved matchPalette performance
  + defaultFont

  r7

  + more accurate fontHeight()
  + fillText respects no antialiasing when using pixel font
  + textBaseline("top") consistent among browsers
  + align state is added to the stack
  + new canvases are pulled from the pool  
  + filter (experimetnal)

  r6

  + ImageBitmap support
  + drawImageCentered
  + drawRegionCentered
  + default textBaseline
  + resizeBounds

  r5

  ! fixed: leaking arguments in fastApply bailing out optimization
  + cacheText
  + compare
  + checkerboard

*/


(function() {

  var COCOONJS = false;

  var Canvas = window.HTMLCanvasElement;
  var orgImage = window.Image;
  var Image = window.HTMLImageElement;
  var ImageBitmap = window.ImageBitmap || window.HTMLImageElement;
  var COCOONJS = navigator.isCocoonJS;

  var cq = function(selector) {

    if (arguments.length === 0) {

      var canvas = cq.pool();

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

    } else if (typeof selector === "string") {

      var canvas = document.querySelector(selector);

    } else if (typeof selector === "number") {

      var canvas = cq.pool();

      canvas.width = arguments[0];
      canvas.height = arguments[1];

    } else if (selector instanceof Image) {

      var canvas = cq.pool();

      canvas.width = selector.width;
      canvas.height = selector.height;
      canvas.getContext("2d").drawImage(selector, 0, 0);

    } else if (selector instanceof ImageBitmap) {

      var canvas = cq.pool();

      canvas.width = selector.width;
      canvas.height = selector.height;
      canvas.getContext("2d").drawImage(selector, 0, 0);

    } else if (selector instanceof cq.Layer) {

      return selector;

    } else {

      var canvas = selector;

    }

    return new cq.Layer(canvas);

  };

  cq.lineSpacing = 1.0;
  cq.defaultFont = "";
  cq.textBaseline = "alphabetic";
  cq.matchPalettePrecision = 10;
  cq.strokeStyle = false;
  cq.fillStyle = false;

  cq.palettes = {

    db16: ["#140c1c", "#442434", "#30346d", "#4e4a4e", "#854c30", "#346524", "#d04648", "#757161", "#597dce", "#d27d2c", "#8595a1", "#6daa2c", "#d2aa99", "#6dc2ca", "#dad45e", "#deeed6"],
    db32: ["#000000", "#222034", "#45283c", "#663931", "#8f563b", "#df7126", "#d9a066", "#eec39a", "#fbf236", "#99e550", "#6abe30", "#37946e", "#4b692f", "#524b24", "#323c39", "#3f3f74", "#306082", "#5b6ee1", "#639bff", "#5fcde4", "#cbdbfc", "#ffffff", "#9badb7", "#847e87", "#696a6a", "#595652", "#76428a", "#ac3232", "#d95763", "#d77bba", "#8f974a", "#8a6f30"],
    c64: ["#000000", "#6a5400", "#68ae5c", "#8a8a8a", "#adadad", "#636363", "#c37b75", "#c9d684", "#ffffff", "#984b43", "#a3e599", "#79c1c8", "#9b6739", "#9b51a5", "#52429d", "#8a7bce"],
    gameboy: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
    sega: ["#000000", "#555500", "#005500", "#555555", "#55aa00", "#550000", "#aaffaa", "#aaaaaa", "#ff5555", "#005555", "#550055", "#aaaa55", "#ffffaa", "#aa5555", "#ffaa55", "#ffff55", "#ffffff", "#ffaaaa", "#000055", "#55aaaa", "#aa0000", "#ff5500", "#ffaa00", "#aa5500", "#ff0000", "#ffaaff", "#aa55aa", "#aaaa00", "#aaff00", "#aaaaff", "#5555aa", "#aaffff"],
    cga: ["#000000", "#ff5555", "#55ff55", "#ffff55"],
    nes: ["#7C7C7C", "#0000FC", "#0000BC", "#4428BC", "#940084", "#A80020", "#A81000", "#881400", "#503000", "#007800", "#006800", "#005800", "#004058", "#000000", "#000000", "#000000", "#BCBCBC", "#0078F8", "#0058F8", "#6844FC", "#D800CC", "#E40058", "#F83800", "#E45C10", "#AC7C00", "#00B800", "#00A800", "#00A844", "#008888", "#000000", "#000000", "#000000", "#F8F8F8", "#3CBCFC", "#6888FC", "#9878F8", "#F878F8", "#F85898", "#F87858", "#FCA044", "#F8B800", "#B8F818", "#58D854", "#58F898", "#00E8D8", "#787878", "#000000", "#000000", "#FCFCFC", "#A4E4FC", "#B8B8F8", "#D8B8F8", "#F8B8F8", "#F8A4C0", "#F0D0B0", "#FCE0A8", "#F8D878", "#D8F878", "#B8F8B8", "#B8F8D8", "#00FCFC", "#F8D8F8", "#000000"],

  };

  cq.cocoon = function(selector) {
    if (arguments.length === 0) {
      var canvas = cq.createCocoonCanvas(window.innerWidth, window.innerHeight);
      window.addEventListener("resize", function() {});
    } else if (typeof selector === "string") {
      var canvas = document.querySelector(selector);
    } else if (typeof selector === "number") {
      var canvas = cq.createCocoonCanvas(arguments[0], arguments[1]);
    } else if (selector instanceof Image) {
      var canvas = cq.createCocoonCanvas(selector);
    } else if (selector instanceof cq.Layer) {
      return selector;
    } else {
      var canvas = selector;
    }

    return new cq.Layer(canvas);
  }


  cq.extend = function() {
    for (var i = 1; i < arguments.length; i++) {
      for (var j in arguments[i]) {
        arguments[0][j] = arguments[i][j];
      }
    }

    return arguments[0];
  };

  cq.augment = function() {
    for (var i = 1; i < arguments.length; i++) {
      _.extend(arguments[0], arguments[i]);
      arguments[i](arguments[0]);
    }
  };

  cq.distance = function(x1, y1, x2, y2) {
    if (arguments.length > 2) {
      var dx = x1 - x2;
      var dy = y1 - y2;

      return Math.sqrt(dx * dx + dy * dy);
    } else {
      return Math.abs(x1 - y1);
    }
  };

  /* fast.js */

  cq.fastApply = function(subject, thisContext, args) {

    switch (args.length) {
      case 0:
        return subject.call(thisContext);
      case 1:
        return subject.call(thisContext, args[0]);
      case 2:
        return subject.call(thisContext, args[0], args[1]);
      case 3:
        return subject.call(thisContext, args[0], args[1], args[2]);
      case 4:
        return subject.call(thisContext, args[0], args[1], args[2], args[3]);
      case 5:
        return subject.call(thisContext, args[0], args[1], args[2], args[3], args[4]);
      case 6:
        return subject.call(thisContext, args[0], args[1], args[2], args[3], args[4], args[5]);
      case 7:
        return subject.call(thisContext, args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
      case 8:
        return subject.call(thisContext, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
      case 9:
        return subject.call(thisContext, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
      default:
        return subject.apply(thisContext, args);
    }

  };

  cq.extend(cq, {

    smoothing: true,

    blend: function(below, above, mode, mix) {

      if (typeof mix === "undefined") mix = 1;

      var below = cq(below);
      var mask = below.clone();
      var above = cq(above);

      below.save();
      below.globalAlpha(mix);
      below.globalCompositeOperation(mode);
      below.drawImage(above.canvas, 0, 0);
      below.restore();

      mask.save();
      mask.globalCompositeOperation("source-in");
      mask.drawImage(below.canvas, 0, 0);
      mask.restore();

      return mask;
    },

    matchColor: function(color, palette) {
      var rgbPalette = [];

      for (var i = 0; i < palette.length; i++) {
        rgbPalette.push(cq.color(palette[i]));
      }

      var imgData = cq.color(color);

      var difList = [];
      for (var j = 0; j < rgbPalette.length; j++) {
        var rgbVal = rgbPalette[j];
        var rDif = Math.abs(imgData[0] - rgbVal[0]),
          gDif = Math.abs(imgData[1] - rgbVal[1]),
          bDif = Math.abs(imgData[2] - rgbVal[2]);
        difList.push(rDif + gDif + bDif);
      }

      var closestMatch = 0;
      for (var j = 0; j < palette.length; j++) {
        if (difList[j] < difList[closestMatch]) {
          closestMatch = j;
        }
      }

      return palette[closestMatch];
    },

    temp: function(width, height) {

      if (!this.tempLayer) {

        this.tempLayer = cq(1, 1);

      }

      if (width instanceof Image || width instanceof ImageBitmap) {
        this.tempLayer.width = width.width;
        this.tempLayer.height = width.height;
        this.tempLayer.context.drawImage(width, 0, 0);
      } else if (width instanceof Canvas) {
        this.tempLayer.width = width.width;
        this.tempLayer.height = width.height;
        this.tempLayer.context.drawImage(width, 0, 0);
      } else if (width instanceof CanvasQuery.Layer) {
        this.tempLayer.width = width.width;
        this.tempLayer.height = width.height;
        this.tempLayer.context.drawImage(width.canvas, 0, 0);
      } else {
        this.tempLayer.width = width;
        this.tempLayer.height = height;
      }

      return this.tempLayer;
    },

    wrapValue: function(value, min, max) {
      if (value < min) return max + (value % max);
      if (value >= max) return value % max;
      return value;
    },

    limitValue: function(value, min, max) {
      return value < min ? min : value > max ? max : value;
    },

    mix: function(a, b, amount) {
      return a + (b - a) * amount;
    },

    hexToRgb: function(hex) {
      if (hex.length === 7) return ['0x' + hex[1] + hex[2] | 0, '0x' + hex[3] + hex[4] | 0, '0x' + hex[5] + hex[6] | 0];
      else return ['0x' + hex[1] + hex[1] | 0, '0x' + hex[2] + hex[2] | 0, '0x' + hex[3] + hex[3] | 0];
    },

    rgbToHex: function(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1, 7);
    },

    extractCanvas: function(o) {

      if (o.canvas) return o.canvas;
      else return o;

    },

    compare: function(a, b) {

      a = this.extractCanvas(a);
      b = this.extractCanvas(b);

      a = a.getContext("2d").getImageData(0, 0, a.width, a.height).data;
      b = b.getContext("2d").getImageData(0, 0, b.width, b.height).data;

      if (a.length !== b.length) return false;

      for (var i = 0; i < a.length; i++) {

        if (a[i] !== b[i]) return false;

      }

      return true;

    },

    /* author: http://mjijackson.com/ */

    rgbToHsl: function(r, g, b) {

      if (r instanceof Array) {
        b = r[2];
        g = r[1];
        r = r[0];
      }

      r /= 255, g /= 255, b /= 255;
      var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;

      if (max == min) {
        h = s = 0; // achromatic
      } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }

      return [h, s, l];
    },

    /* author: http://mjijackson.com/ */

    hue2rgb: function(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    },

    hslToRgb: function(h, s, l) {
      var r, g, b;

      if (s == 0) {
        r = g = b = l; // achromatic
      } else {

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = this.hue2rgb(p, q, h + 1 / 3);
        g = this.hue2rgb(p, q, h);
        b = this.hue2rgb(p, q, h - 1 / 3);
      }

      return [r * 255 | 0, g * 255 | 0, b * 255 | 0];
    },

    rgbToHsv: function(r, g, b) {
      if (r instanceof Array) {
        b = r[2];
        g = r[1];
        r = r[0];
      }

      r = r / 255, g = g / 255, b = b / 255;
      var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      var h, s, v = max;

      var d = max - min;
      s = max == 0 ? 0 : d / max;

      if (max == min) {
        h = 0; // achromatic
      } else {
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }

      return [h, s, v];
    },

    hsvToRgb: function(h, s, v) {
      var r, g, b;

      var i = Math.floor(h * 6);
      var f = h * 6 - i;
      var p = v * (1 - s);
      var q = v * (1 - f * s);
      var t = v * (1 - (1 - f) * s);

      switch (i % 6) {
        case 0:
          r = v, g = t, b = p;
          break;
        case 1:
          r = q, g = v, b = p;
          break;
        case 2:
          r = p, g = v, b = t;
          break;
        case 3:
          r = p, g = q, b = v;
          break;
        case 4:
          r = t, g = p, b = v;
          break;
        case 5:
          r = v, g = p, b = q;
          break;
      }

      return [r * 255, g * 255, b * 255];
    },

    color: function() {
      var result = new cq.Color();
      result.parse(arguments[0], arguments[1]);
      return result;
    },

    poolArray: [],

    pool: function() {

      if (!this.poolArray.length) {
        for (var i = 0; i < 100; i++) {
          this.poolArray.push(this.createCanvas(1, 1));
        }
      }

      return this.poolArray.pop();

    },

    reuse: function(object) {

      return this.recycle(object);

    },

    recycle: function(object) {

      if (object instanceof CanvasQuery.Layer) {

        this.poolArray.push(object.canvas);

      } else {

        this.poolArray.push(object);

      }

    },

    setContextSmoothing: function(context, smoothing) {

      context.mozImageSmoothingEnabled = smoothing;
      context.msImageSmoothingEnabled = smoothing;
      context.webkitImageSmoothingEnabled = smoothing;
      context.imageSmoothingEnabled = smoothing;

    },

    createCanvas: function(width, height) {

      var result = document.createElement("canvas");

      if (arguments[0] instanceof Image || arguments[0] instanceof Canvas || arguments[0] instanceof ImageBitmap) {

        var image = arguments[0];

        result.width = image.width;
        result.height = image.height;

        result.getContext("2d").drawImage(image, 0, 0);

      } else {

        result.width = width;
        result.height = height;

      }

      return result;

    },

    createCocoonCanvas: function(width, height) {

      var result = document.createElement("screencanvas");

      if (arguments[0] instanceof Image) {
        var image = arguments[0];
        result.width = image.width;
        result.height = image.height;
        result.getContext("2d").drawImage(image, 0, 0);
      } else {
        result.width = width;
        result.height = height;
      }

      return result;

    },

    createImageData: function(width, height) {

      return cq.createCanvas(width, height).getContext("2d").createImageData(width, height);

    }

  });

  cq.Layer = function(canvas) {

    this.useAlpha = true;
    this.canvas = canvas;
    this.prevAlignX = [];
    this.prevAlignY = [];
    this.alignX = 0;
    this.alignY = 0;
    this.aligned = false;
    this.update();

  };

  cq.Layer.prototype = {

    constructor: cq.Layer,

    update: function() {

      var smoothing = cq.smoothing;

      if (typeof this.smoothing !== "undefined") smoothing = this.smoothing;

      this.context = this.canvas.getContext("2d", {
        alpha: Boolean(this.useAlpha)
      });

      this.context.mozImageSmoothingEnabled = smoothing;
      this.context.msImageSmoothingEnabled = smoothing;
      this.context.webkitImageSmoothingEnabled = smoothing;
      this.context.imageSmoothingEnabled = smoothing;

      if (cq.defaultFont) this.context.font = cq.defaultFont;

      this.context.textBaseline = cq.textBaseline;

      if (COCOONJS) Cocoon.Utils.setAntialias(smoothing);

      if (cq.strokeStyle) this.context.strokeStyle = cq.strokeStyle;
      if (cq.fillStyle) this.context.fillStyle = cq.fillStyle;
    },

    appendTo: function(selector) {

      if (typeof selector === "object") {

        var element = selector;

      } else {

        var element = document.querySelector(selector);

      }

      /*
            this.width = element.clientWidth;
            this.height = element.clientHeight;
      */

      element.appendChild(this.canvas);

      return this;
    },

    a: function(a) {

      if (arguments.length) {

        this.previousAlpha = this.globalAlpha();

        return this.globalAlpha(a);

      } else {

        return this.globalAlpha();

      }

    },

    ra: function() {

      return this.a(this.previousAlpha);

    },
    /*
        drawImage: function() {

          if (!this.alignX && !this.alignY) {
            this.context.call
          }

            return this;


        },

        restore: function() {
          this.context.restore();
          this.alignX = 0;
          this.alignY = 0;
        },
        */

    realign: function() {

      this.alignX = this.prevAlignX[this.prevAlignX.length - 1];
      this.alignY = this.prevAlignY[this.prevAlignY.length - 1];

      return this;

    },

    align: function(x, y) {

      if (typeof y === "undefined") y = x;

      this.alignX = x;
      this.alignY = y;

      return this;
    },


    /* save translate align rotate scale */

    stars: function(x, y, alignX, alignY, rotation, scaleX, scaleY) {

      if (typeof alignX === "undefined") alignX = 0.5;
      if (typeof alignY === "undefined") alignY = 0.5;
      if (typeof rotation === "undefined") rotation = 0;
      if (typeof scaleX === "undefined") scaleX = 1.0;
      if (typeof scaleY === "undefined") scaleY = scaleX;

      this.save();
      this.translate(x, y);
      this.align(alignX, alignY);
      this.rotate(rotation);
      this.scale(scaleX, scaleY);

      return this;
    },

    tars: function(x, y, alignX, alignY, rotation, scaleX, scaleY) {

      if (typeof alignX === "undefined") alignX = 0.5;
      if (typeof alignY === "undefined") alignY = 0.5;
      if (typeof rotation === "undefined") rotation = 0;
      if (typeof scaleX === "undefined") scaleX = 1.0;
      if (typeof scaleY === "undefined") scaleY = scaleX;

      this.translate(x, y);
      this.align(alignX, alignY);
      this.rotate(rotation);
      this.scale(scaleX, scaleY);

      return this;

    },

    webkit: ('WebkitAppearance' in document.documentElement.style),

    fillText: function(text, x, y, gap) {

      text = String(text);

      if (!text.length) return;

      var webkitHack = !cq.smoothing && (this.fontHeight() <= 64) && ('WebkitAppearance' in document.documentElement.style);

      if (webkitHack) {

        var scale = this.webkit ? 4 : 5;

        var canvas = cq.pool();
        var context = canvas.getContext("2d");

        context.font = this.context.font;

        var realWidth = context.measureText(text).width;
        var width = Math.ceil(realWidth);
        var gap = gap || (width - realWidth);

        var height = this.fontHeight();

        canvas.width = width * scale;
        canvas.height = height * scale;

        cq.setContextSmoothing(context, false);

        // context.fillStyle = "#fff"; 
        // context.fillRect(0,0,canvas.width, canvas.height);

        context.font = this.context.font;
        context.fillStyle = this.context.fillStyle;
        context.textBaseline = "top";

        context.scale(scale, scale);
        context.fillText(text, gap, -this.fontTop());

        if (this.context.textAlign === "center") x -= width * 0.5;
        else if (this.context.textAlign === "right") x -= width;

        this.drawImage(canvas, 0, 0, canvas.width, canvas.height, x, y, canvas.width / scale, canvas.height / scale);

      } else {


        this.context.fillText(text, x, y - this.fontTop());


      }

      return this;

    },

    fillRect: function() {

      if (this.alignX || this.alignY) {

        this.context.fillRect(arguments[0] - arguments[2] * this.alignX | 0, arguments[1] - arguments[3] * this.alignY | 0, arguments[2], arguments[3]);

      } else {

        this.context.fillRect(arguments[0], arguments[1], arguments[2], arguments[3]);

      }

      return this;

    },

    strokeRect: function() {

      if (this.alignX || this.alignY) {

        this.context.strokeRect(arguments[0] - arguments[2] * this.alignX | 0, arguments[1] - arguments[3] * this.alignY | 0, arguments[2], arguments[3]);

      } else {

        this.context.strokeRect(arguments[0], arguments[1], arguments[2], arguments[3]);

      }

      return this;

    },

    drawImage: function(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {

      if (this.alignX || this.alignY) {

        if (typeof sWidth === "undefined") {
          sx -= image.width * this.alignX | 0;
          sy -= image.height * this.alignY | 0;
        } else {
          dx -= dWidth * this.alignX | 0;
          dy -= dHeight * this.alignY | 0;
        }

      }

      if (typeof sWidth === "undefined") {

        this.context.drawImage(image, sx, sy);

      } else if (typeof dx === "undefined") {

        this.context.drawImage(image, sx, sy, sWidth, sHeight);

      } else {

        this.context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

      }

      return this;

    },

    drawImageCentered: function(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {

      if (sWidth == null) {
        sx -= image.width * 0.5 | 0;
        sy -= image.height * 0.5 | 0;
      } else {
        dx -= dWidth * 0.5 | 0;
        dy -= dHeight * 0.5 | 0;
      }

      if (sWidth == null) {

        this.context.drawImage(image, sx, sy);

      } else if (dx == null) {

        this.context.drawImage(image, sx, sy, sWidth, sHeight);

      } else {

        this.context.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

      }

      return this;

    },

    save: function() {

      this.prevAlignX.push(this.alignX);
      this.prevAlignY.push(this.alignY);

      this.context.save();

      return this;

    },

    restore: function() {

      this.realign();
      this.alignX = this.prevAlignX.pop();
      this.alignY = this.prevAlignY.pop();
      this.context.restore();

      return this;

    },

    drawTile: function(image, x, y, frameX, frameY, frameWidth, frameHeight, frames, frame) {

    },

    checkerboard: function(x, y, w, h, grid, colorA, colorB) {

      var tx = w / grid | 0;
      var ty = h / grid | 0;

      this.save();
      this.rect(x, y, w, h).clip();

      for (var i = 0; i <= tx; i++) {
        for (var j = 0; j <= ty; j++) {


          if (j % 2) var color = i % 2 ? colorA : colorB;
          else var color = i % 2 ? colorB : colorA;

          this.fillStyle(color);
          this.fillRect(x + i * grid, y + j * grid, grid, grid);

        }
      }

      this.restore();

    },

    drawAtlasFrame: function(atlas, frame, x, y) {

      var frame = atlas.frames[frame];

      this.drawRegion(
        atlas.image,
        frame.region,
        x - frame.width * this.alignX + frame.offset[0] + frame.region[2] * this.alignX,
        y - frame.height * this.alignY + frame.offset[1] + frame.region[3] * this.alignY
      );

      return this;

    },

    coverImage: function(image, width, height) {

      if (typeof width === "undefined") width = this.width;
      if (typeof height === "undefined") height = this.height;

      var scale = Math.max(width / image.width, height / image.height);

      this.save();
      this.scale(scale, scale);
      this.drawImage(image, 0, 0);
      this.restore();

    },

    fitImage: function(image, width, height) {

      if (typeof width === "undefined") width = this.width;
      if (typeof height === "undefined") height = this.height;

      var scale = Math.min(width / image.width, height / image.height);

      this.save();
      this.scale(scale, scale);
      this.drawImage(image, 0, 0);
      this.restore();

    },


    drawRegion: function(image, region, x, y, scale) {

      scale = scale || 1;

      return this.drawImage(
        image, region[0], region[1], region[2], region[3],
        x | 0, y | 0, region[2] * scale | 0, region[3] * scale | 0
      );

    },

    drawRegionCentered: function(image, region, x, y, scale) {

      scale = scale || 1;

      return this.drawImageCentered(
        image, region[0], region[1], region[2], region[3],
        x | 0, y | 0, region[2] * scale | 0, region[3] * scale | 0
      );

    },

    cache: function() {

      return this.clone().canvas;

    },

    popup: function() {

      window.open(this.canvas.toDataURL());

      return this;

    },

    blendOn: function(what, mode, mix) {
      cq.blend(what, this, mode, mix);

      return this;
    },

    posterize: function(pc, inc) {
      pc = pc || 32;
      inc = inc || 4;
      var imgdata = this.getImageData(0, 0, this.width, this.height);
      var data = imgdata.data;

      for (var i = 0; i < data.length; i += inc) {
        data[i] -= data[i] % pc; // set value to nearest of 8 possibilities
        data[i + 1] -= data[i + 1] % pc; // set value to nearest of 8 possibilities
        data[i + 2] -= data[i + 2] % pc; // set value to nearest of 8 possibilities
      }

      this.putImageData(imgdata, 0, 0); // put image data to canvas

      return this;
    },

    posterizeAlpha: function(pc, inc) {
      pc = pc || 32;
      inc = inc || 4;
      var imgdata = this.getImageData(0, 0, this.width, this.height);
      var data = imgdata.data;

      for (var i = 0; i < data.length; i += inc) {

        data[i + 3] -= data[i + 3] % pc; // set value to nearest of 8 possibilities

      }

      this.putImageData(imgdata, 0, 0); // put image data to canvas

      return this;
    },

    bw: function(pc) {
      pc = 128;
      var imgdata = this.getImageData(0, 0, this.width, this.height);
      var data = imgdata.data;
      // 8-bit: rrr ggg bb
      for (var i = 0; i < data.length; i += 4) {
        var v = ((data[i] + data[i + 1] + data[i + 2]) / 3);

        v = (v / 128 | 0) * 128;
        //data[i] = v; // set value to nearest of 8 possibilities
        //data[i + 1] = v; // set value to nearest of 8 possibilities
        data[i + 2] = (v / 255) * data[i]; // set value to nearest of 8 possibilities

      }

      this.putImageData(imgdata, 0, 0); // put image data to canvas
    },

    blend: function(what, mode, mix) {
      if (typeof what === "string") {
        var color = what;
        what = cq(this.canvas.width, this.canvas.height);
        what.fillStyle(color).fillRect(0, 0, this.canvas.width, this.canvas.height);
      }

      var result = cq.blend(this, what, mode, mix);

      this.canvas = result.canvas;
      this.context = result.context;

      return this;
    },

    textWithBackground: function(text, x, y, background, padding) {
      var w = this.measureText(text).width;
      var h = this.fontHeight() * 0.8;
      var f = this.fillStyle();
      var padding = padding || 2;

      var a = this.context.textAlign;

      this.fillStyle(background).fillRect(x - padding * 2, y - padding, w + padding * 4, h + padding * 2)
      this.fillStyle(f).textAlign("left").textBaseline("top").fillText(text, x, y);

      return this;
    },

    fillCircle: function(x, y, r) {
      this.context.beginPath();
      this.context.arc(x, y, r, 0, Math.PI * 2);
      this.context.fill();
      return this;
    },

    strokeCircle: function(x, y, r) {
      this.context.beginPath();
      this.context.arc(x, y, r, 0, Math.PI * 2);
      this.context.stroke();
      return this;
    },

    circle: function(x, y, r) {
      this.context.arc(x, y, r, 0, Math.PI * 2);
      return this;
    },

    crop: function(x, y, w, h) {

      if (arguments.length === 1) {

        var y = arguments[0][1];
        var w = arguments[0][2];
        var h = arguments[0][3];
        var x = arguments[0][0];
      }

      var canvas = cq.createCanvas(w, h);
      var context = canvas.getContext("2d");

      context.drawImage(this.canvas, x, y, w, h, 0, 0, w, h);
      this.canvas.width = w;
      this.canvas.height = h;

      cq.setContextSmoothing(this.context, false);

      this.clear();
      this.context.drawImage(canvas, 0, 0);

      return this;
    },

    set: function(properties) {

      cq.extend(this.context, properties);

    },

    resize: function(width, height) {

      var w = width,
        h = height;

      if (arguments.length === 1) {

        w = arguments[0] * this.canvas.width | 0;
        h = arguments[0] * this.canvas.height | 0;

      } else {

        if (height === false) {

          if (this.canvas.width > width) {

            h = this.canvas.height * (width / this.canvas.width) | 0;
            w = width;

          } else {

            w = this.canvas.width;
            h = this.canvas.height;

          }

        } else if (width === false) {

          if (this.canvas.width > width) {

            w = this.canvas.width * (height / this.canvas.height) | 0;
            h = height;

          } else {

            w = this.canvas.width;
            h = this.canvas.height;

          }

        }

      }

      var cqresized = cq(w, h).drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, w, h);

      this.canvas = cqresized.canvas;
      this.context = cqresized.context;

      return this;

    },

    resizeBounds: function(width, height) {

      var temp = cq(width, height);

      temp.drawImage(this.canvas, 0, 0);

      this.canvas = temp.canvas;
      this.context = temp.context;

      return this;

    },

    imageLine: function(image, region, x, y, ex, ey, scale) {

      if (!region) region = [0, 0, image.width, image.height];

      var distance = cq.distance(x, y, ex, ey);
      var count = distance / region[3] + 0.5 | 0;
      var angle = Math.atan2(ey - y, ex - x) + Math.PI / 2;

      this.save();

      this.translate(x, y);
      this.rotate(angle);

      if (scale) this.scale(scale, 1.0);

      for (var i = 0; i <= count; i++) {
        this.drawRegion(image, region, -region[2] / 2 | 0, -region[3] * (i + 1));
      }

      this.restore();

      return this;

    },

    trim: function(color, changes) {
      var transparent;

      if (color) {
        color = cq.color(color).toArray();
        transparent = !color[3];
      } else transparent = true;

      var sourceData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var sourcePixels = sourceData.data;

      var bound = [this.canvas.width, this.canvas.height, 0, 0];

      var width = this.canvas.width;
      var height = this.canvas.height;

      for (var i = 0, len = sourcePixels.length; i < len; i += 4) {

        if (transparent) {

          if (!sourcePixels[i + 3]) continue;

        } else if (sourcePixels[i + 0] === color[0] && sourcePixels[i + 1] === color[1] && sourcePixels[i + 2] === color[2]) continue;

        var x = (i / 4 | 0) % this.canvas.width | 0;
        var y = (i / 4 | 0) / this.canvas.width | 0;

        if (x < bound[0]) bound[0] = x;
        if (x > bound[2]) bound[2] = x;

        if (y < bound[1]) bound[1] = y;
        if (y > bound[3]) bound[3] = y;
      }


      if (bound[2] === 0 && bound[3] === 0) {

        if (changes) changes.none = true;

      } else {
        if (changes) {
          changes.left = bound[0];
          changes.top = bound[1];

          changes.bottom = height - bound[3] - bound[1];
          changes.right = width - bound[2] - bound[0];

          changes.width = bound[2] - bound[0];
          changes.height = bound[3] - bound[1];
        }

        this.crop(bound[0], bound[1], bound[2] - bound[0] + 1, bound[3] - bound[1] + 1);
      }

      return this;
    },

    matchPalette: function(palette) {

      if (!palette.matches) palette.matches = new Map;

      if (!palette.colors) {

        palette.colors = [];

        for (var i = 0; i < palette.length; i++) {

          palette.colors.push(cq.color(palette[i]));

        }
      }

      var imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var pixels = imageData.data;

      for (var i = 0; i < pixels.length; i += 4) {

        var difList = [];

        if (!pixels[i + 3]) continue;

        var key =
          (pixels[i + 0] / cq.matchPalettePrecision | 0) * cq.matchPalettePrecision +
          (pixels[i + 1] / cq.matchPalettePrecision | 0) * cq.matchPalettePrecision * 1000 +
          (pixels[i + 2] / cq.matchPalettePrecision | 0) * cq.matchPalettePrecision * 1000000;


        if (!palette.matches.has(key)) {

          for (var j = 0; j < palette.colors.length; j++) {

            var rgb = palette.colors[j];
            var rDif = Math.abs(pixels[i] - rgb[0]);
            var gDif = Math.abs(pixels[i + 1] - rgb[1])
            var bDif = Math.abs(pixels[i + 2] - rgb[2]);

            difList.push(rDif + gDif + bDif);

          }

          var closestMatch = 0;

          for (var j = 0; j < palette.length; j++) {

            if (difList[j] < difList[closestMatch]) {

              closestMatch = j;

            }

          }

          palette.matches.set(key, palette.colors[closestMatch]);

        }

        var matchedColor = palette.matches.get(key);

        pixels[i] = matchedColor[0];
        pixels[i + 1] = matchedColor[1];
        pixels[i + 2] = matchedColor[2];

        /* dithering */

        //imageData.data[i + 3] = (255 * Math.random() < imageData.data[i + 3]) ? 255 : 0;

        //imageData.data[i + 3] = imageData.data[i + 3] > 128 ? 255 : 0;
        /*
        if (i % 3 === 0) {
          imageData.data[i] -= cq.limitValue(imageData.data[i] - 50, 0, 255);
          imageData.data[i + 1] -= cq.limitValue(imageData.data[i + 1] - 50, 0, 255);
          imageData.data[i + 2] -= cq.limitValue(imageData.data[i + 2] - 50, 0, 255);
        }
        */

      }

      this.context.putImageData(imageData, 0, 0);

      return this;

    },

    swapColors: function(colors) {

      var colormap = {};

      for (var key in colors) {

        var color = cq.color(key);
        var index = color[0] + color[1] * 1000 + color[2] * 1000000;
        // var index = String(color[0]) + "," + String(color[1]) + "," + String(color[2]);

        colormap[index] = cq.color(colors[key]);

      }

      var imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var pixels = imageData.data;

      for (var i = 0; i < pixels.length; i += 4) {

        if (!pixels[i + 3]) continue;

        var index = pixels[i] + pixels[i + 1] * 1000 + pixels[i + 2] * 1000000;
        // var index = String(pixels[i + 0]) + "," + String(pixels[i + 1]) + "," + String(pixels[i + 2]);

        if (colormap[index]) {

          pixels[i] = colormap[index][0];
          pixels[i + 1] = colormap[index][1];
          pixels[i + 2] = colormap[index][2];

        }

      }

      this.context.putImageData(imageData, 0, 0);

      return this;

    },

    getPalette: function() {

      var palette = [];
      var sourceData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var sourcePixels = sourceData.data;

      for (var i = 0, len = sourcePixels.length; i < len; i += 4) {
        if (sourcePixels[i + 3]) {
          var hex = cq.rgbToHex(sourcePixels[i + 0], sourcePixels[i + 1], sourcePixels[i + 2]);
          if (palette.indexOf(hex) === -1) palette.push(hex);
        }
      }

      return palette;
    },

    mapPalette: function() {

    },

    lines: function() {

      for (var i = 0; i < arguments.length; i += 2) {

        this.lineTo(arguments[i], arguments[i + 1]);

      }

      return this;

    },

    polygon: function(array, x, y) {

      if (x === undefined) {
        x = 0;
      }
      if (y === undefined) {
        y = 0;
      }

      this.beginPath();

      this.moveTo(array[0][0] + x, array[0][1] + y);

      for (var i = 1; i < array.length; i++) {
        this.lineTo(array[i][0] + x, array[i][1] + y);
      }

      this.closePath();

      return this;

    },

    fillPolygon: function(polygon) {

      this.polygon(polygon);
      this.fill();

    },

    strokePolygon: function(polygon) {

      this.polygon(polygon);
      this.stroke();

    },

    rotate: function(angle) {

      this.context.rotate(angle);

      return this;

    },

    scale: function(x, y) {

      this.context.scale(x, y);

      return this;

    },

    translate: function(x, y) {

      this.context.translate(x, y);

      return this;

    },

    colorToMask: function(color, inverted) {
      color = cq.color(color).toArray();
      var sourceData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var sourcePixels = sourceData.data;

      var mask = [];

      for (var i = 0, len = sourcePixels.length; i < len; i += 4) {
        if (sourcePixels[i + 3] > 0) mask.push(inverted ? false : true);
        else mask.push(inverted ? true : false);
      }

      return mask;
    },

    grayscaleToMask: function() {

      var sourceData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var sourcePixels = sourceData.data;

      var mask = [];

      for (var i = 0, len = sourcePixels.length; i < len; i += 4) {
        mask.push(((sourcePixels[i + 0] + sourcePixels[i + 1] + sourcePixels[i + 2]) / 3) / 255);
      }

      return mask;
    },

    applyMask: function(mask) {
      var sourceData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var sourcePixels = sourceData.data;

      var mode = typeof mask[0] === "boolean" ? "bool" : "byte";

      for (var i = 0, len = sourcePixels.length; i < len; i += 4) {
        var value = mask[i / 4];
        sourcePixels[i + 3] = value * 255 | 0;
      }

      this.context.putImageData(sourceData, 0, 0);
      return this;
    },

    fillMask: function(mask) {

      var sourceData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var sourcePixels = sourceData.data;

      var maskType = typeof mask[0] === "boolean" ? "bool" : "byte";
      var colorMode = arguments.length === 2 ? "normal" : "gradient";

      var color = cq.color(arguments[1]);
      if (colorMode === "gradient") colorB = cq.color(arguments[2]);

      for (var i = 0, len = sourcePixels.length; i < len; i += 4) {
        var value = mask[i / 4];

        if (maskType === "byte") value /= 255;

        if (colorMode === "normal") {
          if (value) {
            sourcePixels[i + 0] = color[0] | 0;
            sourcePixels[i + 1] = color[1] | 0;
            sourcePixels[i + 2] = color[2] | 0;
            sourcePixels[i + 3] = value * 255 | 0;
          }
        } else {
          sourcePixels[i + 0] = color[0] + (colorB[0] - color[0]) * value | 0;
          sourcePixels[i + 1] = color[1] + (colorB[1] - color[1]) * value | 0;
          sourcePixels[i + 2] = color[2] + (colorB[2] - color[2]) * value | 0;
          sourcePixels[i + 3] = 255;
        }
      }

      this.context.putImageData(sourceData, 0, 0);
      return this;
    },

    clear: function(color) {
      if (color) {
        this.context.fillStyle = color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      } else {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }

      return this;
    },

    clone: function() {

      // var result = cq.createCanvas(this.canvas);

      var result = cq.pool();
      result.width = this.width;
      result.height = this.height;
      result.getContext("2d").drawImage(this.canvas, 0, 0);

      return cq(result);
    },

    gradientText: function(text, x, y, maxWidth, gradient) {

      var words = text.split(" ");

      var h = this.fontHeight() * 2;

      var ox = 0;
      var oy = 0;

      if (maxWidth) {
        var line = 0;
        var lines = [""];

        for (var i = 0; i < words.length; i++) {
          var word = words[i] + " ";
          var wordWidth = this.context.measureText(word).width;

          if (ox + wordWidth > maxWidth) {
            lines[++line] = "";
            ox = 0;
          }

          lines[line] += word;

          ox += wordWidth;
        }
      } else var lines = [text];

      for (var i = 0; i < lines.length; i++) {
        var oy = y + i * h * 0.6 | 0;
        var lingrad = this.context.createLinearGradient(0, oy, 0, oy + h * 0.6 | 0);

        for (var j = 0; j < gradient.length; j += 2) {
          lingrad.addColorStop(gradient[j], gradient[j + 1]);
        }

        var text = lines[i];

        this.fillStyle(lingrad).fillText(text, x, oy);
      }

      return this;
    },

    removeColor: function(color) {

      color = cq.color(color);

      var data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var pixels = data.data;

      for (var x = 0; x < this.canvas.width; x++) {
        for (var y = 0; y < this.canvas.height; y++) {
          var i = (y * this.canvas.width + x) * 4;

          if (pixels[i + 0] === color[0] && pixels[i + 1] === color[1] && pixels[i + 2] === color[2]) {
            pixels[i + 3] = 0;
          }


        }
      }

      this.clear();
      this.context.putImageData(data, 0, 0);

      return this;
    },

    _outlineCheck: function check(x, y, width, height, pixels) {

      if (x < 0) return 0;
      if (x >= width) return 0;
      if (y < 0) return 0;
      if (y >= height) return 0;

      var i = (x + y * width) * 4;

      return pixels[i + 3] > 0;

    },

    outline: function(color) {

      var color = cq.color(color || "#fff");

      var data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var pixels = data.data;

      var newData = this.createImageData(this.canvas.width, this.canvas.height);
      var newPixels = newData.data;

      var canvas = this.canvas;


      for (var x = 0; x < this.canvas.width; x++) {
        for (var y = 0; y < this.canvas.height; y++) {

          var full = 0;
          var i = (y * canvas.width + x) * 4;

          if (!pixels[i + 3]) continue;

          full += this._outlineCheck(x - 1, y, canvas.width, canvas.height, pixels);
          full += this._outlineCheck(x + 1, y, canvas.width, canvas.height, pixels);
          full += this._outlineCheck(x, y - 1, canvas.width, canvas.height, pixels);
          full += this._outlineCheck(x, y + 1, canvas.width, canvas.height, pixels);

          if (full !== 4) {

            newPixels[i] = color[0];
            newPixels[i + 1] = color[1];
            newPixels[i + 2] = color[2];
            newPixels[i + 3] = 255;

          }

        }
      }

      this.context.putImageData(newData, 0, 0);

      return this;
    },

    setHsl: function() {

      if (arguments.length === 1) {
        var args = arguments[0];
      } else {
        var args = arguments;
      }

      var data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var pixels = data.data;
      var r, g, b, a, h, s, l, hsl = [],
        newPixel = [];

      for (var i = 0, len = pixels.length; i < len; i += 4) {
        hsl = cq.rgbToHsl(pixels[i + 0], pixels[i + 1], pixels[i + 2]);

        h = args[0] === false ? hsl[0] : cq.limitValue(args[0], 0, 1);
        s = args[1] === false ? hsl[1] : cq.limitValue(args[1], 0, 1);
        l = args[2] === false ? hsl[2] : cq.limitValue(args[2], 0, 1);

        newPixel = cq.hslToRgb(h, s, l);

        pixels[i + 0] = newPixel[0];
        pixels[i + 1] = newPixel[1];
        pixels[i + 2] = newPixel[2];
      }

      this.context.putImageData(data, 0, 0);

      return this;
    },

    shiftHsl: function() {

      if (arguments.length === 1) {
        var args = arguments[0];
      } else {
        var args = arguments;
      }

      var data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var pixels = data.data;
      var r, g, b, a, h, s, l, hsl = [],
        newPixel = [];

      for (var i = 0, len = pixels.length; i < len; i += 4) {
        hsl = cq.rgbToHsl(pixels[i + 0], pixels[i + 1], pixels[i + 2]);

        if (pixels[i + 0] !== pixels[i + 1] || pixels[i + 1] !== pixels[i + 2]) {
          h = args[0] === false ? hsl[0] : cq.wrapValue(hsl[0] + args[0], 0, 1);
          s = args[1] === false ? hsl[1] : cq.limitValue(hsl[1] + args[1], 0, 1);
        } else {
          h = hsl[0];
          s = hsl[1];
        }

        l = args[2] === false ? hsl[2] : cq.limitValue(hsl[2] + args[2], 0, 1);

        newPixel = cq.hslToRgb(h, s, l);

        pixels[i + 0] = newPixel[0];
        pixels[i + 1] = newPixel[1];
        pixels[i + 2] = newPixel[2];
      }


      this.context.putImageData(data, 0, 0);

      return this;
    },

    applyColor: function(color) {

      if (COCOONJS) return this;
      this.save();

      this.globalCompositeOperation("source-in");
      this.clear(color);

      this.restore();

      return this;
    },

    negative: function(src, dst) {

      var data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      var pixels = data.data;
      var r, g, b, a, h, s, l, hsl = [],
        newPixel = [];

      for (var i = 0, len = pixels.length; i < len; i += 4) {
        pixels[i + 0] = 255 - pixels[i + 0];
        pixels[i + 1] = 255 - pixels[i + 1];
        pixels[i + 2] = 255 - pixels[i + 2];
      }

      this.context.putImageData(data, 0, 0);

      return this;
    },

    roundRect: function(x, y, width, height, radius) {

      this.moveTo(x + radius, y);
      this.lineTo(x + width - radius, y);
      this.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.lineTo(x + width, y + height - radius);
      this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.lineTo(x + radius, y + height);
      this.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.lineTo(x, y + radius);
      this.quadraticCurveTo(x, y, x + radius, y);
      this.closePath();

      return this;
    },

    markupText: function(text) {


    },

    charWidth: function(char) {

      if (!cq.charWidthCache) cq.charWidthCache = new Map();

      if (!cq.charWidthCache.has(this.context.font + char)) {

        var width = this.measureText(char).width;

        cq.charWidthCache.set(this.context.font + char, width);

      }

      return cq.charWidthCache.get(this.context.font + char);

    },

    pixelText: function(text, x, y) {

      var prevTextAlign = this.context.textAlign;

      this.context.textAlign = "left";

      var textWidth = 0;

      if (prevTextAlign === "center") {

        for (var i = 0; i < text.length; i++) {

          var w = this.charWidth(text[i]);

          var o = w - (w | 0);

          textWidth += w + (o > 0.5 ? 1 : 0) | 0;

        }

        x -= textWidth / 2 | 0;

      }

      for (var i = 0; i < text.length; i++) {

        var c = text[i];

        var w = this.charWidth(c);

        var o = w - (w | 0);

        this.context.fillText(c, x, y);

        x += w + (o > 0.5 ? 1 : 0) | 0;

      }

      this.context.textAlign = prevTextAlign;

      return this;

    },

    wrappedText: function(text, x, y, maxWidth, lineHeight) {


      if (maxWidth < 0) maxWidth = 0;

      var words = text.split(" ");

      var lineHeight = lineHeight || this.fontHeight();

      var ox = 0;
      var oy = 0;

      var textAlign = this.context.textAlign;
      var textBaseline = this.context.textBaseline;

      this.textBaseline("top");

      var spaceWidth = this.context.measureText(" ").width + 0.5 | 0;
      // var newlineOnly = !maxWidth && text.indexOf("\n") > -1;

      if (!maxWidth && text.indexOf("\n") > -1) {

        maxWidth = this.textBoundaries(text).width;

      }

      if (maxWidth) {

        var line = 0;
        var lines = [""];
        var linesWidth = [0];

        for (var i = 0; i < words.length; i++) {

          var word = words[i];

          var wordWidth = Math.ceil(this.context.measureText(word).width);

          if (maxWidth && wordWidth > maxWidth) {

            /* 4 is still risky, it's valid as long as `-` is the delimiter */

            if (word.length <= 5) return;

            var split = word.length / 2 | 0;

            words.splice(i, 1);
            words.splice(i, 0, "-" + word.substr(split));
            words.splice(i, 0, word.substr(0, split) + "-");

            i--;

            continue;
          }

          if ((ox + wordWidth > maxWidth) || words[i] === "\n") {

            lines[line] = lines[line].substr(0, lines[line].length - 1);
            linesWidth[line] -= spaceWidth;

            lines[++line] = "";
            linesWidth[line] = 0;
            ox = 0;
          }

          if (words[i] !== "\n") {

            lines[line] += word + " ";

            ox += wordWidth + spaceWidth;

            linesWidth[line] += wordWidth + spaceWidth;

          }

        }

        if (words[i] !== "\n") {
          lines[line] = lines[line].substr(0, lines[line].length - 1);
          linesWidth[line] -= spaceWidth;
        }


      } else {

        var lines = [text];
        var linesWidth = [this.context.measureText(text).width + 0.5 | 0];

      }

      for (var i = 0; i < lines.length; i++) {

        var oy = y + i * lineHeight | 0;

        var text = lines[i];
        var width = linesWidth[i];

        this.textAlign("left");

        if (textAlign === "left" || textAlign === "start")
          this.fillText(text, x, oy);
        else if (textAlign === "center")
          this.fillText(text, x - width * 0.5 | 0, oy);
        else
          this.fillText(text, x - width, oy);

      }

      this.textAlign(textAlign);
      this.textBaseline(textBaseline);

      return this;

    },

    fontHeights: {},
    fontTops: {},

    fontTop: function() {

      if (!this.fontTops[this.context.font]) this.fontHeight();

      return this.fontTops[this.context.font];

    },

    parseFontHeight: function(font) {

      var match = font.match(/([0-9]+)(px|pt)/);

      return match[2] === "px" ? (match[1] | 0) : (math[1] * 1.33 | 0);

    },

    fontHeight: function() {

      var font = this.font();

      if (!this.fontHeights[font]) {

        var fontStyleHeight = this.parseFontHeight(font);

        var temp = cq(100, 10 + fontStyleHeight * 2 | 0);

        cq.setContextSmoothing(temp.context, false);

        temp.font(font).fillStyle("#fff");
        temp.textBaseline("top");

        /* Use direct fillText as internal inmplementation uses fontWidth() */
        var oy = 10;

        temp.context.fillText("Play Moog", 20, oy);

        var data = temp.getImageData(0, 0, temp.width, temp.height).data;

        var top = temp.height;
        var bottom = 0;

        for (var i = 0; i < data.length; i += 4) {

          var x = (i / 4 | 0) % temp.width;
          var y = (i / 4 | 0) / temp.width | 0;

          /* A little threshold for anti-alias */

          if (data[i + 3] < 200) continue;

          if (y < top) top = y;
          if (y > bottom) bottom = y;

        }

        this.fontHeights[font] = bottom - oy + 1;
        this.fontTops[font] = top - oy;

      }

      return this.fontHeights[font];

    },

    textBoundaries: function(text, maxWidth) {

      if (maxWidth < 0) maxWidth = 0;

      var words = text.split(" ");

      var h = this.fontHeight();

      var ox = 0;
      var oy = 0;

      var spaceWidth = this.context.measureText(" ").width + 0.5 | 0;

      var line = 0;
      var lines = [""];

      var width = 0;

      for (var i = 0; i < words.length; i++) {

        var word = words[i];
        var wordWidth = Math.ceil(this.context.measureText(word).width);

        if (maxWidth && (wordWidth > maxWidth)) {

          if (word.length <= 5) continue;

          var split = word.length / 2 | 0;

          words.splice(i, 1);
          words.splice(i, 0, "-" + word.substr(split));
          words.splice(i, 0, word.substr(0, split) + "-");

          i--;

          continue;
        }

        if (((ox + wordWidth > maxWidth) && maxWidth) || words[i] === "\n") {

          if (ox > width) width = ox;

          lines[++line] = "";

          ox = 0;

        }

        if (words[i] !== "\n") {

          lines[line] += word;

          ox += wordWidth + spaceWidth;

        }

      }

      if (maxWidth) {

        var width = maxWidth;

      } else {

        if (!width) {

          width = this.context.measureText(text).width + 0.5 | 0;

        }

      }

      return {
        height: lines.length * h,
        width: Math.ceil(width),
        lines: lines.length,
        fontHeight: h
      }

    },

    repeatImageRegion: function(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      this.save();
      this.rect(dx, dy, dw, dh);
      this.clip();

      for (var x = 0, len = Math.ceil(dw / sw); x < len; x++) {
        for (var y = 0, leny = Math.ceil(dh / sh); y < leny; y++) {
          this.drawImage(image, sx, sy, sw, sh, dx + x * sw, dy + y * sh, sw, sh);
        }
      }

      this.restore();

      return this;
    },

    repeatImage: function(image, x, y, w, h) {
      // if (!env.details) return this;

      if (arguments.length < 9) {

        this.repeatImageRegion(image, 0, 0, image.width, image.height, x, y, w, h);

      } else {

        this.repeatImageRegion.apply(this, arguments);

      }

      return this;
    },

    borderImageEmptyRegion: [0, 0, 0, 0],

    borderImage: function(image, x, y, w, h, t, r, b, l, fill) {

      // if (!env.details) return this;

      if (typeof t === "object") {

        var region = t.region;

        if (!region) {

          region = this.borderImageEmptyRegion;
          region[2] = image.width;
          region[3] = image.height;

        }

        if (t.outset) {

          var outset = t.outset;

          if (w > outset * 2 && h > outset * 2) {

            if (t.fill !== false) {

              this.drawImage(image,
                region[0] + outset,
                region[1] + outset, (region[2] - outset * 2), (region[3] - outset * 2),
                x + outset, y + outset,
                w - outset * 2,
                h - outset * 2
              );

            }


            /* edges */

            this.drawImage(image, region[0], region[1] + outset, outset, region[3] - 2 * outset, x, y + outset, outset, h - outset * 2);
            this.drawImage(image, region[0] + region[2] - outset, region[1] + outset, outset, region[3] - 2 * outset, x + w - outset, y + outset, outset, h - outset * 2);
            this.drawImage(image, region[0] + outset, region[1], region[2] - outset * 2, outset, x + outset, y, w - outset * 2, outset);
            this.drawImage(image, region[0] + outset, region[1] + region[3] - outset, region[2] - outset * 2, outset, x + outset, y + h - outset, w - outset * 2, outset);

            /* corners */

            this.drawImage(image, region[0], region[1], outset, outset, x, y, outset, outset);
            this.drawImage(image, region[0], region[1] + region[3] - outset, outset, outset, x, y + h - outset, outset, outset);
            this.drawImage(image, region[0] + region[2] - outset, region[1], outset, outset, x + w - outset, y, outset, outset);
            this.drawImage(image, region[0] + region[2] - outset, region[1] + region[3] - outset, outset, outset, x + w - outset, y + h - outset, outset, outset);

          }

        }

        /* complex */
        else {

          var bottomLeft = t.bottomLeft || [0, 0, 0, 0];
          var bottomRight = t.bottomRight || [0, 0, 0, 0];
          var topLeft = t.topLeft || [0, 0, 0, 0];
          var topRight = t.topRight || [0, 0, 0, 0];

          var clh = bottomLeft[3] + topLeft[3];
          var crh = bottomRight[3] + topRight[3];
          var ctw = topLeft[2] + topRight[2];
          var cbw = bottomLeft[2] + bottomRight[2];

          t.fillPadding = [0, 0, 0, 0];

          if (t.left) t.fillPadding[0] = t.left[2];
          if (t.top) t.fillPadding[1] = t.top[3];
          if (t.right) t.fillPadding[2] = t.right[2];
          if (t.bottom) t.fillPadding[3] = t.bottom[3];

          // if (!t.fillPadding) t.fillPadding = [0, 0, 0, 0];

          if (t.fill) {
            this.drawImage(image, t.fill[0], t.fill[1], t.fill[2], t.fill[3], x + t.fillPadding[0], y + t.fillPadding[1], w - t.fillPadding[2] - t.fillPadding[0], h - t.fillPadding[3] - t.fillPadding[1]);
          } else {
            // this.fillRect(x + t.fillPadding[0], y + t.fillPadding[1], w - t.fillPadding[2] - t.fillPadding[0], h - t.fillPadding[3] - t.fillPadding[1]);
          }

          /* sides */

          if (t.left) this[t.left[4] === "stretch" ? "drawImage" : "repeatImage"](image, t.left[0], t.left[1], t.left[2], t.left[3], x, y + topLeft[3], t.left[2], h - clh);
          if (t.right) this[t.right[4] === "stretch" ? "drawImage" : "repeatImage"](image, t.right[0], t.right[1], t.right[2], t.right[3], x + w - t.right[2], y + topRight[3], t.right[2], h - crh);
          if (t.top) this[t.top[4] === "stretch" ? "drawImage" : "repeatImage"](image, t.top[0], t.top[1], t.top[2], t.top[3], x + topLeft[2], y, w - ctw, t.top[3]);
          if (t.bottom) this[t.bottom[4] === "stretch" ? "drawImage" : "repeatImage"](image, t.bottom[0], t.bottom[1], t.bottom[2], t.bottom[3], x + bottomLeft[2], y + h - t.bottom[3], w - cbw, t.bottom[3]);

          /* corners */

          if (t.bottomLeft) this.drawImage(image, t.bottomLeft[0], t.bottomLeft[1], t.bottomLeft[2], t.bottomLeft[3], x, y + h - t.bottomLeft[3], t.bottomLeft[2], t.bottomLeft[3]);
          if (t.topLeft) this.drawImage(image, t.topLeft[0], t.topLeft[1], t.topLeft[2], t.topLeft[3], x, y, t.topLeft[2], t.topLeft[3]);
          if (t.topRight) this.drawImage(image, t.topRight[0], t.topRight[1], t.topRight[2], t.topRight[3], x + w - t.topRight[2], y, t.topRight[2], t.topRight[3]);
          if (t.bottomRight) this.drawImage(image, t.bottomRight[0], t.bottomRight[1], t.bottomRight[2], t.bottomRight[3], x + w - t.bottomRight[2], y + h - t.bottomRight[3], t.bottomRight[2], t.bottomRight[3]);

        }

      } else {


        /* top */
        if (t > 0 && w - l - r > 0) this.drawImage(image, l, 0, image.width - l - r, t, x + l, y, w - l - r, t);

        /* bottom */
        if (b > 0 && w - l - r > 0) this.drawImage(image, l, image.height - b, image.width - l - r, b, x + l, y + h - b, w - l - r, b);
        //      console.log(x, y, w, h, t, r, b, l);
        //      console.log(image, 0, t, l, image.height - b - t, x, y + t, l, h - b - t);
        /* left */
        if (l > 0 && h - b - t > 0) this.drawImage(image, 0, t, l, image.height - b - t, x, y + t, l, h - b - t);


        /* right */
        if (r > 0 && h - b - t > 0) this.drawImage(image, image.width - r, t, r, image.height - b - t, x + w - r, y + t, r, h - b - t);

        /* top-left */
        if (l > 0 && t > 0) this.drawImage(image, 0, 0, l, t, x, y, l, t);

        /* top-right */
        if (r > 0 && t > 0) this.drawImage(image, image.width - r, 0, r, t, x + w - r, y, r, t);

        /* bottom-right */
        if (r > 0 && b > 0) this.drawImage(image, image.width - r, image.height - b, r, b, x + w - r, y + h - b, r, b);

        /* bottom-left */
        if (l > 0 && b > 0) this.drawImage(image, 0, image.height - b, l, b, x, y + h - b, l, b);

        if (fill) {
          if (typeof fill === "string") {
            this.fillStyle(fill).fillRect(x + l, y + t, w - l - r, h - t - b);
          } else {
            if (w - l - r > 0 && h - t - b > 0)
              this.drawImage(image, l, t, image.width - r - l, image.height - b - t, x + l, y + t, w - l - r, h - t - b);
          }
        }
      }
    },

    setPixel: function(color, x, y) {

      /* fillRect is slow! */

      return this.fillStyle(color).fillRect(x, y, 1, 1);

      /* this is how it should work - but it does not */

      color = cq.color(color);

      var pixel = this.createImageData(1, 1);

      pixel.data[0] = color[0];
      pixel.data[1] = color[1];
      pixel.data[2] = color[2];
      pixel.data[3] = 255;

      this.putImageData(pixel, x, y);

      return this;
    },

    getPixel: function(x, y) {

      var pixel = this.context.getImageData(x, y, 1, 1).data;

      return cq.color([pixel[0], pixel[1], pixel[2], pixel[3]]);

    },

    clearRect: function(x, y, w, h) {

      this.context.clearRect(x, y, w, h);

      return this;

    },

    fill: function() {

      this.context.fill();

      return this;

    },

    stroke: function() {

      this.context.stroke();

      return this;

    },

    createImageData: function(width, height) {

      if (false && this.context.createImageData) {

        return this.context.createImageData.apply(this.context, arguments);

      } else {

        if (!this.emptyCanvas) {

          this.emptyCanvas = cq.createCanvas(width, height);
          this.emptyCanvasContext = this.emptyCanvas.getContext("2d");

        }

        this.emptyCanvas.width = width;
        this.emptyCanvas.height = height;

        return this.emptyCanvasContext.getImageData(0, 0, width, height);
      }

    },

    strokeLine: function(x1, y1, x2, y2) {

      this.beginPath();

      if (typeof x2 === "undefined") {
        this.moveTo(x1.x, x1.y);
        this.lineTo(y1.x, y1.y);
      } else {
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
      }

      this.stroke();

      return this;

    },

    shadowOffset: function(x, y) {

      this.context.shadowOffsetX = x;
      this.context.shadowOffsetY = y;

      return this;

    },

    noLineDash: [],
    tempLineDash: [2, 2],

    setLineDash: function(dash) {

      if (typeof dash === "number") {

        this.tempLineDash[0] = dash;
        this.tempLineDash[1] = dash;

        dash = this.tempLineDash;

      }

      this.context.setLineDash(dash ? dash : this.noLineDash);

      return this;

    },

    measureText: function(text) {

      return this.context.measureText(text);

    },

    getLineDash: function() {

      return this.context.getLineDash();

    },

    createRadialGradient: function(x0, y0, r0, x1, y1, r1) {

      return this.context.createRadialGradient(x0, y0, r0, x1, y1, r1);

    },

    createLinearGradient: function(x0, y0, x1, y1) {

      return this.context.createLinearGradient(x0, y0, x1, y1);

    },

    createPattern: function(image, repeat) {

      return this.context.createPattern(image, repeat);

    },

    getImageData: function(sx, sy, sw, sh) {

      return this.context.getImageData(sx, sy, sw, sh);

    },

    /* If you think that I am retarded because I use fillRect to set
       pixels - read about premultipled alpha in canvas */

    writeMeta: function(data) {

      var json = JSON.stringify(data);

      json = encodeURIComponent(json);

      var bytes = [];

      for (var i = 0; i < json.length; i++) {
        bytes.push(json.charCodeAt(i));
        //      console.log(json[i])
      }

      bytes.push(127);

      var x = this.width - 1;
      var y = this.height - 1;

      var pixel = [];

      while (bytes.length) {

        var byte = bytes.shift();

        pixel.unshift(byte * 2);
        //        console.log(x + String.fromCharCode(byte), byte);

        if (!bytes.length)
          for (var i = 0; i < 3 - pixel.length; i++) pixel.unshift(254);

        if (pixel.length === 3) {
          this.fillStyle(cq.color(pixel).toRgb()).fillRect(x, y, 1, 1);
          pixel = [];
          x--;

          if (x < 0) {
            y--;
            x = this.width - 1;
          }
        }
      }

      return this;

    },

    /* setters / getters */

    strokeStyle: function(style) {

      if (style == null) {

        return this.context.strokeStyle;

      } else {

        this.context.strokeStyle = style;

        return this;

      }

    },

    fillStyle: function(style) {

      if (style == null) {

        return this.context.fillStyle;

      } else {

        this.context.fillStyle = style;

        return this;

      }

    },

    font: function(font) {

      if (font == null) {

        return this.context.font;

      } else {

        this.context.font = font;

        return this;
      }

    },

    filter: function(filter) {

      if (filter) {

        this.context.filter = filter;

        return this;

      } else {

        return this.context.filter;

      }

      return this;

    },

    readMeta: function() {

      var bytes = [];

      var x = this.width - 1;
      var y = this.height - 1;

      while (true) {
        var pixel = this.getPixel(x, y);

        var stop = false;

        for (var i = 0; i < 3; i++) {

          if (pixel[2 - i] === 254) stop = true;

          else bytes.push(pixel[2 - i] / 2 | 0);

        }

        if (stop) break;

        x--;

        if (x < 0) {
          y--;
          x = this.width - 1;
          break;
        }
      }


      var json = "";

      while (bytes.length) {
        json += String.fromCharCode(bytes.shift());
      }

      var data = false;

      console.log(json);

      try {
        data = JSON.parse(decodeURIComponent(json));
      } catch (e) {

      }

      return data;

    },

    get width() {

      return this.canvas.width;

    },

    get height() {

      return this.canvas.height;

    },

    set width(w) {

      this.canvas.width = w;
      this.update();

      return this.canvas.width;

    },

    set height(h) {

      this.canvas.height = h;
      this.update();

      return this.canvas.height;

    }


  };

  /* extend Layer with drawing context methods */

  var methods = ["arc", "arcTo", "beginPath", "bezierCurveTo", "clip", "closePath", "createLinearGradient", "createRadialGradient", "createPattern", "drawFocusRing", "drawImage", "fill", "fillRect", "fillText", "getImageData", "isPointInPath", "lineTo", "measureText", "moveTo", "putImageData", "quadraticCurveTo", "rect", "restore", "rotate", "scale", "setTransform", "strokeRect", "strokeText", "transform", "translate", "setLineDash"];

  for (var i = 0; i < methods.length; i++) {

    var name = methods[i];

    if (cq.Layer.prototype[name]) continue;

    cq.Layer.prototype[name] = (function(method) {

      return function() {

        var args = new Array(arguments.length);

        for (var i = 0; i < args.length; ++i) {

          args[i] = arguments[i];

        }

        cq.fastApply(method, this.context, args);

        return this;
      }

    })(CanvasRenderingContext2D.prototype[name]);


    continue;


    if (!this.debug) {
      // if (!cq.Layer.prototype[name]) cq.Layer.prototype[name] = Function("this.context." + name + ".apply(this.context, arguments); return this;");

      var self = this;

      (function(name) {

        cq.Layer.prototype[name] = function() {
          // this.context[name].apply(this.context, arguments);

          cq.fastApply(this.context[name], this.context, arguments);

          return this;
        }

      })(name);

    } else {

      var self = this;

      (function(name) {

        cq.Layer.prototype[name] = function() {
          try {
            this.context[name].apply(this.context, arguments);
            return this;
          } catch (e) {
            var err = new Error();
            console.log(err.stack);
            throw (e + err.stack);

            console.log(e, name, arguments);
          }
        }

      })(name);

    }

  };

  /* create setters and getters */

  var properties = ["globalAlpha", "globalCompositeOperation", "lineCap", "lineJoin", "lineWidth", "miterLimit", "shadowOffsetX", "shadowOffsetY", "shadowBlur", "shadowColor", "textAlign", "textBaseline", "lineDashOffset"];

  for (var i = 0; i < properties.length; i++) {

    var name = properties[i];

    if (!cq.Layer.prototype[name]) cq.Layer.prototype[name] = Function("if(arguments.length) { this.context." + name + " = arguments[0]; return this; } else { return this.context." + name + "; }");

  };

  /* color */

  cq.Color = function(data, type) {

    if (arguments.length) this.parse(data, type);
  }

  cq.Color.prototype = {

    toString: function() {
      return this.toRgb();
    },

    parse: function(args, type) {
      if (args[0] instanceof cq.Color) {
        this[0] = args[0][0];
        this[1] = args[0][1];
        this[2] = args[0][2];
        this[3] = args[0][3];
        return;
      }

      if (typeof args === "string") {
        var match = null;

        if (args[0] === "#") {
          var rgb = cq.hexToRgb(args);
          this[0] = rgb[0];
          this[1] = rgb[1];
          this[2] = rgb[2];
          this[3] = 1.0;
        } else if (match = args.match(/rgb\((.*),(.*),(.*)\)/)) {
          this[0] = match[1] | 0;
          this[1] = match[2] | 0;
          this[2] = match[3] | 0;
          this[3] = 1.0;
        } else if (match = args.match(/rgba\((.*),(.*),(.*)\)/)) {
          this[0] = match[1] | 0;
          this[1] = match[2] | 0;
          this[2] = match[3] | 0;
          this[3] = match[4] | 0;
        } else if (match = args.match(/hsl\((.*),(.*),(.*)\)/)) {
          this.fromHsl(match[1], match[2], match[3]);
        } else if (match = args.match(/hsv\((.*),(.*),(.*)\)/)) {
          this.fromHsv(match[1], match[2], match[3]);
        }
      } else {
        switch (type) {
          case "hsl":
          case "hsla":

            this.fromHsl(args[0], args[1], args[2], args[3]);
            break;

          case "hsv":
          case "hsva":

            this.fromHsv(args[0], args[1], args[2], args[3]);
            break;

          default:
            this[0] = args[0];
            this[1] = args[1];
            this[2] = args[2];
            this[3] = typeof args[3] === "undefined" ? 1.0 : args[3];
            break;
        }
      }
    },

    a: function(a) {

      if (arguments.length === 1) {

        this[3] = a;

      } else {

        return this[3];

      }

      return this;

    },

    alpha: function(a) {

      if (arguments.length === 1) {

        this[3] = a;

      } else {

        return this[3];

      }

      return this;

    },

    fromHsl: function() {
      var components = arguments[0] instanceof Array ? arguments[0] : arguments;

      var color = cq.hslToRgb(parseFloat(components[0]), parseFloat(components[1]), parseFloat(components[2]));

      this[0] = color[0];
      this[1] = color[1];
      this[2] = color[2];
      this[3] = typeof arguments[3] === "undefined" ? 1.0 : arguments[3];
    },

    fromHsv: function() {
      var components = arguments[0] instanceof Array ? arguments[0] : arguments;
      var color = cq.hsvToRgb(parseFloat(components[0]), parseFloat(components[1]), parseFloat(components[2]));

      this[0] = color[0];
      this[1] = color[1];
      this[2] = color[2];
      this[3] = typeof arguments[3] === "undefined" ? 1.0 : arguments[3];
    },

    toArray: function() {
      return [this[0], this[1], this[2], this[3]];
    },

    toRgb: function() {
      return "rgb(" + this[0] + ", " + this[1] + ", " + this[2] + ")";
    },

    toRgba: function() {
      return "rgba(" + this[0] + ", " + this[1] + ", " + this[2] + ", " + this[3] + ")";
    },

    toHex: function() {
      return cq.rgbToHex(this[0], this[1], this[2]);
    },

    toHsl: function() {
      var c = cq.rgbToHsl(this[0], this[1], this[2]);
      c[3] = this[3];
      return c;
    },

    toHsv: function() {
      var c = cq.rgbToHsv(this[0], this[1], this[2]);
      c[3] = this[3];
      return c;
    },

    gradient: function(target, steps) {
      var targetColor = cq.color(target);
    },

    shiftHsl: function() {
      var hsl = this.toHsl();

      if (this[0] !== this[1] || this[1] !== this[2]) {
        var h = arguments[0] === false ? hsl[0] : cq.wrapValue(hsl[0] + arguments[0], 0, 1);
        var s = arguments[1] === false ? hsl[1] : cq.limitValue(hsl[1] + arguments[1], 0, 1);
      } else {
        var h = hsl[0];
        var s = hsl[1];
      }

      var l = arguments[2] === false ? hsl[2] : cq.limitValue(hsl[2] + arguments[2], 0, 1);

      this.fromHsl(h, s, l);

      return this;
    },

    setHsl: function() {
      var hsl = this.toHsl();

      var h = arguments[0] === false ? hsl[0] : cq.limitValue(arguments[0], 0, 1);
      var s = arguments[1] === false ? hsl[1] : cq.limitValue(arguments[1], 0, 1);
      var l = arguments[2] === false ? hsl[2] : cq.limitValue(arguments[2], 0, 1);

      this.fromHsl(h, s, l);

      return this;
    },

    mix: function(color, amount) {

      color = cq.color(color);

      for (var i = 0; i < 4; i++) {

        this[i] = cq.mix(this[i], color[i], amount);

      }

      return this;

    }

  };

  /* Utilities / Framework */

  cq.images = {};

  cq.loadImages = function() {

    var promises = [];

    for (var i = 0; i < arguments.length; i++) {

      var current = arguments[i];
      var keys;

      keys = current;

      for (var key in keys) {

        cq.loaderscount++;

        var path = keys[key];

        var image = new orgImage();

        cq.images[key] = image;
        cq.loaderscount++;

        var promise = new Promise(function(resolve, reject) {

          image.addEventListener("load", function() {

            // cq.loadercallback();

            resolve();

          });

          image.addEventListener("error", function() {

            throw ("unable to load " + this.src);

          });

        });

        image.src = path;

      }

      promises.push(promise);

    }

    return Promise.all(promises);

  };

  cq.fn = cq.Layer.prototype;

  window["cq"] = window["CanvasQuery"] = cq;

  return cq;

})();