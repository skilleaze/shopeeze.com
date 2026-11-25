/* @ds-bundle: {"format":4,"namespace":"ShopeizDesignSystem_fece22","components":[{"name":"Wordmark","sourcePath":"components/brand/Logo.jsx"},{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"Monogram","sourcePath":"components/brand/Monogram.jsx"},{"name":"ProductCard","sourcePath":"components/commerce/ProductCard.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"ICON_NAMES","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Price","sourcePath":"components/core/Price.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"ICONS","sourcePath":"components/core/icon-data.js"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"QuantityStepper","sourcePath":"components/forms/QuantityStepper.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/Radio.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"SectionHeader","sourcePath":"components/layout/SectionHeader.jsx"},{"name":"Breadcrumbs","sourcePath":"components/navigation/Breadcrumbs.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/brand/Logo.jsx":"b5e98f08b328","components/brand/Monogram.jsx":"b36ad6ca3c3a","components/commerce/ProductCard.jsx":"d0056a1915e5","components/core/Badge.jsx":"8d521aecc144","components/core/Button.jsx":"8b8f3b81c57c","components/core/Icon.jsx":"344f5928d888","components/core/IconButton.jsx":"69a0190e6c5b","components/core/Price.jsx":"bdbc457f6c17","components/core/Tag.jsx":"87fb1c656db5","components/core/icon-data.js":"7696ae15c8bf","components/feedback/Dialog.jsx":"0ac56959cbb1","components/feedback/Toast.jsx":"61f4771b09db","components/feedback/Tooltip.jsx":"d3db893483d1","components/forms/Checkbox.jsx":"29d8c17f378d","components/forms/Field.jsx":"cf5ae749bd5b","components/forms/Input.jsx":"e3a1e52e2f05","components/forms/QuantityStepper.jsx":"bc99453543b5","components/forms/Radio.jsx":"4a1212ba7286","components/forms/Select.jsx":"08c474247c54","components/forms/Switch.jsx":"ac8d7804ab69","components/layout/SectionHeader.jsx":"966584f5c7af","components/navigation/Breadcrumbs.jsx":"ce51712056da","components/navigation/Tabs.jsx":"ed129bddc56a","ui_kits/storefront/App.jsx":"fe611e9145ab","ui_kits/storefront/CartScreen.jsx":"e3d0e06611e6","ui_kits/storefront/CategoryScreen.jsx":"3e9040cd0f3f","ui_kits/storefront/CheckoutScreen.jsx":"c685bcd983ad","ui_kits/storefront/Footer.jsx":"a47e8f4523df","ui_kits/storefront/Header.jsx":"9deef73b0e2a","ui_kits/storefront/HomeScreen.jsx":"310e1f41a9cb","ui_kits/storefront/ProductScreen.jsx":"c4d31c9c806b","ui_kits/storefront/data.js":"a2f483c88bbb"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ShopeizDesignSystem_fece22 = window.ShopeizDesignSystem_fece22 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Monogram.jsx
try { (() => {
const D = 'M44.15 0L161.89 0L206.04 44.15L206.04 235.47L0 235.47L0 44.15ZM95.66 22.07h14.72v14.72h-14.72ZM29.44 58.87L176.61 58.87L176.61 88.3L58.87 88.3L58.87 117.74L176.61 117.74L176.61 206.04L29.44 206.04L29.44 176.6L147.17 176.6L147.17 147.17L29.44 147.17L29.44 58.87Z';
function Monogram({
  size = 48,
  color = 'var(--burgundy-500)',
  mirror,
  title = 'Shopeiz',
  style
}) {
  return /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 206.04 235.47",
    width: size * 206.04 / 235.47,
    height: size,
    role: "img",
    "aria-label": title,
    style: {
      display: 'block',
      flexShrink: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("path", {
    fill: color,
    fillRule: "evenodd",
    d: D,
    transform: mirror ? 'matrix(-1 0 0 1 206.04 0)' : undefined
  }));
}
Object.assign(__ds_scope, { Monogram });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Monogram.jsx", error: String((e && e.message) || e) }); }

// components/brand/Logo.jsx
try { (() => {
const TONE = {
  primary: ['var(--burgundy-500)', 'var(--white)'],
  onBlack: ['var(--burgundy-500)', 'var(--white)'],
  onBurgundy: ['var(--white)', 'var(--burgundy-500)']
};
function Wordmark({
  size = 32,
  tone = 'primary'
}) {
  const [bg, fg] = TONE[tone];
  return /*#__PURE__*/React.createElement("span", {
    "aria-label": "Shopeiz",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      background: bg,
      color: fg,
      fontFamily: 'var(--font-logo)',
      fontWeight: 900,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: '0.005em',
      textTransform: 'uppercase',
      padding: '0.06em 0.14em 0.02em',
      height: '1.04em',
      boxSizing: 'content-box',
      whiteSpace: 'nowrap',
      userSelect: 'none'
    }
  }, "SHOPEIZ");
}
function Logo({
  size = 32,
  tone = 'primary',
  lockup = 'wordmark',
  style
}) {
  const word = /*#__PURE__*/React.createElement(Wordmark, {
    size: size,
    tone: tone
  });
  if (lockup === 'wordmark') return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      ...style
    }
  }, word);
  const mColor = tone === 'onBurgundy' ? 'var(--white)' : 'var(--burgundy-500)';
  const mH = size * 1.13;
  if (lockup === 'stacked') return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: size * 0.1,
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Monogram, {
    size: size * 1.55,
    color: mColor
  }), word);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: size * 0.3,
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Monogram, {
    size: mH,
    color: mColor
  }), word);
}
Object.assign(__ds_scope, { Wordmark, Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function Badge({
  children,
  tone = 'accent',
  style
}) {
  const t = {
    accent: ['var(--burgundy-500)', 'var(--white)'],
    dark: ['var(--black)', 'var(--white)'],
    light: ['var(--gray-100)', 'var(--ink)']
  }[tone];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 20,
      height: 20,
      padding: '0 6px',
      boxSizing: 'border-box',
      background: t[0],
      color: t[1],
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1,
      fontVariantNumeric: 'tabular-nums',
      borderRadius: 0,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Price.jsx
try { (() => {
const SIZES = {
  sm: [16, 12],
  md: [24, 13],
  lg: [32, 15],
  xl: [48, 18]
};
const fmt = (n, d) => Number(n).toLocaleString('en-US', {
  minimumFractionDigits: d,
  maximumFractionDigits: d
});
function Price({
  amount,
  was,
  currency = 'AED',
  size = 'md',
  decimals = 0,
  accent,
  style
}) {
  const [fs, ws] = SIZES[size];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: 8,
      fontFamily: 'var(--font-sans)',
      fontVariantNumeric: 'tabular-nums',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: fs,
      fontWeight: 800,
      letterSpacing: 'var(--ls-tight)',
      lineHeight: 1,
      color: accent ? 'var(--burgundy-500)' : 'var(--text-strong)'
    }
  }, currency, " ", fmt(amount, decimals)), was != null ? /*#__PURE__*/React.createElement("s", {
    style: {
      fontSize: ws,
      fontWeight: 400,
      color: 'var(--text-muted)'
    }
  }, currency, " ", fmt(was, decimals)) : null);
}
Object.assign(__ds_scope, { Price });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Price.jsx", error: String((e && e.message) || e) }); }

// components/core/icon-data.js
try { (() => {
const ICONS = {
  "arrow-left": [["path", {
    "d": "m12 19-7-7 7-7"
  }], ["path", {
    "d": "M19 12H5"
  }], ["metadata", {}], ["c2pa", {}]],
  "arrow-right": [["path", {
    "d": "M5 12h14"
  }], ["path", {
    "d": "m12 5 7 7-7 7"
  }], ["metadata", {}], ["c2pa", {}]],
  "bell": [["path", {
    "d": "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
  }], ["path", {
    "d": "M10.3 21a1.94 1.94 0 0 0 3.4 0"
  }], ["metadata", {}], ["c2pa", {}]],
  "check": [["path", {
    "d": "M20 6 9 17l-5-5"
  }], ["metadata", {}], ["c2pa", {}]],
  "chevron-down": [["path", {
    "d": "m6 9 6 6 6-6"
  }], ["metadata", {}], ["c2pa", {}]],
  "chevron-left": [["path", {
    "d": "m15 18-6-6 6-6"
  }], ["metadata", {}], ["c2pa", {}]],
  "chevron-right": [["path", {
    "d": "m9 18 6-6-6-6"
  }], ["metadata", {}], ["c2pa", {}]],
  "circle-alert": [["circle", {
    "cx": "12",
    "cy": "12",
    "r": "10"
  }], ["line", {
    "x1": "12",
    "x2": "12",
    "y1": "8",
    "y2": "12"
  }], ["line", {
    "x1": "12",
    "x2": "12.01",
    "y1": "16",
    "y2": "16"
  }], ["metadata", {}], ["c2pa", {}]],
  "circle-check": [["circle", {
    "cx": "12",
    "cy": "12",
    "r": "10"
  }], ["path", {
    "d": "m9 12 2 2 4-4"
  }], ["metadata", {}], ["c2pa", {}]],
  "clock": [["circle", {
    "cx": "12",
    "cy": "12",
    "r": "10"
  }], ["polyline", {
    "points": "12 6 12 12 16 14"
  }], ["metadata", {}], ["c2pa", {}]],
  "credit-card": [["rect", {
    "width": "20",
    "height": "14",
    "x": "2",
    "y": "5",
    "rx": "2"
  }], ["line", {
    "x1": "2",
    "x2": "22",
    "y1": "10",
    "y2": "10"
  }], ["metadata", {}], ["c2pa", {}]],
  "eye": [["path", {
    "d": "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
  }], ["circle", {
    "cx": "12",
    "cy": "12",
    "r": "3"
  }], ["metadata", {}], ["c2pa", {}]],
  "grid-2x2": [["rect", {
    "width": "18",
    "height": "18",
    "x": "3",
    "y": "3",
    "rx": "2"
  }], ["path", {
    "d": "M3 12h18"
  }], ["path", {
    "d": "M12 3v18"
  }], ["metadata", {}], ["c2pa", {}]],
  "headphones": [["path", {
    "d": "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"
  }], ["metadata", {}], ["c2pa", {}]],
  "heart": [["path", {
    "d": "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
  }], ["metadata", {}], ["c2pa", {}]],
  "house": [["path", {
    "d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
  }], ["path", {
    "d": "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
  }], ["metadata", {}], ["c2pa", {}]],
  "info": [["circle", {
    "cx": "12",
    "cy": "12",
    "r": "10"
  }], ["path", {
    "d": "M12 16v-4"
  }], ["path", {
    "d": "M12 8h.01"
  }], ["metadata", {}], ["c2pa", {}]],
  "laptop": [["path", {
    "d": "M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"
  }], ["metadata", {}], ["c2pa", {}]],
  "list": [["path", {
    "d": "M3 12h.01"
  }], ["path", {
    "d": "M3 18h.01"
  }], ["path", {
    "d": "M3 6h.01"
  }], ["path", {
    "d": "M8 12h13"
  }], ["path", {
    "d": "M8 18h13"
  }], ["path", {
    "d": "M8 6h13"
  }], ["metadata", {}], ["c2pa", {}]],
  "lock": [["rect", {
    "width": "18",
    "height": "11",
    "x": "3",
    "y": "11",
    "rx": "2",
    "ry": "2"
  }], ["path", {
    "d": "M7 11V7a5 5 0 0 1 10 0v4"
  }], ["metadata", {}], ["c2pa", {}]],
  "log-out": [["path", {
    "d": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
  }], ["polyline", {
    "points": "16 17 21 12 16 7"
  }], ["line", {
    "x1": "21",
    "x2": "9",
    "y1": "12",
    "y2": "12"
  }], ["metadata", {}], ["c2pa", {}]],
  "mail": [["rect", {
    "width": "20",
    "height": "16",
    "x": "2",
    "y": "4",
    "rx": "2"
  }], ["path", {
    "d": "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
  }], ["metadata", {}], ["c2pa", {}]],
  "map-pin": [["path", {
    "d": "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
  }], ["circle", {
    "cx": "12",
    "cy": "10",
    "r": "3"
  }], ["metadata", {}], ["c2pa", {}]],
  "menu": [["line", {
    "x1": "4",
    "x2": "20",
    "y1": "12",
    "y2": "12"
  }], ["line", {
    "x1": "4",
    "x2": "20",
    "y1": "6",
    "y2": "6"
  }], ["line", {
    "x1": "4",
    "x2": "20",
    "y1": "18",
    "y2": "18"
  }], ["metadata", {}], ["c2pa", {}]],
  "minus": [["path", {
    "d": "M5 12h14"
  }], ["metadata", {}], ["c2pa", {}]],
  "package": [["path", {
    "d": "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
  }], ["path", {
    "d": "M12 22V12"
  }], ["path", {
    "d": "m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"
  }], ["path", {
    "d": "m7.5 4.27 9 5.15"
  }], ["metadata", {}], ["c2pa", {}]],
  "plus": [["path", {
    "d": "M5 12h14"
  }], ["path", {
    "d": "M12 5v14"
  }], ["metadata", {}], ["c2pa", {}]],
  "rotate-ccw": [["path", {
    "d": "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
  }], ["path", {
    "d": "M3 3v5h5"
  }], ["metadata", {}], ["c2pa", {}]],
  "search": [["circle", {
    "cx": "11",
    "cy": "11",
    "r": "8"
  }], ["path", {
    "d": "m21 21-4.3-4.3"
  }], ["metadata", {}], ["c2pa", {}]],
  "shield-check": [["path", {
    "d": "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
  }], ["path", {
    "d": "m9 12 2 2 4-4"
  }], ["metadata", {}], ["c2pa", {}]],
  "shirt": [["path", {
    "d": "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"
  }], ["metadata", {}], ["c2pa", {}]],
  "shopping-basket": [["path", {
    "d": "m15 11-1 9"
  }], ["path", {
    "d": "m19 11-4-7"
  }], ["path", {
    "d": "M2 11h20"
  }], ["path", {
    "d": "m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"
  }], ["path", {
    "d": "M4.5 15.5h15"
  }], ["path", {
    "d": "m5 11 4-7"
  }], ["path", {
    "d": "m9 11 1 9"
  }], ["metadata", {}], ["c2pa", {}]],
  "shopping-cart": [["circle", {
    "cx": "8",
    "cy": "21",
    "r": "1"
  }], ["circle", {
    "cx": "19",
    "cy": "21",
    "r": "1"
  }], ["path", {
    "d": "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
  }], ["metadata", {}], ["c2pa", {}]],
  "sliders-horizontal": [["line", {
    "x1": "21",
    "x2": "14",
    "y1": "4",
    "y2": "4"
  }], ["line", {
    "x1": "10",
    "x2": "3",
    "y1": "4",
    "y2": "4"
  }], ["line", {
    "x1": "21",
    "x2": "12",
    "y1": "12",
    "y2": "12"
  }], ["line", {
    "x1": "8",
    "x2": "3",
    "y1": "12",
    "y2": "12"
  }], ["line", {
    "x1": "21",
    "x2": "16",
    "y1": "20",
    "y2": "20"
  }], ["line", {
    "x1": "12",
    "x2": "3",
    "y1": "20",
    "y2": "20"
  }], ["line", {
    "x1": "14",
    "x2": "14",
    "y1": "2",
    "y2": "6"
  }], ["line", {
    "x1": "8",
    "x2": "8",
    "y1": "10",
    "y2": "14"
  }], ["line", {
    "x1": "16",
    "x2": "16",
    "y1": "18",
    "y2": "22"
  }], ["metadata", {}], ["c2pa", {}]],
  "smartphone": [["rect", {
    "width": "14",
    "height": "20",
    "x": "5",
    "y": "2",
    "rx": "2",
    "ry": "2"
  }], ["path", {
    "d": "M12 18h.01"
  }], ["metadata", {}], ["c2pa", {}]],
  "sofa": [["path", {
    "d": "M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"
  }], ["path", {
    "d": "M2 16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"
  }], ["path", {
    "d": "M4 18v2"
  }], ["path", {
    "d": "M20 18v2"
  }], ["path", {
    "d": "M12 4v9"
  }], ["metadata", {}], ["c2pa", {}]],
  "sparkles": [["path", {
    "d": "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
  }], ["path", {
    "d": "M20 3v4"
  }], ["path", {
    "d": "M22 5h-4"
  }], ["path", {
    "d": "M4 17v2"
  }], ["path", {
    "d": "M5 18H3"
  }], ["metadata", {}], ["c2pa", {}]],
  "star": [["path", {
    "d": "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
  }], ["metadata", {}], ["c2pa", {}]],
  "store": [["path", {
    "d": "m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"
  }], ["path", {
    "d": "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"
  }], ["path", {
    "d": "M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"
  }], ["path", {
    "d": "M2 7h20"
  }], ["path", {
    "d": "M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"
  }], ["metadata", {}], ["c2pa", {}]],
  "tablet": [["rect", {
    "width": "16",
    "height": "20",
    "x": "4",
    "y": "2",
    "rx": "2",
    "ry": "2"
  }], ["line", {
    "x1": "12",
    "x2": "12.01",
    "y1": "18",
    "y2": "18"
  }], ["metadata", {}], ["c2pa", {}]],
  "tag": [["path", {
    "d": "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"
  }], ["circle", {
    "cx": "7.5",
    "cy": "7.5",
    "r": ".5",
    "fill": "currentColor"
  }], ["metadata", {}], ["c2pa", {}]],
  "trash-2": [["path", {
    "d": "M3 6h18"
  }], ["path", {
    "d": "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
  }], ["path", {
    "d": "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
  }], ["line", {
    "x1": "10",
    "x2": "10",
    "y1": "11",
    "y2": "17"
  }], ["line", {
    "x1": "14",
    "x2": "14",
    "y1": "11",
    "y2": "17"
  }], ["metadata", {}], ["c2pa", {}]],
  "truck": [["path", {
    "d": "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"
  }], ["path", {
    "d": "M15 18H9"
  }], ["path", {
    "d": "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"
  }], ["circle", {
    "cx": "17",
    "cy": "18",
    "r": "2"
  }], ["circle", {
    "cx": "7",
    "cy": "18",
    "r": "2"
  }], ["metadata", {}], ["c2pa", {}]],
  "user": [["path", {
    "d": "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
  }], ["circle", {
    "cx": "12",
    "cy": "7",
    "r": "4"
  }], ["metadata", {}], ["c2pa", {}]],
  "x": [["path", {
    "d": "M18 6 6 18"
  }], ["path", {
    "d": "m6 6 12 12"
  }], ["metadata", {}], ["c2pa", {}]]
};
Object.assign(__ds_scope, { ICONS });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/icon-data.js", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  color = 'currentColor',
  style,
  title,
  ...rest
}) {
  const els = __ds_scope.ICONS[name];
  if (!els) return null;
  return React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': title ? undefined : true,
    role: title ? 'img' : undefined,
    style: {
      display: 'block',
      flexShrink: 0,
      ...style
    },
    ...rest
  }, title ? React.createElement('title', null, title) : null, els.map(([tag, attrs], i) => React.createElement(tag, {
    key: i,
    ...attrs
  })));
}
const ICON_NAMES = Object.keys(__ds_scope.ICONS);
Object.assign(__ds_scope, { Icon, ICON_NAMES });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const H = {
  sm: 'var(--control-h-sm)',
  md: 'var(--control-h)',
  lg: 'var(--control-h-lg)'
};
const FS = {
  sm: 13,
  md: 14,
  lg: 16
};
function Button({
  variant = 'primary',
  size = 'md',
  arrow,
  iconStart,
  iconEnd,
  fullWidth,
  disabled,
  children,
  onClick,
  type = 'button',
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  const showArrow = arrow ?? variant === 'primary';
  const end = iconEnd || (showArrow ? 'arrow-right' : null);
  const base = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-6)',
    textAlign: 'left',
    boxSizing: 'border-box',
    height: H[size],
    padding: variant === 'text' ? 0 : '0 14px',
    font: 'inherit',
    fontFamily: 'var(--font-sans)',
    fontSize: FS[size],
    fontWeight: 700,
    letterSpacing: '-0.005em',
    borderRadius: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
    whiteSpace: 'nowrap'
  };
  const v = {
    primary: {
      background: disabled ? 'var(--gray-300)' : press ? 'var(--action-primary-press)' : hover ? 'var(--action-primary-hover)' : 'var(--action-primary)',
      color: disabled ? 'var(--gray-500)' : 'var(--text-on-accent)',
      border: 'none'
    },
    secondary: {
      background: press ? 'var(--gray-100)' : 'var(--white)',
      color: disabled ? 'var(--gray-400)' : 'var(--text-strong)',
      border: '1px solid ' + (disabled ? 'var(--gray-300)' : hover ? 'var(--black)' : 'var(--border-hairline)')
    },
    dark: {
      background: press ? 'var(--ink-3)' : hover ? 'var(--ink-2)' : 'var(--black)',
      color: 'var(--white)',
      border: 'none'
    },
    text: {
      background: 'transparent',
      color: disabled ? 'var(--gray-400)' : press ? 'var(--burgundy-700)' : 'var(--action-link)',
      border: 'none',
      height: 'auto',
      textDecoration: hover && !disabled ? 'underline' : 'none',
      textUnderlineOffset: 3,
      justifyContent: 'flex-start',
      gap: 6
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      ...base,
      ...v,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8
    }
  }, iconStart ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconStart,
    size: FS[size] + 4
  }) : null, children), end ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: end,
    size: FS[size] + 2,
    style: {
      transform: hover && !disabled && end === 'arrow-right' ? 'translateX(2px)' : 'none',
      transition: 'transform var(--dur) var(--ease-standard)'
    }
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 44,
  active,
  badge,
  onClick,
  disabled,
  style,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const bg = {
    ghost: hover ? 'var(--gray-100)' : 'transparent',
    outline: hover ? 'var(--gray-100)' : 'var(--white)',
    solid: hover ? 'var(--action-primary-hover)' : 'var(--action-primary)',
    dark: hover ? 'var(--ink-2)' : 'var(--black)'
  }[variant];
  const color = variant === 'solid' || variant === 'dark' ? 'var(--white)' : active ? 'var(--burgundy-500)' : 'var(--text-strong)';
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    onClick: onClick,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      background: bg,
      color,
      border: variant === 'outline' ? '1px solid var(--border-hairline)' : 'none',
      borderRadius: 0,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'background var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: Math.round(size * 0.46)
  }), badge != null && badge !== 0 ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 4,
      right: 2,
      minWidth: 18,
      height: 18,
      padding: '0 4px',
      boxSizing: 'border-box',
      background: 'var(--burgundy-500)',
      color: 'var(--white)',
      fontFamily: 'var(--font-sans)',
      fontSize: 11,
      fontWeight: 700,
      lineHeight: '18px',
      textAlign: 'center',
      fontVariantNumeric: 'tabular-nums'
    }
  }, badge) : null);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
