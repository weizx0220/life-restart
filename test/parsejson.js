let s = '';
process.stdin.on('data', d => s += d).on('end', () => {
  try {
    const j = JSON.parse(s);
    if (j.login) console.log('USER:' + j.login);
    else if (j.full_name) console.log('REPO:' + j.full_name);
    else if (j.message) console.log('MSG:' + j.message + (j.errors ? ' ' + JSON.stringify(j.errors) : ''));
    else console.log('RAW:' + s.slice(0, 120));
  } catch (e) { console.log('RAW:' + s.slice(0, 120)); }
});
