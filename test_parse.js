const code = 'const html = \\'<button onclick="window.approveTxn(\\\\\\'\\'+t.id+\\'\\\\\\')">\\';';
try {
  new Function(code);
  console.log('SUCCESS');
} catch (e) {
  console.log('ERROR:', e.message);
}