const TONES = {
  deal: {
    background: 'var(--burgundy-100)',
    color: 'var(--burgundy-800)',
    border: '1px solid transparent'
  },
  neutral: {
    background: 'var(--gray-100)',
    color: 'var(--ink)',
    border: '1px solid transparent'
  },
  outline: {
    background: 'var(--white)',
    color: 'var(--burgundy-500)',
    border: '1px solid var(--border-hairline)'
  },
  solid: {
    background: 'var(--burgundy-500)',
    color: 'var(--white)',
    border: '1px solid transparent'
  },
  dark: {
    background: 'var(--black)',
    color: 'var(--white)',
    border: '1px solid transparent'
  }
};
function Tag({
  tone = 'neutral',
  icon,
  size = 'md',
  caps,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      boxSizing: 'border-box',
      height: size === 'sm' ? 22 : 28,
      padding: size === 'sm' ? '0 7px' : '0 10px',
      fontFamily: 'var(--font-sans)',
      fontSize: size === 'sm' ? 11 : 12,
      fontWeight: 500,
      lineHeight: 1,
      letterSpacing: caps ? 'var(--ls-label)' : 0,
      textTransform: caps ? 'uppercase' : 'none',
      whiteSpace: 'nowrap',
      borderRadius: 0,
      fontVariantNumeric: 'tabular-nums',
      ...TONES[tone],
      ...style
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'sm' ? 12 : 14
  }) : null, children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/commerce/ProductCard.jsx
