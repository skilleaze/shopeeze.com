/* Public connection details for the Shopeiz database (safe to publish: the key is the publishable one,
   and row-level security decides what it can read or write). Empty = the site runs on our own stock only. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SZ = Object.assign(root.SZ || {}, { CFG: factory() });
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    url: 'https://scgklhbkoezjecumzkgz.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ2tsaGJrb2V6amVjdW16a2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2MDgwMDksImV4cCI6MjExMTE4NDAwOX0.hTE0e64E3us24mNVOnpaV-NPaZ6Z4AqOLmW-qnIDtmY',
  };
});
