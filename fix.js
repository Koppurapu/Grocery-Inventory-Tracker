const fs = require('fs');
let c = fs.readFileSync('backend/server.cjs', 'utf8');

// Fix items filter - add $ before param number placeholders
c = c.replace(
  /query \+= `( AND category = )\${params\.length}`/,
  "query += ' AND category = $' + params.length"
);
c = c.replace(
  /query \+= `( AND status = )\${params\.length}`(;[\s\n]+if \(search\))/,
  "query += ' AND status = $' + params.length$2"
);
c = c.replace(
  /query \+= `( AND \(name ILIKE )\${params\.length}( OR sku ILIKE )\${params\.length}\)`/,
  "query += ' AND (name ILIKE $' + params.length + ' OR sku ILIKE $' + params.length + ')'"
);

// Fix orders filter
c = c.replace(
  /query \+= `( AND status = )\${params\.length}`(;[\s\n]+if \(customer\))/,
  "query += ' AND status = $' + params.length$2"
);
c = c.replace(
  /query \+= `( AND customer ILIKE )\${params\.length}`/,
  "query += ' AND customer ILIKE $' + params.length"
);

fs.writeFileSync('backend/server.cjs', c);
console.log('Fixed server.cjs');