try { (() => {
const {
  useState
} = React;
function ProductCard({
  category,
  title,
  price,
  was,
  delivery,
  image,
  icon = 'package',
  tag,
  onAdd,
  onOpen,
  wishlisted,
  onWishlist,
  actionLabel = 'Add to cart',
  showAction = true,
  style
}) {
  const [hover, setHover] = useState(false);
  return /*#__PURE__*/React.createElement("article", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-card)',
      fontFamily: 'var(--font-sans)',
      minWidth: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onOpen,
    style: {
      position: 'relative',
      aspectRatio: '269 / 168',
      background: 'var(--surface-media)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      cursor: onOpen ? 'pointer' : 'default'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      filter: 'grayscale(1)',
      transform: hover ? 'scale(1.02)' : 'none',
      transition: 'transform var(--dur-slow) var(--ease-standard)'
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 56,
    strokeWidth: 1.75,
    color: "var(--black)"
  }), tag ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 10,
      left: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    tone: "deal",
    size: "sm"
  }, tag)) : null, onWishlist ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Save to wishlist",
    onClick: e => {
      e.stopPropagation();
      onWishlist();
    },
    style: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      background: 'var(--white)',
      cursor: 'pointer',
      color: wishlisted ? 'var(--burgundy-500)' : 'var(--black)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "heart",
    size: 18,
    style: {
      fill: wishlisted ? 'var(--burgundy-500)' : 'none'
    }
  })) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '14px 14px 14px',
      flex: 1
    }
  }, category ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-accent)'
    }
  }, category) : null, /*#__PURE__*/React.createElement("h3", {
    onClick: onOpen,
    style: {
      margin: 0,
      fontSize: 15,
      fontWeight: 600,
      letterSpacing: '-0.005em',
      lineHeight: 1.3,
      color: 'var(--text-strong)',
      cursor: onOpen ? 'pointer' : 'default',
      textDecoration: hover && onOpen ? 'underline' : 'none',
      textUnderlineOffset: 3
    }
  }, title), /*#__PURE__*/React.createElement(__ds_scope.Price, {
    amount: price,
    was: was,
    size: "md",
    style: {
      marginTop: 2
    }
  }), delivery ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--text-secondary)'
    }
  }, delivery) : null, showAction ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    fullWidth: true,
    size: "sm",
    onClick: onAdd
  }, actionLabel)) : null));
}
Object.assign(__ds_scope, { ProductCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/commerce/ProductCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open = true,
  title,
  children,
  footer,
  onClose,
  width = 480,
  inline
}) {
  if (!open) return null;
  const panel = /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === 'string' ? title : undefined,
    style: {
      width: '100%',
      maxWidth: width,
      background: 'var(--white)',
      borderTop: '2px solid var(--black)',
      boxShadow: inline ? 'none' : 'var(--shadow-overlay)',
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      padding: '20px 20px 0 24px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      paddingTop: 8,
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: 'var(--ls-heading)',
      lineHeight: 1.15
    }
  }, title), onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "Close",
    size: 40,
    onClick: onClose
  }) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 24px 24px',
      fontSize: 15,
      lineHeight: 1.5,
      color: 'var(--text-primary)'
    }
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      padding: '16px 24px 24px',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, footer) : null);
  if (inline) return panel;
  return /*#__PURE__*/React.createElement("div", {
    onClick: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    },
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'var(--scrim)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }
  }, panel);
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function Toast({
  message,
  icon = 'circle-check',
  action,
  onAction,
  onClose,
  tone = 'dark',
  style
}) {
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minHeight: 52,
      padding: '0 8px 0 16px',
      boxSizing: 'border-box',
      maxWidth: 440,
      background: dark ? 'var(--black)' : 'var(--burgundy-500)',
      color: 'var(--white)',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 500,
      ...style
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      padding: '14px 0'
    }
  }, message), action ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--white)',
      fontFamily: 'inherit',
      fontSize: 14,
      fontWeight: 700,
      textDecoration: 'underline',
      textUnderlineOffset: 3,
      cursor: 'pointer',
      padding: '0 8px'
    }
  }, action) : null, onClose ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Dismiss",
    onClick: onClose,
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'none',
      border: 'none',
      color: 'var(--white)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16
  })) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const {
  useState
} = React;
function Tooltip({
  content,
  children,
  placement = 'top',
  open
}) {
  const [hover, setHover] = useState(false);
  const show = open ?? hover;
  const pos = placement === 'bottom' ? {
    top: 'calc(100% + 8px)'
  } : {
    bottom: 'calc(100% + 8px)'
  };
  return /*#__PURE__*/React.createElement("span", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      display: 'inline-flex'
    }
  }, children, show ? /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      left: 0,
      ...pos,
      zIndex: 50,
      background: 'var(--black)',
      color: 'var(--white)',
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
      fontWeight: 500,
      lineHeight: 1.35,
      padding: '7px 10px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none'
    }
  }, content) : null);
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
const {
  useState
} = React;
function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled,
  description
}) {
  const [inner, setInner] = useState(!!defaultChecked);
  const on = checked ?? inner;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInner(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("label", {
    onClick: e => {
      e.preventDefault();
      toggle();
    },
    style: {
      display: 'inline-flex',
      alignItems: 'flex-start',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "checkbox",
    "aria-checked": on,
    tabIndex: 0,
    onKeyDown: e => {
      if (e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    },
    style: {
      width: 20,
      height: 20,
      flexShrink: 0,
      boxSizing: 'border-box',
      marginTop: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: on ? 'var(--burgundy-500)' : 'var(--white)',
      border: '2px solid ' + (on ? 'var(--burgundy-500)' : 'var(--black)'),
      color: 'var(--white)',
      transition: 'background var(--dur-fast) var(--ease-standard)'
    }
  }, on ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14,
    strokeWidth: 3
  }) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", null, label), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, description) : null));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function Field({
  label,
  hint,
  error,
  htmlFor,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'var(--font-sans)'
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-strong)'
    }
  }, label) : null, children, error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--status-error)'
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useId
} = React;
function Input({
  label,
  hint,
  error,
  icon,
  value,
  defaultValue,
  onChange,
  placeholder,
  type = 'text',
  disabled,
  size = 'md',
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = useState(false);
  const autoId = useId();
  const fid = id || autoId;
  const border = error ? 'var(--status-error)' : focus ? 'var(--black)' : 'var(--border-hairline)';
  return /*#__PURE__*/React.createElement(__ds_scope.Field, {
    label: label,
    hint: hint,
    error: error,
    htmlFor: fid
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: size === 'lg' ? 'var(--control-h-lg)' : 'var(--control-h)',
      padding: '0 12px',
      boxSizing: 'border-box',
      background: disabled ? 'var(--gray-100)' : 'var(--white)',
      border: '1px solid ' + border,
      boxShadow: focus || error ? 'inset 0 0 0 1px ' + border : 'none',
      borderRadius: 0,
      ...style
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    color: "var(--text-secondary)"
  }) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    type: type,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      height: '100%',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: size === 'lg' ? 16 : 15,
      color: 'var(--text-primary)'
    }
  }, rest))));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/QuantityStepper.jsx
