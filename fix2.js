const fs = require('fs');
let c = fs.readFileSync('backend/server.cjs', 'utf8');

// The broken lines use template literals without $ prefix on param placeholders
// We need to replace them with string concatenation that adds the $ prefix

// Fix items filter block
const brokenItemsFilter = [
  "    if (category) { params.push(category); query += ` AND category = ${params.length}`; }",
  "    if (status) { params.push(status); query += ` AND status = ${params.length}`; }",
  "    if (search) { params.push(`%${search}%`); query += ` AND (name ILIKE ${params.length} OR sku ILIKE ${params.length})`; }"
].join('\n');

const fixedItemsFilter = [
  "    if (category) { params.push(category); query += ' AND category = $' + params.length; }",
  "    if (status) { params.push(status); query += ' AND status = $' + params.length; }",
  "    if (search) { params.push(`%${search}%`); query += ' AND (name ILIKE $' + params.length + ' OR sku ILIKE $' + params.length + ')'; }"
].join('\n');

// Fix orders filter block
const brokenOrdersFilter = [
  "    if (status) { params.push(status); query += ` AND status = ${params.length}`; }",
  "    if (customer) { params.push(`%${customer}%`); query += ` AND customer ILIKE ${params.length}`; }"
].join('\n');

const fixedOrdersFilter = [
  "    if (status) { params.push(status); query += ' AND status = $' + params.length; }",
  "    if (customer) { params.push(`%${customer}%`); query += ' AND customer ILIKE $' + params.length; }"
].join('\n');

if (c.includes(brokenItemsFilter)) {
  c = c.replace(brokenItemsFilter, fixedItemsFilter);
  console.log('Fixed items filter');
} else {
  console.log('Items filter pattern not found - may already be fixed or different format');
}

if (c.includes(brokenOrdersFilter)) {
  c = c.replace(brokenOrdersFilter, fixedOrdersFilter);
  console.log('Fixed orders filter');
} else {
  console.log('Orders filter pattern not found - may already be fixed or different format');
}

fs.writeFileSync('backend/server.cjs', c);
console.log('Done');
