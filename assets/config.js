/* Public connection details for the Shopeiz database (safe to publish: the key is the publishable one,
   and row-level security decides what it can read or write). Empty = the site runs on our own stock only. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SZ = Object.assign(root.SZ || {}, { CFG: factory() });
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    url: '',
    key: '',
  };
});