try { (() => {
function QuantityStepper({
  value = 1,
  min = 1,
  max = 99,
  onChange,
  size = 'md'
}) {
  const h = size === 'sm' ? 36 : 44;
  const btn = dis => ({
    width: h,
    height: h - 2,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    background: 'var(--white)',
    border: 'none',
    color: dis ? 'var(--gray-400)' : 'var(--text-strong)',
    cursor: dis ? 'not-allowed' : 'pointer'
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: h,
      boxSizing: 'border-box',
      border: '1px solid var(--border-hairline)',
      background: 'var(--white)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Decrease",
    disabled: value <= min,
    onClick: () => onChange && onChange(Math.max(min, value - 1)),
    style: btn(value <= min)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "minus",
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 28,
      textAlign: 'center',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 700,
      fontVariantNumeric: 'tabular-nums'
    }
  }, value), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Increase",
    disabled: value >= max,
    onClick: () => onChange && onChange(Math.min(max, value + 1)),
    style: btn(value >= max)
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "plus",
    size: 16
  })));
}
Object.assign(__ds_scope, { QuantityStepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/QuantityStepper.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function RadioGroup({
  name,
  options = [],
  value,
  onChange,
  direction = 'column'
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: 'flex',
      flexDirection: direction,
      gap: direction === 'column' ? 12 : 20
    }
  }, options.map(o => /*#__PURE__*/React.createElement(Radio, {
    key: o.value,
    name: name,
    label: o.label,
    description: o.description,
    checked: value === o.value,
    onChange: () => onChange && onChange(o.value),
    disabled: o.disabled
  })));
}
function Radio({
  label,
  description,
  checked,
  onChange,
  disabled,
  name
}) {
  return /*#__PURE__*/React.createElement("label", {
    onClick: e => {
      e.preventDefault();
      if (!disabled && onChange) onChange();
    },
    style: {
      display: 'inline-flex',
      alignItems: 'flex-start',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "radio",
    "aria-checked": !!checked,
    tabIndex: 0,
    "data-name": name,
    style: {
      width: 20,
      height: 20,
      flexShrink: 0,
      boxSizing: 'border-box',
      marginTop: 1,
      borderRadius: '50%',
      border: '2px solid ' + (checked ? 'var(--burgundy-500)' : 'var(--black)'),
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--white)'
    }
  }, checked ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: 'var(--burgundy-500)'
    }
  }) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", null, label), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, description) : null));
}
Object.assign(__ds_scope, { RadioGroup, Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
const {
  useState,
  useId
} = React;
function Select({
  label,
  hint,
  error,
  options = [],
  value,
  defaultValue,
  onChange,
  disabled,
  id,
  style
}) {
  const [focus, setFocus] = useState(false);
  const autoId = useId();
  const fid = id || autoId;
  const border = error ? 'var(--status-error)' : focus ? 'var(--black)' : 'var(--border-hairline)';
  return /*#__PURE__*/React.createElement(__ds_scope.Field, {
    label: label,
    hint: hint,
    error: error,
    htmlFor: fid
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      ...style
    }
  }, /*#__PURE__*/React.createElement("select", {
    id: fid,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      height: 'var(--control-h)',
      padding: '0 40px 0 12px',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--text-primary)',
      background: disabled ? 'var(--gray-100)' : 'var(--white)',
      border: '1px solid ' + border,
      boxShadow: focus || error ? 'inset 0 0 0 1px ' + border : 'none',
      borderRadius: 0,
      outline: 'none',
      cursor: 'pointer'
    }
  }, options.map(o => {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 18,
    style: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none'
    }
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
const {
  useState
} = React;
function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled
}) {
  const [inner, setInner] = useState(!!defaultChecked);
  const on = checked ?? inner;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInner(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("label", {
    onClick: e => {
      e.preventDefault();
      toggle();
    },
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      color: 'var(--text-primary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "switch",
    "aria-checked": on,
    tabIndex: 0,
    style: {
      position: 'relative',
      width: 40,
      height: 22,
      flexShrink: 0,
      boxSizing: 'border-box',
      background: on ? 'var(--burgundy-500)' : 'var(--gray-400)',
      transition: 'background var(--dur) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: on ? 21 : 3,
      width: 16,
      height: 16,
      background: 'var(--white)',
      transition: 'left var(--dur) var(--ease-standard)'
    }
  })), label ? /*#__PURE__*/React.createElement("span", null, label) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/layout/SectionHeader.jsx
try { (() => {
function SectionHeader({
  eyebrow,
  meta,
  title,
  children,
  tone = 'light',
  rule = true,
  style
}) {
  const dark = tone === 'dark';
  return /*#__PURE__*/React.createElement("header", {
    style: {
      fontFamily: 'var(--font-sans)',
      ...style
    }
  }, eyebrow || meta ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 16,
      paddingBottom: 10,
      borderBottom: rule ? '1px solid ' + (dark ? 'var(--ink-3)' : 'var(--gray-400)') : 'none',
      fontSize: 11,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: dark ? 'var(--text-on-dark-muted)' : 'var(--text-accent)'
    }
  }, eyebrow), meta ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: dark ? 'var(--text-on-dark-muted)' : 'var(--text-secondary)'
    }
  }, meta) : null) : null, title ? /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      marginTop: 20,
      fontSize: 'var(--fs-title)',
      fontWeight: 800,
      letterSpacing: 'var(--ls-heading)',
      lineHeight: 1.08,
      color: dark ? 'var(--white)' : 'var(--text-strong)'
    }
  }, title) : null, children ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      marginTop: 10,
      fontSize: 15,
      lineHeight: 1.5,
      color: dark ? 'var(--text-on-dark-muted)' : 'var(--text-secondary)',
      maxWidth: 560
    }
  }, children) : null);
}
Object.assign(__ds_scope, { SectionHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/SectionHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumbs.jsx
try { (() => {
function Breadcrumbs({
  items = [],
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Breadcrumb",
    style: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      color: 'var(--text-secondary)'
    }
  }, items.map((it, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, last ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-strong)',
        fontWeight: 600
      }
    }, it) : /*#__PURE__*/React.createElement("a", {
      href: "#",
      onClick: e => {
        e.preventDefault();
        onNavigate && onNavigate(i);
      },
      style: {
        color: 'inherit'
      }
    }, it), !last ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-right",
      size: 14,
      color: "var(--gray-400)"
    }) : null);
  }));
}
Object.assign(__ds_scope, { Breadcrumbs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumbs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
const {
  useState
} = React;
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  size = 'md',
  style
}) {
  const [inner, setInner] = useState(defaultValue ?? (items[0] && (items[0].value ?? items[0])));
  const cur = value ?? inner;
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: size === 'sm' ? 20 : 28,
      borderBottom: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-sans)',
      overflowX: 'auto',
      ...style
    }
  }, items.map(it => {
    const v = it.value ?? it;
    const l = it.label ?? it;
    const on = v === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      "aria-selected": on,
      type: "button",
      onClick: () => {
        if (value === undefined) setInner(v);
        onChange && onChange(v);
      },
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: size === 'sm' ? 40 : 48,
        padding: 0,
        marginBottom: -1,
        background: 'none',
        border: 'none',
        borderBottom: '2px solid ' + (on ? 'var(--burgundy-500)' : 'transparent'),
        fontFamily: 'inherit',
        fontSize: size === 'sm' ? 14 : 15,
        fontWeight: on ? 700 : 500,
        color: on ? 'var(--text-strong)' : 'var(--text-secondary)',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }
    }, l, it.count != null ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text-muted)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, it.count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/App.jsx
