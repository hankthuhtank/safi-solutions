/* Curriculum part 3 — networking, servers, data, security, workflow, shipping */
(function (W) {
  W.CURRICULUM = W.CURRICULUM || { modules: [] };
  W.CURRICULUM.modules.push(

  /* ============================================================ 07 */
  {
    id: 'http', code: 'CS-07', title: 'How the internet moves data',
    tag: 'Systems',
    blurb: 'What actually happens between typing an address and seeing a page.',
    lessons: [
      {
        id: 'http-request',
        title: 'The request and response cycle',
        goal: 'Describe every stage between a click and a rendered page.',
        plain: 'A browser sends a request: a method, a path, some headers, and sometimes a body. A server sends back a response: a status code, headers, and usually a body. That exchange is the entire foundation of the web, repeated thousands of times per page.',
        why: 'Almost every web bug is answered by looking at one request and one response. Once you can read them, the Network tab stops being noise and becomes the fastest debugging tool you own.',
        analogy: 'Posting a letter with a return address. You state what you want, they post something back, and both envelopes carry notes on the outside.',
        points: [
          ['Method', 'GET reads, POST creates, PUT replaces, PATCH edits, DELETE removes'],
          ['Path', 'which resource you want'],
          ['Headers', 'information about the message, not the message itself'],
          ['Body', 'the actual payload, on requests that carry one'],
          ['Status', 'a three-digit summary of what happened'],
          'GET should never change anything on the server'
        ],
        lang: 'none',
        codeBlock: 'REQUEST\n  POST /api/orders HTTP/1.1\n  Host: api.safihardware.com\n  Content-Type: application/json\n  Authorization: Bearer eyJhbGci...\n\n  { "sku": "BLT-12", "qty": 40 }\n\nRESPONSE\n  HTTP/1.1 201 Created\n  Content-Type: application/json\n  Location: /api/orders/8812\n\n  { "id": 8812, "sku": "BLT-12", "qty": 40, "status": "pending" }',
        terms: ['HTTP', 'REST', 'Request', 'Response', 'Header'],
        callout: { kind: 'tip', text: 'Open DevTools, go to the Network tab, and reload any site. Every line is one of these exchanges.' },
        lab: 'http'
      },
      {
        id: 'http-status',
        title: 'Status codes',
        goal: 'Diagnose a failure from its status code alone.',
        plain: 'The first digit tells you who to talk to. 2xx means it worked. 3xx means it moved. 4xx means your request was wrong, so fix the client. 5xx means the server broke, so fix the server. That single distinction routes most debugging correctly in five seconds.',
        why: 'A 404 and a 500 look identical to a user and mean opposite things to a developer. One is a bad address, the other is a bug in production.',
        analogy: 'A returned parcel. "No such address" is your mistake. "Warehouse fire" is theirs.',
        points: [
          '200 OK · 201 Created · 204 No Content',
          '301 moved permanently · 302 temporarily · 304 unchanged, use your cache',
          '400 malformed · 401 not logged in · 403 logged in but not allowed · 404 not found · 429 too many requests',
          '500 server crashed · 502 bad gateway · 503 unavailable · 504 upstream timeout',
          '401 and 403 are different: one is identity, the other is permission'
        ],
        lang: 'none',
        codeBlock: '2xx  SUCCESS      the request worked\n3xx  REDIRECT     look somewhere else\n4xx  CLIENT ERROR you sent something wrong      <- fix the caller\n5xx  SERVER ERROR the server failed            <- fix the server\n\nMost common in practice:\n  200  fine\n  201  created, usually after a POST\n  400  the body or query string was malformed\n  401  no valid credentials were supplied\n  403  credentials were fine, permission was not\n  404  nothing lives at that path\n  422  shape was valid, values were not\n  429  rate limited, slow down\n  500  an unhandled exception reached the top\n  502  a proxy could not reach the app behind it',
        terms: ['Status Code', 'Client Error', 'Server Error'],
        callout: { kind: 'note', text: 'A 404 for a file that clearly exists usually means the path is right but the routing is not.' }
      },
      {
        id: 'http-json',
        title: 'JSON and API contracts',
        goal: 'Read a JSON payload and spot a contract violation.',
        plain: 'JSON is text describing objects, arrays, strings, numbers, booleans, and null. It is how two systems written in different languages agree on a shape. The contract is the promise about which fields exist and what type they are, and breaking it silently is how integrations fail.',
        why: 'Most API bugs are not network failures. They are a field that arrived as a string when the caller expected a number, or was missing entirely.',
        analogy: 'A shipping manifest both warehouses agreed on in advance. If one starts writing weights in pounds, nothing catches fire immediately, but everything downstream is now wrong.',
        points: [
          'Keys must be in double quotes; single quotes are invalid JSON',
          'No trailing commas, no comments',
          'Values: string, number, boolean, null, object, array',
          'Dates are not a JSON type; they travel as strings, usually ISO 8601',
          'Missing and null are different, and code must handle both'
        ],
        lang: 'js',
        code: 'const response = {\n  ok: true,\n  count: 2,\n  orders: [\n    { id: 8812, sku: "BLT-12", qty: 40, shipped: false },\n    { id: 8813, sku: "BRG-22", qty: 2,  shipped: true }\n  ]\n};\n\nconsole.log("Returned " + response.count + " orders");\n\nlet pending = 0;\nfor (const order of response.orders) {\n  const state = order.shipped ? "shipped" : "pending";\n  if (!order.shipped) pending = pending + 1;\n  console.log("  #" + order.id + " " + order.sku + " x" + order.qty + " · " + state);\n}\n\nconsole.log("Still pending: " + pending);',
        notes: {
          0: 'In JavaScript this is an object literal. Sent over the wire it becomes JSON text.',
          3: 'An array of objects. This is the shape of nearly every list endpoint.',
          12: 'Walking the array. Each order is one object.',
          13: 'A boolean field controls the display, not a string comparison.'
        },
        terms: ['JSON', 'API', 'Contract', 'Serialization'],
        challenge: {
          prompt: 'Also print the total quantity across all orders (42).',
          check: { outputContains: '42' },
          hint: 'Add a total accumulator and add order.qty inside the loop.'
        }
      },
      {
        id: 'http-dns',
        title: 'DNS, TLS, and what a domain really is',
        goal: 'Explain what happens before the first byte of your page loads.',
        plain: 'A domain name is a label for an address. DNS translates the name into an IP address. Then a TLS handshake sets up encryption so nobody in between can read the traffic. Only after both of those does the HTTP request actually go out.',
        why: 'When a site is unreachable, knowing whether DNS resolved, TLS negotiated, or the app returned an error tells you which of three completely different teams to call.',
        analogy: 'Looking up a phone number, agreeing on a scrambler both handsets understand, and only then starting the conversation.',
        points: [
          ['Registrar', 'where you buy the name'],
          ['Nameserver', 'which service answers questions about it'],
          'A record points at an IP; CNAME points at another name',
          'TTL controls how long answers are cached, which is why changes feel slow',
          'HTTPS means TLS is wrapping HTTP; the certificate proves identity',
          'A certificate error is a trust failure, not a coding failure'
        ],
        lang: 'none',
        codeBlock: 'you type            safihardware.com\n\n1. DNS lookup       "what IP is safihardware.com?"\n                    -> 203.0.113.42        (cached for the TTL)\n\n2. TCP connect      open a socket to 203.0.113.42 on port 443\n\n3. TLS handshake    server presents a certificate\n                    browser verifies who signed it\n                    both sides agree on encryption keys\n\n4. HTTP request     GET / HTTP/1.1\n                    Host: safihardware.com\n\n5. HTTP response    200 OK  +  the HTML\n\n6. Browser parses   fetches CSS, JS, images, each one repeats 1-5\n                    (usually reusing the same connection)',
        terms: ['DNS', 'TLS', 'Certificate', 'IP Address', 'CDN'],
        callout: { kind: 'warn', text: 'DNS changes are not instant. The TTL you set is how long the old answer may keep being served, so lower it before you plan a migration.' }
      }
    ]
  },

  /* ============================================================ 08 */
  {
    id: 'servers', code: 'CS-08', title: 'Servers and backends',
    tag: 'Systems',
    blurb: 'The always-on program that answers requests and holds the rules you cannot trust a browser with.',
    lessons: [
      {
        id: 'server-what',
        title: 'What a server actually is',
        goal: 'Describe a server as a program rather than a machine.',
        plain: 'A server is just a program that never exits. It binds to a port, waits, and when a request arrives it runs some code and writes a response. The word also gets used for the hardware, but the concept you need is the process.',
        why: 'Once "server" means a running process, deployment, restarts, ports, crashes, and logs all stop being mysterious.',
        analogy: 'A shop counter. The building is not the shop; the person standing at the counter answering questions is.',
        points: [
          'It binds a port and listens; port 80 is HTTP, 443 is HTTPS',
          'Each request runs a handler and produces a response',
          'If the process dies, the site is down, which is why a supervisor restarts it',
          'It holds the trusted logic, because a browser can be modified by anyone',
          'Stateless handlers scale easily; in-memory state does not survive a restart'
        ],
        lang: 'js',
        code: 'const routes = {\n  "GET /health":       () => ({ status: 200, body: "ok" }),\n  "GET /api/parts":    () => ({ status: 200, body: "[BLT-12, NUT-08]" }),\n  "POST /api/orders":  () => ({ status: 201, body: "order created" })\n};\n\nfunction handle(method, path) {\n  const key = method + " " + path;\n  const route = routes[key];\n\n  if (!route) {\n    return { status: 404, body: "no route for " + key };\n  }\n  return route();\n}\n\nconst incoming = [\n  ["GET", "/health"],\n  ["GET", "/api/parts"],\n  ["POST", "/api/orders"],\n  ["GET", "/admin"]\n];\n\nfor (const req of incoming) {\n  const res = handle(req[0], req[1]);\n  console.log(req[0] + " " + req[1] + "  ->  " + res.status + "  " + res.body);\n}',
        notes: {
          0: 'A routing table. Method plus path decides which function runs.',
          6: 'This is the whole job of a web framework, stripped to its core.',
          10: 'No matching route means 404. Nothing crashed; it simply is not there.',
          22: 'Simulating four requests arriving one after another.'
        },
        terms: ['Server', 'Port', 'Route', 'Handler', 'Stateless'],
        lab: 'server'
      },
      {
        id: 'server-routes',
        title: 'Routes, middleware, and layers',
        goal: 'Explain how a request passes through layers before reaching your code.',
        plain: 'Real servers do not jump straight to your handler. The request passes through middleware first: logging, parsing the body, checking authentication, applying rate limits. Each layer can pass it along or stop it dead with a response.',
        why: 'When a request never reaches your handler, the answer is almost always a middleware layer above it that rejected or redirected it.',
        analogy: 'Airport security. Several checkpoints in a fixed order, and any one of them can send you back.',
        points: [
          'Middleware runs in the order you register it',
          'Any layer can short-circuit and respond immediately',
          'Common layers: logging, CORS, body parsing, auth, rate limiting',
          'Auth belongs before the handler, never inside it repeatedly',
          'Error-handling middleware usually goes last'
        ],
        lang: 'js',
        code: 'function logger(req) {\n  console.log("  [log] " + req.method + " " + req.path);\n  return null;\n}\n\nfunction requireAuth(req) {\n  if (!req.token) {\n    return { status: 401, body: "missing token" };\n  }\n  return null;\n}\n\nfunction rateLimit(req) {\n  if (req.callsThisMinute > 100) {\n    return { status: 429, body: "slow down" };\n  }\n  return null;\n}\n\nfunction handler(req) {\n  return { status: 200, body: "here are your orders" };\n}\n\nfunction runPipeline(req) {\n  const layers = [logger, requireAuth, rateLimit];\n  for (const layer of layers) {\n    const stop = layer(req);\n    if (stop) return stop;\n  }\n  return handler(req);\n}\n\nconsole.log("Request A:");\nconsole.log(runPipeline({ method: "GET", path: "/orders", token: "abc", callsThisMinute: 3 }).body);\n\nconsole.log("Request B:");\nconsole.log(runPipeline({ method: "GET", path: "/orders", token: "", callsThisMinute: 3 }).body);\n\nconsole.log("Request C:");\nconsole.log(runPipeline({ method: "GET", path: "/orders", token: "abc", callsThisMinute: 900 }).body);',
        notes: {
          2: 'Returning null means "carry on to the next layer".',
          6: 'Returning a response object stops the pipeline immediately.',
          24: 'The loop IS the framework. Layers in order, first refusal wins.',
          34: 'Request B never reaches the handler. It is stopped at auth.'
        },
        terms: ['Middleware', 'Pipeline', 'Authentication', 'Rate Limit'],
        callout: { kind: 'note', text: 'Step through request B and watch the pipeline exit early at requireAuth. That early exit is the whole idea.' }
      },
      {
        id: 'server-env',
        title: 'Configuration and secrets',
        goal: 'Keep credentials out of your source code.',
        plain: 'The same code has to run on your laptop, on a test server, and in production, each with different databases and keys. Environment variables supply those differences from outside the code. Secrets never belong in the repository, because a repository is forever and often public.',
        why: 'Leaked API keys in public repositories are scanned for automatically within minutes. This is one of the most common and most expensive beginner mistakes.',
        analogy: 'A machine that reads its settings from a dial on the outside, rather than having them welded in.',
        points: [
          'Environment variables are supplied by the host, not the code',
          '.env is for local work only and must be in .gitignore',
          'Never commit keys, passwords, or tokens',
          'If a secret leaks, rotate it; deleting the commit is not enough',
          'Config that differs per environment: database URL, keys, log level, feature flags'
        ],
        lang: 'js',
        code: 'const env = {\n  NODE_ENV: "production",\n  DATABASE_URL: "postgres://app@db.internal:5432/orders",\n  STRIPE_KEY: "sk_live_51HxQz9pR",\n  LOG_LEVEL: "warn"\n};\n\nfunction requireVar(name) {\n  const value = env[name];\n  if (!value) {\n    console.log("FATAL: missing required variable " + name);\n    return "";\n  }\n  return value;\n}\n\nfunction mask(secret) {\n  if (secret.length < 8) return "****";\n  return secret.substring(0, 6) + "…" + secret.substring(secret.length - 2);\n}\n\nconst dbUrl = requireVar("DATABASE_URL");\nconst key   = requireVar("STRIPE_KEY");\nconst debug = env.NODE_ENV !== "production";\n\nconsole.log("Environment: " + env.NODE_ENV);\nconsole.log("Debug mode:  " + debug);\nconsole.log("Database:    " + dbUrl.substring(0, 22) + "…");\nconsole.log("Stripe key:  " + mask(key));\nrequireVar("SENDGRID_KEY");',
        notes: {
          7: 'Fail loudly at startup, not quietly at 3am when the first payment runs.',
          16: 'Never log a full secret. Masked values are enough to confirm which key loaded.',
          22: 'Behaviour switches on environment, so debug output never reaches production.',
          28: 'This one is missing, and the program says so immediately.'
        },
        terms: ['Environment Variable', 'Secret', 'Configuration', 'Twelve-Factor'],
        callout: { kind: 'warn', text: 'Add .env to .gitignore before your first commit, not after. Git history keeps deleted files.' }
      },
      {
        id: 'server-hosting',
        title: 'Where code actually runs',
        goal: 'Choose a hosting model for a given project.',
        plain: 'Static hosting serves files with no code running. Serverless runs a function per request and sleeps in between. A container or virtual machine runs your process continuously. Managed platforms hide the machine but still run a long-lived process. The differences are cost, control, and cold starts.',
        why: 'Choosing a database server for a brochure site wastes money, and choosing static hosting for something needing a secret key is impossible. Matching the model to the need saves both.',
        analogy: 'Renting a shelf, hiring a van by the trip, leasing a truck, or buying the depot.',
        points: [
          ['Static (CDN)', 'HTML, CSS, JS files only; fastest and cheapest'],
          ['Serverless functions', 'per-request billing, scales to zero, cold starts'],
          ['Containers', 'your process, your dependencies, runs anywhere'],
          ['Virtual machines', 'full control and full responsibility'],
          ['Managed platform', 'you push code, they run it'],
          'Anything needing a secret key needs a server, not a browser'
        ],
        lang: 'none',
        codeBlock: 'STATIC / CDN\n  serves    files only\n  good for  marketing sites, docs, single-page app shells\n  cost      pennies\n  limit     no secrets, no server-side logic\n\nSERVERLESS FUNCTION\n  serves    one function per request\n  good for  webhooks, APIs with spiky traffic, scheduled jobs\n  cost      per invocation, zero when idle\n  limit     cold starts, execution time caps, no long-lived state\n\nCONTAINER\n  serves    your whole process, dependencies included\n  good for  normal web apps, background workers\n  cost      per running instance\n  limit     you own the image and its patching\n\nVIRTUAL MACHINE\n  serves    whatever you install\n  good for  legacy software, unusual requirements\n  cost      per hour, running or not\n  limit     you patch the OS, you handle the pager',
        terms: ['Hosting', 'Serverless', 'Container', 'CDN', 'Cold Start'],
        callout: { kind: 'tip', text: 'The honest default for a new small project: static hosting for the frontend and one small container or serverless function for anything needing a secret.' }
      }
    ]
  },

  /* ============================================================ 09 */
  {
    id: 'data', code: 'CS-09', title: 'Databases and SQL',
    tag: 'Systems',
    blurb: 'Where the data lives when the program is not running.',
    lessons: [
      {
        id: 'sql-tables',
        title: 'Tables, rows, and schema',
        goal: 'Design a table with the right columns and a primary key.',
        plain: 'A relational database stores data in tables. Each table is one kind of thing, each row is one instance, and each column has a fixed type. A primary key uniquely identifies a row, and a foreign key in one table points at a primary key in another. That is the entire relational idea.',
        why: 'A good schema makes bad data impossible to store. A bad schema means every query has to defend against nonsense that should never have got in.',
        analogy: 'A filing cabinet where every folder has the same printed form inside, and the form has a reference number.',
        points: [
          'One table per real-world noun',
          'Every table gets a primary key, usually an auto-incrementing id',
          'A foreign key links a row to a row in another table',
          'NOT NULL means the column must always have a value',
          'UNIQUE prevents duplicates, such as two accounts on one email',
          'Pick the narrowest type that fits; it is documentation the database enforces'
        ],
        lang: 'sql',
        code: "CREATE TABLE customers (\n  id          INTEGER PRIMARY KEY,\n  name        TEXT    NOT NULL,\n  email       TEXT    NOT NULL UNIQUE,\n  created_at  TEXT    NOT NULL\n);\n\nCREATE TABLE orders (\n  id           INTEGER PRIMARY KEY,\n  customer_id  INTEGER NOT NULL REFERENCES customers(id),\n  sku          TEXT    NOT NULL,\n  qty          INTEGER NOT NULL,\n  unit_price   REAL    NOT NULL,\n  status       TEXT    NOT NULL,\n  created_at   TEXT    NOT NULL\n);",
        notes: {
          1: 'The unique handle for this row. Everything else points here.',
          3: 'UNIQUE means the database itself refuses a second account on one email.',
          9: 'The link. This order belongs to exactly one customer.',
          13: 'Storing status as text is simple; a constrained set of values would be stricter.'
        },
        terms: ['Database', 'Table', 'Primary Key', 'Foreign Key', 'Schema'],
        lab: 'sql'
      },
      {
        id: 'sql-select',
        title: 'Querying with SELECT',
        goal: 'Filter, sort, and limit rows to answer a question.',
        plain: 'SELECT says which columns you want, FROM says which table, WHERE filters rows, ORDER BY sorts them, and LIMIT caps how many come back. The database figures out how to do it efficiently; you only describe what you want.',
        why: 'SQL is declarative, which is why it has outlived almost every language it was used alongside. Learning it once pays out for a whole career.',
        analogy: 'Telling a librarian what you need rather than walking the shelves yourself.',
        points: [
          'SELECT columns FROM table WHERE condition ORDER BY column LIMIT n',
          'SELECT * takes every column and is fine for exploring, lazy in production',
          'WHERE runs before grouping; HAVING runs after',
          'Comparison uses a single =, and NULL needs IS NULL, never = NULL',
          'ORDER BY defaults to ascending; add DESC to reverse'
        ],
        lang: 'sql',
        code: "SELECT sku, qty, unit_price, qty * unit_price AS line_total\nFROM orders\nWHERE status = 'pending'\n  AND qty > 1\nORDER BY line_total DESC\nLIMIT 5;",
        notes: {
          0: 'Named columns plus a calculated one. AS gives the calculation a name.',
          2: 'Filters rows before anything else is computed.',
          3: 'AND requires both conditions. OR would need brackets to stay unambiguous.',
          4: 'Sorting by the calculated column, largest first.',
          5: 'Only the top five come back over the network.'
        },
        terms: ['SQL', 'SELECT', 'WHERE', 'Query'],
        lab: 'sql'
      },
      {
        id: 'sql-joins',
        title: 'Joins',
        goal: 'Combine two tables and know which join to use.',
        plain: 'A join stitches rows from two tables together using a matching column. An inner join keeps only rows that matched on both sides. A left join keeps every row from the left table, filling the right side with nulls when there was no match.',
        why: 'The classic reporting bug is using an inner join and silently losing every customer who has not ordered yet. The count looks plausible, so nobody notices for months.',
        analogy: 'Laying two lists side by side and lining them up by reference number. Inner join throws away unmatched lines; left join keeps them with blanks.',
        points: [
          ['INNER JOIN', 'only rows present in both'],
          ['LEFT JOIN', 'all rows from the left, nulls where the right had nothing'],
          'ON says which columns must match',
          'Alias tables (c, o) to keep the query readable',
          'Counting after an inner join silently hides the unmatched rows'
        ],
        lang: 'sql',
        code: "SELECT c.name,\n       o.sku,\n       o.qty\nFROM customers AS c\nINNER JOIN orders AS o\n  ON o.customer_id = c.id\nWHERE o.status = 'pending'\nORDER BY c.name;",
        notes: {
          3: 'The left table, given the short alias c.',
          4: 'Only customers who actually have a matching order survive this.',
          5: 'The link condition. Foreign key on one side, primary key on the other.',
          6: 'Filtering after the join, so it applies to the combined rows.'
        },
        terms: ['Join', 'Inner Join', 'Left Join', 'Relation'],
        lab: 'sql'
      },
      {
        id: 'sql-aggregate',
        title: 'Grouping and aggregates',
        goal: 'Summarise many rows into per-group totals.',
        plain: 'Aggregate functions collapse many rows into one value: COUNT, SUM, AVG, MIN, MAX. GROUP BY splits the rows into buckets first so you get one result per bucket. HAVING then filters those results, which WHERE cannot do.',
        why: 'Reporting is almost entirely this. Revenue per month, orders per customer, errors per endpoint are all the same shape.',
        analogy: 'Sorting receipts into piles by category, then weighing each pile.',
        points: [
          'COUNT(*) counts rows; COUNT(col) skips nulls',
          'Every non-aggregated column in SELECT must appear in GROUP BY',
          'WHERE filters rows before grouping',
          'HAVING filters groups after aggregating',
          'AVG on an empty group is null, not zero'
        ],
        lang: 'sql',
        code: "SELECT sku,\n       COUNT(*)              AS order_count,\n       SUM(qty)              AS units,\n       SUM(qty * unit_price) AS revenue\nFROM orders\nWHERE status <> 'cancelled'\nGROUP BY sku\nHAVING SUM(qty) > 5\nORDER BY revenue DESC;",
        notes: {
          1: 'One row per sku after grouping, so this counts orders per sku.',
          5: 'Excludes cancelled rows before any totalling happens.',
          6: 'Creates one bucket per distinct sku.',
          7: 'Filters the buckets. WHERE could not do this, because the sum does not exist yet.'
        },
        terms: ['Aggregate', 'GROUP BY', 'HAVING', 'Reporting'],
        lab: 'sql'
      },
      {
        id: 'sql-indexes',
        title: 'Indexes and why queries get slow',
        goal: 'Explain why the same query is instant on one table and slow on another.',
        plain: 'Without an index, the database reads every row to find matches. An index is a sorted structure that lets it jump straight to the right rows. Indexes make reads fast and writes slightly slower, because every insert must also update the index.',
        why: 'A query that is instant on a thousand test rows can take thirty seconds on ten million real ones. Nothing about the query changed; the scan just got longer.',
        analogy: 'The index at the back of a book. Without it you read every page looking for the word.',
        points: [
          'Index the columns you filter and join on',
          'Primary keys are indexed automatically; foreign keys often are not',
          'Every index costs write speed and disk',
          'Wrapping a column in a function usually disables its index',
          'EXPLAIN shows whether an index was actually used'
        ],
        lang: 'sql',
        code: "-- Slow on a large table: every row must be read\nSELECT * FROM orders WHERE customer_id = 8812;\n\n-- Create the index once\nCREATE INDEX idx_orders_customer ON orders(customer_id);\n\n-- Now the same query jumps straight to the matching rows\nSELECT * FROM orders WHERE customer_id = 8812;\n\n-- Two columns, for queries that filter on both\nCREATE INDEX idx_orders_status_sku ON orders(status, sku);\n\n-- This one cannot use an index on created_at,\n-- because the column is wrapped in a function\nSELECT * FROM orders WHERE substr(created_at, 1, 4) = '2026';",
        notes: {
          1: 'Full table scan. Fine at a thousand rows, painful at ten million.',
          4: 'Built once, maintained by the database from then on.',
          10: 'Column order matters. This helps queries filtering on status, or on both.',
          14: 'The function hides the raw column, so the index is skipped.'
        },
        terms: ['Index', 'Query Plan', 'Full Table Scan', 'Performance'],
        callout: { kind: 'tip', text: 'Do not add indexes speculatively. Find the slow query first, run EXPLAIN, then index what it actually needs.' }
      },
      {
        id: 'sql-transactions',
        title: 'Transactions',
        goal: 'Group operations so they all succeed or all fail.',
        plain: 'A transaction wraps several statements so they take effect together. If anything fails partway, the whole thing rolls back and the database looks as though nothing happened. Without this, a crash between two updates leaves permanently inconsistent data.',
        why: 'Money moving between accounts is the standard example for a reason: subtracting from one account and crashing before adding to the other destroys value with no error message.',
        analogy: 'A contract that both parties sign at once. Either both signatures land or neither does.',
        points: [
          'BEGIN, then statements, then COMMIT',
          'ROLLBACK undoes everything since BEGIN',
          ['Atomic', 'all or nothing, never half'],
          ['Consistent', 'the rules hold before and after'],
          ['Isolated', 'concurrent transactions do not see each other half-done'],
          ['Durable', 'once committed it survives a power cut']
        ],
        lang: 'sql',
        code: "BEGIN;\n\nUPDATE inventory\n   SET on_hand = on_hand - 40\n WHERE sku = 'BLT-12';\n\nINSERT INTO orders (customer_id, sku, qty, unit_price, status, created_at)\nVALUES (2, 'BLT-12', 40, 0.35, 'pending', '2026-08-25');\n\n-- If the stock went negative, undo everything:\n--   ROLLBACK;\n\nCOMMIT;",
        notes: {
          0: 'From here, nothing is visible to anyone else until COMMIT.',
          2: 'Stock goes down.',
          6: 'The order is recorded. These two must never happen separately.',
          12: 'Both changes become real at the same instant.'
        },
        terms: ['Transaction', 'ACID', 'Rollback', 'Commit'],
        callout: { kind: 'warn', text: 'Keep transactions short. A transaction held open while waiting on a network call can lock rows and stall everything behind it.' }
      }
    ]
  },

  /* ============================================================ 10 */
  {
    id: 'security', code: 'CS-10', title: 'Auth and security',
    tag: 'Systems',
    blurb: 'Who you are, what you may do, and the handful of mistakes that cause most breaches.',
    lessons: [
      {
        id: 'sec-authn',
        title: 'Authentication vs authorization',
        goal: 'Separate proving identity from granting permission.',
        plain: 'Authentication answers "who are you" and happens once at login. Authorization answers "may you do this" and must be checked on every single request. Conflating them is how a logged-in user ends up reading someone else\'s records.',
        why: 'The single most common serious web vulnerability is checking that someone is logged in, but never checking that this particular record belongs to them.',
        analogy: 'A building pass proves who you are. It does not mean every door opens.',
        points: [
          '401 means not authenticated; 403 means authenticated but not allowed',
          'Authenticate once, authorize every time',
          'Never trust an id from the client without checking ownership',
          'Roles are coarse; ownership checks are specific and usually what you need',
          'Do it on the server. Hiding a button changes nothing.'
        ],
        lang: 'js',
        code: 'const orders = [\n  { id: 1, ownerId: 10, sku: "BLT-12" },\n  { id: 2, ownerId: 22, sku: "BRG-22" }\n];\n\nfunction getOrderInsecure(user, orderId) {\n  if (!user) return "401 not logged in";\n  for (const o of orders) {\n    if (o.id === orderId) return "200 " + o.sku;\n  }\n  return "404 not found";\n}\n\nfunction getOrderSecure(user, orderId) {\n  if (!user) return "401 not logged in";\n  for (const o of orders) {\n    if (o.id === orderId) {\n      if (o.ownerId !== user.id) return "403 not yours";\n      return "200 " + o.sku;\n    }\n  }\n  return "404 not found";\n}\n\nconst alice = { id: 10 };\n\nconsole.log("insecure, own order:   " + getOrderInsecure(alice, 1));\nconsole.log("insecure, other order: " + getOrderInsecure(alice, 2));\nconsole.log("secure,   own order:   " + getOrderSecure(alice, 1));\nconsole.log("secure,   other order: " + getOrderSecure(alice, 2));',
        notes: {
          5: 'Checks login and nothing else. This is the bug.',
          8: 'Any logged-in user can read any order by changing the number in the URL.',
          16: 'The ownership check. One line, and it is the entire fix.',
          27: 'Alice reads order 2 successfully in the insecure version. That is a breach.'
        },
        terms: ['Authentication', 'Authorization', 'IDOR', 'Access Control'],
        callout: { kind: 'warn', text: 'This exact bug has a name: Insecure Direct Object Reference. It is consistently in the OWASP Top 10.' }
      },
      {
        id: 'sec-passwords',
        title: 'Passwords, hashing, and tokens',
        goal: 'Explain why a password database should be useless when stolen.',
        plain: 'You never store a password. You store a slow one-way hash of it with a random salt, so identical passwords produce different stored values. At login you hash the attempt and compare. Sessions and tokens then carry identity forward so the password is not sent on every request.',
        why: 'Databases leak. The question is whether the leak hands attackers working passwords or a pile of expensive-to-crack noise.',
        analogy: 'Storing a fingerprint of the key rather than a copy of the key. You can check a key fits without holding one that opens the door.',
        points: [
          ['Use bcrypt, scrypt, or Argon2', 'deliberately slow by design'],
          'Never MD5 or SHA-256 alone; they are far too fast for passwords',
          'A salt is random per user and prevents precomputed lookup tables',
          'Session cookie or signed token carries identity after login',
          'Tokens should expire and be revocable',
          'Never log a password, a token, or a full card number'
        ],
        lang: 'none',
        codeBlock: 'SIGN UP\n  user types      hunter2\n  generate salt   9f3a1c...            (random, unique per user)\n  hash slowly     bcrypt(hunter2 + salt, cost=12)\n  store           $2b$12$9f3a1c...KIx2\n                  never the original text\n\nLOG IN\n  user types      hunter2\n  read stored     $2b$12$9f3a1c...KIx2\n  hash attempt    with the SAME salt from the stored value\n  compare         constant-time comparison only\n  issue           a session cookie or signed token\n\nAFTERWARDS\n  each request    carries the token, not the password\n  token           expires, and can be revoked server-side\n  logout          invalidates it on the server, not just the browser\n\nIF THE DATABASE LEAKS\n  attacker gets   slow salted hashes\n  cracking cost   enormous per password, with no shared shortcut\n  which is        the entire point',
        terms: ['Hashing', 'Salt', 'bcrypt', 'Session', 'JWT'],
        callout: { kind: 'warn', text: 'Do not write your own authentication for anything real. Use a maintained library or a provider. This is one area where original work is a liability.' }
      },
      {
        id: 'sec-input',
        title: 'Never trust input',
        goal: 'Recognise injection and XSS, and apply the fix.',
        plain: 'Every vulnerability in this family has one shape: data from a user is treated as code. SQL injection happens when input is glued into a query string. Cross-site scripting happens when input is written into a page as HTML. The fix is the same idea both times: keep data as data.',
        why: 'These two account for an enormous share of real-world breaches, and both are fully prevented by habits that cost nothing once learned.',
        analogy: 'Reading a letter aloud versus obeying it. Injection happens when the machine cannot tell the difference.',
        points: [
          'SQL: use parameterised queries, never string concatenation',
          'HTML: use textContent, not innerHTML, for anything a user supplied',
          'Validate on the server; client validation is only a convenience',
          ['Allow-lists beat block-lists', 'define what is valid, reject the rest'],
          'Escape at the point of output, based on where it is going'
        ],
        lang: 'js',
        code: 'const userInput = "Robert\'); DROP TABLE students;--";\n\nfunction buildUnsafe(name) {\n  return "SELECT * FROM students WHERE name = \'" + name + "\'";\n}\n\nfunction buildSafe(name) {\n  return "SELECT * FROM students WHERE name = ?   [param: " + name + "]";\n}\n\nconsole.log("UNSAFE:");\nconsole.log("  " + buildUnsafe(userInput));\nconsole.log("");\nconsole.log("SAFE:");\nconsole.log("  " + buildSafe(userInput));\nconsole.log("");\nconsole.log("In the safe version the input is never parsed as SQL.");\nconsole.log("It is sent separately and can only ever be a value.");',
        notes: {
          0: 'A classic payload. The quote closes the string and the rest becomes commands.',
          2: 'String concatenation. The input becomes part of the query structure.',
          6: 'The ? is a placeholder. The value travels separately and stays a value.',
          11: 'Look at the output: the unsafe query now contains a DROP TABLE statement.'
        },
        terms: ['SQL Injection', 'XSS', 'Sanitization', 'Parameterized Query'],
        callout: { kind: 'warn', text: 'innerHTML with user content is the browser equivalent of string-concatenated SQL. Reach for textContent by default.' }
      },
      {
        id: 'sec-practices',
        title: 'The security habits that matter most',
        goal: 'Apply a short checklist that prevents most common failures.',
        plain: 'You do not need to be a security specialist to avoid the common failures. A short list of defaults handles most of it: least privilege, HTTPS everywhere, keep dependencies current, validate on the server, log without leaking, and have a plan for when a key leaks.',
        why: 'Most breaches are not clever. They are an unpatched dependency, an over-permissioned key, or a debug endpoint left exposed.',
        analogy: 'Locking up at night. Not sophisticated, just done consistently every single time.',
        points: [
          ['Least privilege', 'every key and account gets the minimum it needs'],
          'HTTPS everywhere, with HSTS so downgrades are refused',
          'Patch dependencies; most compromises come through them',
          'Validate and authorize on the server, always',
          'Log events, never secrets',
          'Rate limit anything that can be guessed at',
          'Back up, and actually test a restore'
        ],
        lang: 'none',
        codeBlock: 'BEFORE YOU SHIP\n\n[ ] secrets in environment variables, .env is gitignored\n[ ] HTTPS enforced, HTTP redirects to it\n[ ] passwords hashed with bcrypt / scrypt / Argon2\n[ ] every endpoint checks BOTH login and ownership\n[ ] all queries parameterised, zero string concatenation\n[ ] user content rendered with textContent, not innerHTML\n[ ] dependencies audited and updated\n[ ] rate limiting on login, signup, and password reset\n[ ] error responses do not leak stack traces to users\n[ ] logs contain no passwords, tokens, or card numbers\n[ ] database credentials are not the admin account\n[ ] backups exist AND a restore has been tested\n[ ] you know how to rotate every key you use',
        terms: ['Least Privilege', 'HTTPS', 'Dependency', 'Audit', 'Defence in Depth'],
        callout: { kind: 'tip', text: 'The last line is the one people skip. Knowing how to rotate a key before you need to is the difference between an incident and a disaster.' }
      }
    ]
  },

  /* ============================================================ 11 */
  {
    id: 'git', code: 'CS-11', title: 'Git and debugging',
    tag: 'Craft',
    blurb: 'The two skills that separate people who ship from people who get stuck.',
    lessons: [
      {
        id: 'git-model',
        title: 'The Git mental model',
        goal: 'Explain where a change lives at each stage.',
        plain: 'Git has three places a change can be. The working directory is your files as they are right now. The staging area is what you have selected for the next commit. The repository is the permanent history. Every confusing Git command is just moving changes between those three.',
        why: 'People memorise commands and stay lost. Understanding the three places means you can reason about a command you have never seen.',
        analogy: 'Your desk, the outbox, and the filing cabinet. Staging is choosing what goes in this envelope.',
        points: [
          ['Working directory', 'edited but not selected'],
          ['Staging area', 'selected for the next commit'],
          ['Repository', 'committed permanently, with history'],
          'git add moves working → staging',
          'git commit moves staging → repository',
          'git push sends local commits to the remote',
          'A commit is a snapshot, not a diff'
        ],
        lang: 'shell',
        code: 'git status                      # what changed, and where it currently sits\n\ngit add src/checkout.js         # stage one specific file\ngit add -p                      # stage selected hunks, reviewing as you go\n\ngit commit -m "Fix tax rounding on split payments"\n\ngit log --oneline -5            # the last five commits\ngit diff                        # working directory vs staging\ngit diff --staged               # staging vs last commit\n\ngit push origin main            # send commits to the remote',
        notes: {
          0: 'Run this constantly. It is the cheapest way to stay oriented.',
          3: 'Reviews each change and asks whether to stage it. This alone improves commit quality.',
          5: 'Present tense, says why not what. The diff already shows what.',
          8: 'The two diffs answer different questions and both are useful.'
        },
        terms: ['Git', 'Commit', 'Staging Area', 'Repository'],
        callout: { kind: 'tip', text: 'A good commit message finishes the sentence "applying this commit will…". If you cannot, the commit is probably doing too much.' }
      },
      {
        id: 'git-branches',
        title: 'Branches and merges',
        goal: 'Work on a change without destabilising the main line.',
        plain: 'A branch is a movable pointer to a commit. Creating one costs nothing. You work on it, and when it is ready you merge it back. A conflict happens when two branches changed the same lines, and Git asks you to decide rather than guessing.',
        why: 'Branching is what lets several people work at once without stepping on each other, and what lets you abandon an experiment with no cleanup.',
        analogy: 'Photocopying a chapter to rewrite it while the original stays in the binder.',
        points: [
          'git switch -c name creates and moves to a branch',
          'Branches are cheap; make one per unit of work',
          'Merge brings the changes back into main',
          'A conflict means Git will not guess, so you choose',
          'Pull before you push to reduce surprises',
          'Never rewrite history that other people have already pulled'
        ],
        lang: 'shell',
        code: 'git switch -c fix/tax-rounding      # branch off and move onto it\n\n# ... edit, test, commit ...\ngit add .\ngit commit -m "Round tax per line instead of per order"\n\ngit switch main                      # back to the main line\ngit pull                             # get everyone else\'s work first\ngit merge fix/tax-rounding           # bring the change in\n\ngit branch -d fix/tax-rounding       # tidy up the finished branch\n\n# if a merge conflicts:\n#   open the file, look for <<<<<<< and >>>>>>>\n#   keep the correct result, delete the markers\n#   git add the file, then git commit',
        notes: {
          0: 'The -c means create. Branch names that state the intent age well.',
          7: 'Pulling before merging means conflicts surface locally, not in a broken main.',
          8: 'Fast and safe, because the work was isolated the whole time.',
          13: 'The markers show both sides. You are being asked to choose, not to panic.'
        },
        terms: ['Branch', 'Merge', 'Conflict', 'Pull Request'],
        callout: { kind: 'warn', text: 'git push --force can erase a colleague\'s commits. Use --force-with-lease, which refuses if the remote moved since you last looked.' }
      },
      {
        id: 'debug-loop',
        title: 'The debugging loop',
        goal: 'Find a bug by evidence rather than by guessing.',
        plain: 'Debugging is a loop, not an inspiration. Reproduce it reliably, read the actual error, form one hypothesis, test that single hypothesis, then either fix it or discard it and form another. Changing several things at once destroys your ability to know what worked.',
        why: 'Random editing sometimes fixes the symptom while leaving the cause. Then it comes back next month with no clue what changed.',
        analogy: 'Diagnosing an engine noise. You isolate one variable at a time, or you learn nothing.',
        points: [
          'Reproduce it reliably first, or you cannot know it is fixed',
          'Read the whole error, including the trace, bottom-up',
          'One hypothesis at a time',
          'Bisect: cut the search space in half rather than reading everything',
          'Print the actual value AND its type; assumptions hide there',
          'When it is fixed, write the test that would have caught it'
        ],
        lang: 'js',
        code: 'function applyDiscount(price, percentOff) {\n  return price - price * percentOff;\n}\n\nconst cases = [\n  [100, 10],\n  [100, 0.1],\n  [59.99, 25]\n];\n\nfor (const c of cases) {\n  const price = c[0];\n  const off = c[1];\n  const result = applyDiscount(price, off);\n\n  console.log("price=" + price + "  off=" + off + "  ->  " + result);\n\n  if (result < 0) {\n    console.log("   ^ BUG: a discount produced a negative price");\n  }\n}',
        notes: {
          1: 'The bug: percentOff is expected as a fraction, but callers pass whole numbers.',
          5: '10 means "10 percent" to a human and "1000 percent" to this function.',
          15: 'Printing the inputs alongside the output is what makes the bug obvious.',
          17: 'An assertion turns a silent wrong answer into a loud one.'
        },
        terms: ['Debugging', 'Hypothesis', 'Assertion', 'Regression Test'],
        challenge: {
          prompt: 'Fix applyDiscount so a percentOff of 10 means 10 percent, giving 90 for a 100 price.',
          check: { outputContains: '90' },
          hint: 'Divide by 100 inside the function: price - price * (percentOff / 100).'
        }
      },
      {
        id: 'testing',
        title: 'Testing',
        goal: 'Write a test that would catch a bug before a user does.',
        plain: 'A test is code that runs your code and checks the answer. The pattern is always the same: arrange the inputs, act by calling the thing, assert the result matches. Tests are not about proving correctness; they are about noticing when something that used to work stops working.',
        why: 'Without tests, every change is a gamble on whether you remembered all the consequences. With them, the machine remembers for you.',
        analogy: 'A go/no-go gauge on a workbench. It does not measure everything, it just refuses to pass a part that is out of spec.',
        points: [
          'Arrange, act, assert',
          'Unit tests check one function; integration tests check parts working together',
          'Test the edge cases: zero, empty, negative, one, enormous',
          'A failing test that reproduces the bug comes before the fix',
          'Slow or flaky tests get ignored, which is worse than no tests'
        ],
        lang: 'js',
        code: 'function applyDiscount(price, percentOff) {\n  if (percentOff < 0 || percentOff > 100) return price;\n  return price - price * (percentOff / 100);\n}\n\nlet passed = 0;\nlet failed = 0;\n\nfunction check(label, actual, expected) {\n  if (actual === expected) {\n    passed = passed + 1;\n    console.log("  PASS  " + label);\n  } else {\n    failed = failed + 1;\n    console.log("  FAIL  " + label + "  expected " + expected + " got " + actual);\n  }\n}\n\nconsole.log("applyDiscount");\ncheck("no discount",        applyDiscount(100, 0),   100);\ncheck("ten percent",        applyDiscount(100, 10),  90);\ncheck("full discount",      applyDiscount(100, 100), 0);\ncheck("rejects negative",   applyDiscount(100, -5),  100);\ncheck("rejects over 100",   applyDiscount(100, 500), 100);\n\nconsole.log("");\nconsole.log(passed + " passed, " + failed + " failed");',
        notes: {
          1: 'A guard clause added because a test demanded it.',
          8: 'A tiny assertion helper. Real frameworks are this idea with better output.',
          19: 'The case that was broken before. Now it is locked in permanently.',
          21: 'Edge cases. These are where bugs live, not in the happy path.'
        },
        terms: ['Testing', 'Unit Test', 'Assertion', 'Edge Case', 'CI'],
        callout: { kind: 'note', text: 'Run this. Five passes is not the point. The point is that if someone changes the formula next month, this file objects immediately.' }
      }
    ]
  },

  /* ============================================================ 12 */
  {
    id: 'ship', code: 'CS-12', title: 'Shipping it',
    tag: 'Craft',
    blurb: 'Getting code off your machine and keeping it running once real people depend on it.',
    lessons: [
      {
        id: 'ship-deploy',
        title: 'Deployment',
        goal: 'Describe the path from a commit to a live site.',
        plain: 'Deployment is the pipeline that takes committed code and makes it the version the public is using. Typically: run tests, build an artifact, ship it to a staging environment, verify, then promote to production. Automating it means the risky steps happen identically every time.',
        why: 'Manual deployment works until the day you are tired, and then it does not. Every step a human performs from memory is a step that eventually gets skipped.',
        analogy: 'A production line with inspection gates. Anything failing a gate never reaches the customer.',
        points: [
          'Commit → test → build → staging → verify → production',
          'A build artifact is produced once and promoted unchanged',
          'Staging should resemble production closely enough to be meaningful',
          'Have a rollback plan before you need one',
          'Migrations run separately and must be backward compatible',
          'Deploying and releasing can be separated with feature flags'
        ],
        lang: 'none',
        codeBlock: 'git push\n   │\n   ▼\nCI RUNS                    (automatic, every push)\n   ├─ install dependencies\n   ├─ lint\n   ├─ run tests             ── fail here and it stops. Nothing ships.\n   └─ build artifact        ── one build, promoted unchanged from here on\n   │\n   ▼\nSTAGING                    (auto-deploy on merge to main)\n   ├─ run migrations\n   ├─ smoke test the critical paths\n   └─ a human looks at it\n   │\n   ▼\nPRODUCTION                 (promote the SAME artifact)\n   ├─ migrate\n   ├─ roll out gradually\n   ├─ watch error rate and latency\n   └─ roll back automatically if either spikes',
        terms: ['Deployment', 'CI/CD', 'Staging', 'Rollback', 'Artifact'],
        callout: { kind: 'warn', text: 'Rebuilding for production instead of promoting the tested artifact means the thing you tested is not the thing you shipped.' }
      },
      {
        id: 'ship-docker',
        title: 'Containers',
        goal: 'Explain what a container solves.',
        plain: 'A container packages your code together with its dependencies and system libraries, so it runs identically everywhere. It is not a virtual machine; it shares the host kernel and starts in a fraction of a second. The image is the recipe, and the container is the running instance.',
        why: '"It works on my machine" is nearly always a version mismatch somewhere in the environment. Containers make the environment part of the deliverable.',
        analogy: 'A shipping container. The port does not care what is inside; it only has to fit the standard fittings.',
        points: [
          'Image = the built recipe; container = a running instance of it',
          'A Dockerfile lists the steps to build the image',
          'Layers are cached, so put the steps that rarely change first',
          'Containers are disposable; data lives in a volume or a database',
          ['Never bake secrets into an image', 'anyone with the image has them']
        ],
        lang: 'shell',
        code: '# Dockerfile\nFROM node:22-alpine              # a small, pinned base image\n\nWORKDIR /app\n\nCOPY package*.json ./            # dependency manifest first,\nRUN  npm ci --omit=dev           # so this layer caches between builds\n\nCOPY . .                         # then the source, which changes often\n\nEXPOSE 3000\nUSER node                        # do not run as root\nCMD ["node", "server.js"]',
        notes: {
          1: 'Pinned to a version. "latest" means your build changes without you changing anything.',
          4: 'Copying just the manifest first is the single biggest build-speed win.',
          5: 'npm ci installs exactly the lockfile, unlike npm install.',
          10: 'Running as root inside a container is a common and avoidable risk.'
        },
        terms: ['Container', 'Docker', 'Image', 'Layer'],
        callout: { kind: 'tip', text: 'Order your Dockerfile from least to most frequently changing. Everything below a changed line rebuilds.' }
      },
      {
        id: 'ship-monitor',
        title: 'Knowing it is broken before your users tell you',
        goal: 'Choose what to measure and what to alert on.',
        plain: 'Once real people depend on it, you need to know when something is wrong. Logs record what happened, metrics count and time things, traces follow one request across services, and alerts wake someone up. The discipline is alerting on symptoms users feel, not on every anomaly.',
        why: 'Alerting on everything trains people to ignore alerts. Alerting on nothing means your users are the monitoring system.',
        analogy: 'Dashboard warning lights. A light for every sensor is noise. A light for "you are about to be stranded" gets acted on.',
        points: [
          ['Logs', 'what happened, with enough context to reconstruct it'],
          ['Metrics', 'error rate, latency, throughput, saturation'],
          ['Traces', 'one request followed across every service it touched'],
          'Alert on user-visible symptoms, not internal curiosities',
          'Every alert needs a documented action, or delete it',
          'Structured logs are searchable; free-text logs are not'
        ],
        lang: 'js',
        code: 'const requests = [\n  { path: "/api/orders", ms: 42,   status: 200 },\n  { path: "/api/orders", ms: 38,   status: 200 },\n  { path: "/api/orders", ms: 2100, status: 500 },\n  { path: "/api/parts",  ms: 61,   status: 200 },\n  { path: "/api/orders", ms: 1890, status: 500 }\n];\n\nlet errors = 0;\nlet totalMs = 0;\nlet slowest = 0;\n\nfor (const r of requests) {\n  totalMs = totalMs + r.ms;\n  if (r.status >= 500) errors = errors + 1;\n  if (r.ms > slowest) slowest = r.ms;\n\n  const level = r.status >= 500 ? "ERROR" : "info";\n  console.log(level + "  " + r.path + "  " + r.status + "  " + r.ms + "ms");\n}\n\nconst errorRate = errors / requests.length * 100;\nconsole.log("");\nconsole.log("error rate: " + errorRate + "%");\nconsole.log("avg latency: " + totalMs / requests.length + "ms");\nconsole.log("slowest: " + slowest + "ms");\n\nif (errorRate > 5) {\n  console.log("ALERT: error rate above the 5% threshold. Page the on-call engineer");\n}',
        notes: {
          12: 'Metrics are accumulated as requests flow through, not computed later.',
          17: 'Log level chosen from the outcome, so filtering for real problems works.',
          22: 'The number that matters to users, not the raw count.',
          29: 'A threshold with a defined action. That is what makes it an alert and not a chart.'
        },
        terms: ['Monitoring', 'Logging', 'Metrics', 'Alerting', 'Observability'],
        callout: { kind: 'note', text: 'Averages hide pain. A 200ms average can mean everyone is fine, or that 90% are instant and 10% are timing out. Track percentiles.' }
      },
      {
        id: 'ship-next',
        title: 'What to build next',
        goal: 'Choose a project that actually teaches you something.',
        plain: 'Tutorials teach recognition. Projects teach recall. The gap between following along and building something from a blank file is where the actual learning happens, and it is uncomfortable on purpose. Pick something small, finish it, then make it slightly harder.',
        why: 'Most people stall by starting something too large, getting 40 percent in, and losing the thread. Finished small things compound; unfinished large ones do not.',
        analogy: 'Learning to weld by making a small bracket that holds, rather than starting on a trailer frame.',
        points: [
          'Finish something small before starting something big',
          'Rebuild the same project in a second language to see what is essential',
          'Add one uncomfortable requirement each time: tests, auth, a database, deployment',
          'Read other people\'s code; it is the fastest way to learn idiom',
          'Ship it publicly, even if it is small. Deployment teaches its own lessons.'
        ],
        lang: 'none',
        codeBlock: 'STEP 1: a single file\n  a calculator, a unit converter, a countdown timer\n  learns: variables, conditionals, functions, DOM events\n\nSTEP 2: data that persists\n  a task list, a bookmark manager, an inventory tracker\n  learns: arrays of objects, rendering from state, storage\n\nSTEP 3: talking to something else\n  a weather board, a currency converter, a GitHub profile viewer\n  learns: HTTP, JSON, async, error and loading states\n\nSTEP 4: your own backend\n  a link shortener, a notes API, a form-submission endpoint\n  learns: routes, a database, validation, environment variables\n\nSTEP 5: accounts and deployment\n  add login and ownership checks, then deploy it publicly\n  learns: hashing, sessions, authorization, CI, DNS, TLS\n\nSTEP 6: do it again, differently\n  rebuild step 4 in C++ or Java\n  learns: which parts were the language and which were the ideas',
        terms: ['Project', 'Portfolio', 'Practice'],
        callout: { kind: 'tip', text: 'Step 6 is the one people skip and the one that turns knowledge into understanding. The ideas that survive a language change are the real ones.' }
      }
    ]
  }
  );
})(window);