try { (() => {
const {
  Toast: AToast
} = window.ShopeizDesignSystem_fece22;
function App() {
  const P = window.SHOP_DATA.products;
  const [route, setRoute] = React.useState({
    name: 'home'
  });
  const [cart, setCart] = React.useState([{
    p: P[0],
    qty: 1
  }, {
    p: P[3],
    qty: 2
  }]);
  const [toast, setToast] = React.useState(null);
  const [done, setDone] = React.useState(false);
  const go = (name, params = {}) => {
    setRoute({
      name,
      ...params
    });
    setDone(false);
    window.scrollTo(0, 0);
  };
  const add = (p, qty = 1) => {
    setCart(c => {
      const f = c.find(l => l.p.id === p.id);
      return f ? c.map(l => l.p.id === p.id ? {
        ...l,
        qty: l.qty + qty
      } : l) : [...c, {
        p,
        qty
      }];
    });
    setToast(p.title);
    clearTimeout(window.__t);
    window.__t = setTimeout(() => setToast(null), 3200);
  };
  const setQty = (id, qty) => setCart(c => c.map(l => l.p.id === id ? {
    ...l,
    qty
  } : l));
  const remove = id => setCart(c => c.filter(l => l.p.id !== id));
  const count = cart.reduce((s, l) => s + l.qty, 0);
  let screen;
  if (route.name === 'category') screen = /*#__PURE__*/React.createElement(CategoryScreen, {
    key: route.cat,
    go: go,
    add: add,
    cat: route.cat
  });else if (route.name === 'product') screen = /*#__PURE__*/React.createElement(ProductScreen, {
    key: route.id,
    go: go,
    add: add,
    id: route.id
  });else if (route.name === 'cart') screen = /*#__PURE__*/React.createElement(CartScreen, {
    go: go,
    cart: cart,
    setQty: setQty,
    remove: remove
  });else if (route.name === 'checkout') screen = /*#__PURE__*/React.createElement(CheckoutScreen, {
    go: go,
    cart: cart,
    done: done,
    place: () => {
      setDone(true);
      setCart([]);
    }
  });else screen = /*#__PURE__*/React.createElement(HomeScreen, {
    go: go,
    add: add
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(StoreHeader, {
    go: go,
    cartCount: count,
    active: route.name === 'category' ? route.cat : route.name
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, screen), /*#__PURE__*/React.createElement(StoreFooter, null), toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      left: 'var(--page-margin)',
      bottom: 24,
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement(AToast, {
    message: 'Added to cart: ' + toast + '.',
    action: "View cart",
    onAction: () => {
      setToast(null);
      go('cart');
    },
    onClose: () => setToast(null)
  })) : null);
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/CartScreen.jsx
try { (() => {
const {
  QuantityStepper: KQty,
  Price: KPrice,
  Button: KBtn,
  Icon: KIcon,
  Input: KIn,
  Dialog: KDlg
} = window.ShopeizDesignSystem_fece22;
function CartScreen({
  go,
  cart,
  setQty,
  remove
}) {
  const [confirm, setConfirm] = React.useState(null);
  const sub = cart.reduce((s, l) => s + l.p.price * l.qty, 0);
  const deliv = sub >= 100 || !sub ? 0 : 15;
  if (!cart.length) return /*#__PURE__*/React.createElement("main", {
    style: {
      padding: '64px var(--page-margin) 0',
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 48,
      letterSpacing: '-0.03em'
    }
  }, "Your cart is empty."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      fontSize: 16,
      color: 'var(--ink-2)'
    }
  }, "Everything you add shows up here, with the delivery date."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(KBtn, {
    onClick: () => go('home')
  }, "Start shopping")));
  return /*#__PURE__*/React.createElement("main", {
    style: {
      padding: '32px var(--page-margin) 0'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 48,
      letterSpacing: '-0.03em'
    }
  }, "Cart"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 380px',
      gap: 48,
      marginTop: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '2px solid var(--black)'
    }
  }, cart.map(l => /*#__PURE__*/React.createElement("div", {
    key: l.p.id,
    style: {
      display: 'grid',
      gridTemplateColumns: '120px 1fr auto',
      gap: 20,
      padding: '20px 0',
      borderBottom: '1px solid var(--gray-300)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--shelf)',
      aspectRatio: '1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(KIcon, {
    name: l.p.icon,
    size: 44,
    strokeWidth: 1.5
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-accent)'
    }
  }, l.p.category), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 600
    }
  }, l.p.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--ink-2)'
    }
  }, l.p.delivery), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center',
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(KQty, {
    size: "sm",
    value: l.qty,
    onChange: q => setQty(l.p.id, q)
  }), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      setConfirm(l.p);
    },
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "Remove"))), /*#__PURE__*/React.createElement(KPrice, {
    amount: l.p.price * l.qty,
    size: "sm"
  })))), /*#__PURE__*/React.createElement("aside", {
    style: {
      background: 'var(--gray-100)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 800
    }
  }, "Order summary"), [['Subtotal', 'AED ' + sub.toLocaleString()], ['Delivery', deliv ? 'AED 15' : 'Free']].map(([a, b]) => /*#__PURE__*/React.createElement("div", {
    key: a,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 14,
      fontVariantNumeric: 'tabular-nums'
    }
  }, /*#__PURE__*/React.createElement("span", null, a), /*#__PURE__*/React.createElement("span", null, b))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingTop: 12,
      borderTop: '2px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, "Total"), /*#__PURE__*/React.createElement(KPrice, {
    amount: sub + deliv,
    size: "md"
  })), /*#__PURE__*/React.createElement(KIn, {
    placeholder: "Promo code"
  }), /*#__PURE__*/React.createElement(KBtn, {
    fullWidth: true,
    size: "lg",
    onClick: () => go('checkout')
  }, "Checkout"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--ink-2)'
    }
  }, "Free returns for 30 days."))), /*#__PURE__*/React.createElement(KDlg, {
    open: !!confirm,
    title: "Remove from cart?",
    onClose: () => setConfirm(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(KBtn, {
      variant: "dark",
      arrow: false,
      onClick: () => {
        remove(confirm.id);
        setConfirm(null);
      }
    }, "Remove"), /*#__PURE__*/React.createElement(KBtn, {
      variant: "secondary",
      onClick: () => setConfirm(null)
    }, "Keep it"))
  }, confirm ? confirm.title + ' will be removed. You can add it back any time.' : null));
}
window.CartScreen = CartScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/CartScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/CategoryScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Breadcrumbs: CBc,
  Checkbox: CCb,
  Select: CSel,
  ProductCard: CPC,
  Tag: CTag
} = window.ShopeizDesignSystem_fece22;
function CategoryScreen({
  go,
  add,
  cat
}) {
  const {
    products,
    categories
  } = window.SHOP_DATA;
  const c = categories.find(x => x.id === cat);
  const name = c ? c.label : "Today's deals";
  const [free, setFree] = React.useState(false);
  let list = cat === 'deals' ? products.filter(p => p.was) : products.filter(p => p.cat === cat);
  if (!list.length) list = products;
  if (free) list = list.filter(p => /Free/.test(p.delivery));
  const group = (t, items) => /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '2px solid var(--black)',
      paddingTop: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, t), items);
  return /*#__PURE__*/React.createElement("main", {
    style: {
      padding: '24px var(--page-margin) 0'
    }
  }, /*#__PURE__*/React.createElement(CBc, {
    items: ['Home', name],
    onNavigate: () => go('home')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 24,
      marginTop: 20,
      paddingBottom: 20,
      borderBottom: '1px solid var(--gray-300)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 48,
      letterSpacing: '-0.03em'
    }
  }, name), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 8,
      fontSize: 14,
      color: 'var(--ink-2)'
    }
  }, list.length, " results \xB7 prices include VAT")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 240
    }
  }, /*#__PURE__*/React.createElement(CSel, {
    options: ['Most relevant', 'Price: low to high', 'Price: high to low', 'Newest']
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      gap: 32,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 28
    }
  }, group('Delivery', [/*#__PURE__*/React.createElement(CCb, {
    key: "a",
    label: "Free delivery",
    checked: free,
    onChange: setFree
  }), /*#__PURE__*/React.createElement(CCb, {
    key: "b",
    label: "Arrives tomorrow"
  })]), group('Seller', [/*#__PURE__*/React.createElement(CCb, {
    key: "c",
    label: "Verified sellers only",
    defaultChecked: true,
    description: "Most items qualify"
  })]), group('Price', [/*#__PURE__*/React.createElement(CCb, {
    key: "d",
    label: "Under AED 100"
  }), /*#__PURE__*/React.createElement(CCb, {
    key: "e",
    label: "AED 100 \u2013 500"
  }), /*#__PURE__*/React.createElement(CCb, {
    key: "f",
    label: "Over AED 500"
  })])), /*#__PURE__*/React.createElement("div", null, free ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(CTag, {
    tone: "dark"
  }, "Free delivery \u2715")) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 16
    }
  }, list.map(p => /*#__PURE__*/React.createElement(CPC, _extends({
    key: p.id
  }, p, {
    onOpen: () => go('product', {
      id: p.id
    }),
    onAdd: () => add(p)
  })))))));
}
window.CategoryScreen = CategoryScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/CategoryScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/CheckoutScreen.jsx
try { (() => {
const {
  Input: XIn,
  RadioGroup: XRad,
  Button: XBtn,
  Price: XPrice,
  Switch: XSw,
  Icon: XIcon,
  Monogram: XMono
} = window.ShopeizDesignSystem_fece22;
function CheckoutScreen({
  go,
  cart,
  done,
  place
}) {
  const [pay, setPay] = React.useState('card');
  const [err, setErr] = React.useState(false);
  const sub = cart.reduce((s, l) => s + l.p.price * l.qty, 0);
  if (done) return /*#__PURE__*/React.createElement("main", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      minHeight: 520
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '64px var(--page-margin)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-accent)'
    }
  }, "Order SZ-40218"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 56,
      letterSpacing: '-0.03em',
      lineHeight: 1
    }
  }, "Arrives Thursday."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      color: 'var(--ink-2)',
      maxWidth: 420
    }
  }, "We've emailed your receipt. You'll get a text when the courier is on the way."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(XBtn, {
    onClick: () => go('home')
  }, "Keep shopping"), /*#__PURE__*/React.createElement(XBtn, {
    variant: "secondary",
    arrow: false
  }, "Track order"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--burgundy-500)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(XMono, {
    size: 200,
    color: "var(--white)"
  })));
  const step = (n, t, body) => /*#__PURE__*/React.createElement("section", {
    style: {
      borderTop: '2px solid var(--black)',
      paddingTop: 16,
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'baseline',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--text-accent)'
    }
  }, "0", n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: '-0.02em'
    }
  }, t)), body);
  return /*#__PURE__*/React.createElement("main", {
    style: {
      padding: '32px var(--page-margin) 0'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 48,
      letterSpacing: '-0.03em'
    }
  }, "Checkout"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 380px',
      gap: 48,
      marginTop: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, step(1, 'Delivery address', /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(XIn, {
    label: "Full name",
    defaultValue: "Layla Haddad"
  }), /*#__PURE__*/React.createElement(XIn, {
    label: "Mobile",
    defaultValue: "+971 50 123 4567"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement(XIn, {
    label: "Address",
    defaultValue: "Marina Gate 2, Apt 1804, Dubai Marina"
  })))), step(2, 'Payment', /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(XRad, {
    value: pay,
    onChange: setPay,
    options: [{
      value: 'card',
      label: 'Card',
      description: 'Visa ending 4242'
    }, {
      value: 'apple',
      label: 'Apple Pay'
    }, {
      value: 'cod',
      label: 'Cash on delivery',
      description: 'AED 10 fee'
    }]
  }), pay === 'card' ? /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 360
    }
  }, /*#__PURE__*/React.createElement(XIn, {
    label: "Security code",
    placeholder: "3 digits",
    error: err ? "We couldn't charge your card. Try another one?" : undefined
  })) : null, /*#__PURE__*/React.createElement(XSw, {
    label: "Send order updates by SMS",
    defaultChecked: true
  })))), /*#__PURE__*/React.createElement("aside", {
    style: {
      background: 'var(--gray-100)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 800
    }
  }, cart.length, " items"), cart.map(l => /*#__PURE__*/React.createElement("div", {
    key: l.p.id,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", null, l.qty, " \xD7 ", l.p.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap'
    }
  }, "AED ", (l.p.price * l.qty).toLocaleString()))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingTop: 12,
      borderTop: '2px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, "Total"), /*#__PURE__*/React.createElement(XPrice, {
    amount: sub
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      fontSize: 12,
      color: 'var(--ink-2)'
    }
  }, /*#__PURE__*/React.createElement(XIcon, {
    name: "truck",
    size: 16
  }), "Arrives Thursday"), /*#__PURE__*/React.createElement(XBtn, {
    fullWidth: true,
    size: "lg",
    onClick: () => {
      if (pay === 'card' && !err) {
        setErr(true);
        return;
      }
      place();
    }
  }, "Pay AED ", sub.toLocaleString()), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      fontSize: 12,
      color: 'var(--ink-2)'
    }
  }, /*#__PURE__*/React.createElement(XIcon, {
    name: "lock",
    size: 14
  }), "Secure payment"))));
}
window.CheckoutScreen = CheckoutScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/CheckoutScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/Footer.jsx
try { (() => {
const {
  Logo: FLogo
} = window.ShopeizDesignSystem_fece22;
function StoreFooter() {
  const col = (t, items) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-on-dark-muted)'
    }
  }, t), items.map(i => /*#__PURE__*/React.createElement("a", {
    key: i,
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      color: 'var(--white)',
      fontSize: 14
    }
  }, i)));
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--black)',
      color: 'var(--white)',
      padding: '56px var(--page-margin) 28px',
      marginTop: 80
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(FLogo, {
    size: 30,
    lockup: "stacked",
    tone: "onBlack"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, "The art of having everything.")), col('Shop', ['Electronics', 'Fashion', 'Home', 'Beauty', 'Groceries']), col('Help', ['Track an order', 'Returns', 'Delivery', 'Payment']), col('Shopeiz', ['About', 'Sell on Shopeiz', 'Careers', 'brand@shopeiz.com'])), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 48,
      paddingTop: 16,
      borderTop: '1px solid var(--ink-3)',
      fontSize: 12,
      color: 'var(--text-on-dark-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "shopeiz.com"), /*#__PURE__*/React.createElement("span", null, "From S to Z.")));
}
window.StoreFooter = StoreFooter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/Header.jsx
try { (() => {
const {
  Logo,
  Input,
  IconButton,
  Icon
} = window.ShopeizDesignSystem_fece22;
function StoreHeader({
  go,
  cartCount,
  active
}) {
  const cats = window.SHOP_DATA.categories;
  const link = on => ({
    fontSize: 14,
    fontWeight: on ? 700 : 500,
    color: on ? 'var(--black)' : 'var(--ink-2)',
    textDecoration: 'none',
    padding: '12px 0',
    borderBottom: '2px solid ' + (on ? 'var(--burgundy-500)' : 'transparent'),
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  });
  return /*#__PURE__*/React.createElement("header", {
    style: {
      background: 'var(--white)',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--black)',
      color: 'var(--white)',
      fontSize: 12,
      display: 'flex',
      justifyContent: 'space-between',
      gap: 16,
      padding: '8px var(--page-margin)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Free delivery over AED 100. Free returns for 30 days."), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-on-dark-muted)'
    }
  }, "Deliver to Dubai Marina")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 32,
      padding: '16px var(--page-margin)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: () => go('home'),
    style: {
      cursor: 'pointer',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    size: 30
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 640
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Search phones, sofas, shampoo\u2026"
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "user",
    label: "Account"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "heart",
    label: "Wishlist"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "shopping-cart",
    label: "Cart",
    badge: cartCount,
    active: active === 'cart',
    onClick: () => go('cart')
  }))), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 28,
      padding: '0 var(--page-margin)',
      borderBottom: '1px solid var(--gray-300)',
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("a", {
    style: {
      ...link(false),
      color: 'var(--burgundy-500)',
      fontWeight: 700
    },
    onClick: () => go('category', {
      cat: 'deals'
    })
  }, "Today's deals"), cats.map(c => /*#__PURE__*/React.createElement("a", {
    key: c.id,
    style: link(active === c.id),
    onClick: () => go('category', {
      cat: c.id
    })
  }, c.label))));
}
window.StoreHeader = StoreHeader;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/HomeScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  SectionHeader,
  ProductCard: HPC,
  Icon: HIcon,
  Monogram: HMono,
  Button: HBtn
} = window.ShopeizDesignSystem_fece22;
function HomeScreen({
  go,
  add
}) {
  const {
    products,
    categories
  } = window.SHOP_DATA;
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      minHeight: 420
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--black)',
      color: 'var(--white)',
      padding: '56px var(--page-margin)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-on-dark-muted)'
    }
  }, "Phones, fashion, home and more"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 72,
      lineHeight: 0.98,
      letterSpacing: '-0.03em',
      color: 'var(--white)'
    }
  }, "The art of", /*#__PURE__*/React.createElement("br", null), "having", /*#__PURE__*/React.createElement("br", null), "everything."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(HBtn, {
    onClick: () => go('category', {
      cat: 'deals'
    })
  }, "Shop today's deals"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--burgundy-500)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(HMono, {
    size: 180,
    color: "var(--white)"
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      borderBottom: '1px solid var(--gray-300)'
    }
  }, [['truck', 'Arrives tomorrow', 'On 2 million items'], ['rotate-ccw', 'Free returns', 'For 30 days, no questions'], ['shield-check', 'Secure checkout', 'Verified sellers only']].map(([i, t, s], k) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center',
      padding: '20px var(--page-margin)',
      borderLeft: k ? '1px solid var(--gray-300)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(HIcon, {
    name: i,
    size: 22
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-2)'
    }
  }, s))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '48px var(--page-margin) 0'
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "Today only",
    meta: "Ends at midnight",
    title: "Real deals, real prices."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: 16,
      marginTop: 24
    }
  }, products.filter(p => p.was).concat(products.slice(1, 2)).map(p => /*#__PURE__*/React.createElement(HPC, _extends({
    key: p.id
  }, p, {
    onOpen: () => go('product', {
      id: p.id
    }),
    onAdd: () => add(p)
  }))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '56px var(--page-margin) 0'
    }
  }, /*#__PURE__*/React.createElement(SectionHeader, {
    eyebrow: "Shop by category",
    title: "One search covers every category."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6,minmax(0,1fr))',
      gap: 16,
      marginTop: 24
    }
  }, categories.map(c => /*#__PURE__*/React.createElement("a", {
    key: c.id,
    onClick: () => go('category', {
      cat: c.id
    }),
    style: {
      cursor: 'pointer',
      background: 'var(--shelf)',
      aspectRatio: '1',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      color: 'var(--black)',
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(HIcon, {
    name: c.icon,
    size: 28
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 700
    }
  }, c.label))))));
}
window.HomeScreen = HomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/ProductScreen.jsx
try { (() => {
const {
  Breadcrumbs: PBc,
  Price: PPrice,
  Tag: PTag,
  Button: PBtn,
  QuantityStepper: PQty,
  Tabs: PTabs,
  RadioGroup: PRad,
  Icon: PIcon,
  IconButton: PIB
} = window.ShopeizDesignSystem_fece22;
function ProductScreen({
  go,
  add,
  id
}) {
  const p = window.SHOP_DATA.products.find(x => x.id === id) || window.SHOP_DATA.products[0];
  const [qty, setQty] = React.useState(1);
  const [ship, setShip] = React.useState('std');
  const [tab, setTab] = React.useState('details');
  const [wish, setWish] = React.useState(false);
  const row = (i, t, s) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      padding: '12px 0',
      borderTop: '1px solid var(--gray-300)'
    }
  }, /*#__PURE__*/React.createElement(PIcon, {
    name: i,
    size: 20
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-2)'
    }
  }, s)));
  return /*#__PURE__*/React.createElement("main", {
    style: {
      padding: '24px var(--page-margin) 0'
    }
  }, /*#__PURE__*/React.createElement(PBc, {
    items: ['Home', p.category.split(' · ')[0], p.category.split(' · ')[1], p.title],
    onNavigate: () => go('home')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.15fr 1fr',
      gap: 48,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--shelf)',
      aspectRatio: '1.15',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(PIcon, {
    name: p.icon,
    size: 160,
    strokeWidth: 1.5
  }), p.tag ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 16,
      left: 16
    }
  }, /*#__PURE__*/React.createElement(PTag, {
    tone: "deal"
  }, p.tag, " today")) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 12
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: i ? 'var(--gray-100)' : 'var(--shelf)',
      aspectRatio: '1',
      outline: i ? 'none' : '2px solid var(--black)',
      outlineOffset: -2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(PIcon, {
    name: p.icon,
    size: 36,
    strokeWidth: 1.5,
    color: i ? 'var(--gray-400)' : 'var(--black)'
  }))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase',
      color: 'var(--text-accent)'
    }
  }, p.category), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 16,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 34,
      letterSpacing: '-0.025em'
    }
  }, p.title), /*#__PURE__*/React.createElement(PIB, {
    icon: "heart",
    label: "Save to wishlist",
    variant: "outline",
    active: wish,
    onClick: () => setWish(!wish)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(PTag, {
    tone: "outline",
    icon: "shield-check"
  }, "Verified seller"), /*#__PURE__*/React.createElement(PTag, null, "Free returns")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(PPrice, {
    amount: p.price,
    was: p.was,
    size: "lg"
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 6,
      fontSize: 13,
      color: 'var(--ink-2)'
    }
  }, "Includes VAT. Or 4 payments of AED ", Math.ceil(p.price / 4), "."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      paddingTop: 16,
      borderTop: '2px solid var(--black)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 12
    }
  }, "Delivery"), /*#__PURE__*/React.createElement(PRad, {
    value: ship,
    onChange: setShip,
    options: [{
      value: 'std',
      label: 'Standard',
      description: 'Arrives Thursday · Free'
    }, {
      value: 'exp',
      label: 'Express',
      description: 'Arrives tomorrow · AED 15'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(PQty, {
    value: qty,
    onChange: setQty
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(PBtn, {
    fullWidth: true,
    onClick: () => add(p, qty)
  }, "Add to cart"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, row('truck', p.delivery.split(' · ')[0], 'Order in the next 3 hours 20 minutes'), row('rotate-ccw', 'Free returns for 30 days', 'Drop off or book a pickup'), row('shield-check', 'Secure payment', 'Card, Apple Pay or cash on delivery')))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 48
    }
  }, /*#__PURE__*/React.createElement(PTabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: 'details',
      label: 'Details'
    }, {
      value: 'specs',
      label: 'Specs'
    }, {
      value: 'reviews',
      label: 'Reviews',
      count: 128
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 0',
      maxWidth: 680,
      fontSize: 15,
      lineHeight: 1.55
    }
  }, tab === 'details' ? 'Thirty hours of battery, fast charging and active noise cancelling that adapts to where you are. Folds flat into the case included.' : tab === 'specs' ? 'Battery: 30 h · Charging: USB-C, 10 min = 5 h · Weight: 250 g · Bluetooth 5.3' : '4.7 out of 5 from 128 verified buyers.')));
}
window.ProductScreen = ProductScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/ProductScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/storefront/data.js
try { (() => {
window.SHOP_DATA = {
  categories: [{
    id: 'electronics',
    label: 'Electronics',
    icon: 'smartphone'
  }, {
    id: 'fashion',
    label: 'Fashion',
    icon: 'shirt'
  }, {
    id: 'home',
    label: 'Home',
    icon: 'sofa'
  }, {
    id: 'beauty',
    label: 'Beauty',
    icon: 'sparkles'
  }, {
    id: 'groceries',
    label: 'Groceries',
    icon: 'shopping-basket'
  }, {
    id: 'gadgets',
    label: 'Gadgets',
    icon: 'laptop'
  }],
  products: [{
    id: 'p1',
    cat: 'electronics',
    category: 'Electronics · Audio',
    title: 'Wireless Noise-Cancelling Headphones',
    price: 449,
    was: 599,
    tag: '−25%',
    delivery: 'Arrives tomorrow · Free returns',
    icon: 'headphones',
    seller: 'Verified seller'
  }, {
    id: 'p2',
    cat: 'electronics',
    category: 'Electronics · Phones',
    title: 'Smartphone 128 GB, Graphite',
    price: 1299,
    delivery: 'Arrives Thursday · Free delivery',
    icon: 'smartphone'
  }, {
    id: 'p3',
    cat: 'gadgets',
    category: 'Gadgets · Tablets',
    title: '11-inch Tablet with Keyboard Case',
    price: 1849,
    was: 2099,
    tag: '−12%',
    delivery: 'Arrives Thursday',
    icon: 'tablet'
  }, {
    id: 'p4',
    cat: 'fashion',
    category: 'Fashion · Men',
    title: 'Heavyweight Cotton T-Shirt',
    price: 59,
    delivery: 'Arrives tomorrow',
    icon: 'shirt'
  }, {
    id: 'p5',
    cat: 'home',
    category: 'Home · Living',
    title: 'Three-Seat Linen Sofa',
    price: 2899,
    delivery: 'Arrives in 5 days · Free delivery',
    icon: 'sofa'
  }, {
    id: 'p6',
    cat: 'gadgets',
    category: 'Gadgets · Laptops',
    title: '14-inch Laptop, 16 GB RAM',
    price: 3499,
    was: 3999,
    tag: '−13%',
    delivery: 'Arrives Friday · Free returns',
    icon: 'laptop'
  }, {
    id: 'p7',
    cat: 'beauty',
    category: 'Beauty · Skincare',
    title: 'Daily Moisturiser SPF 30, 50 ml',
    price: 89,
    delivery: 'Arrives tomorrow',
    icon: 'sparkles'
  }, {
    id: 'p8',
    cat: 'groceries',
    category: 'Groceries · Pantry',
    title: 'Weekly Pantry Box',
    price: 145,
    delivery: 'Arrives today by 9pm',
    icon: 'shopping-basket'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/storefront/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Monogram = __ds_scope.Monogram;

__ds_ns.ProductCard = __ds_scope.ProductCard;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Price = __ds_scope.Price;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.ICONS = __ds_scope.ICONS;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.QuantityStepper = __ds_scope.QuantityStepper;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.SectionHeader = __ds_scope.SectionHeader;

__ds_ns.Breadcrumbs = __ds_scope.Breadcrumbs;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
