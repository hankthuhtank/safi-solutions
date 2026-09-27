/* Curriculum part 2 — JavaScript, HTML, CSS, the DOM */
(function (W) {
  W.CURRICULUM = W.CURRICULUM || { modules: [] };
  W.CURRICULUM.modules.push(

  /* ============================================================ 03 */
  {
    id: 'javascript', code: 'CS-03', title: 'JavaScript',
    tag: 'Language',
    blurb: 'The only language a browser runs. Loose where C++ is strict, and the glue for almost everything on the web.',
    lessons: [
      {
        id: 'js-first',
        title: 'JavaScript basics',
        goal: 'Declare values and print them, and know when to use const.',
        plain: 'JavaScript does not make you declare types. You choose between const for a value that never gets reassigned and let for one that does. Default to const; reach for let only when you actually need to change the binding. var is the old form and modern code avoids it.',
        why: 'Using const by default turns a whole class of accidental reassignment bugs into an immediate error, and it tells the next reader that this value is stable.',
        analogy: 'const is a label glued to a box. let is a label on a clip you can move to another box.',
        points: [
          ['const', 'cannot be pointed at something else afterwards'],
          ['let', 'can be reassigned'],
          'No type declarations; the value decides the type',
          'Types can change at runtime, which is powerful and dangerous',
          'typeof tells you what something currently is'
        ],
        lang: 'js',
        code: 'const shopName = "Safi Hardware";\nlet openTickets = 3;\n\nconsole.log(shopName);\nconsole.log("Open tickets: " + openTickets);\n\nopenTickets = openTickets - 1;\nconsole.log("After closing one: " + openTickets);\n\nconst mixed = 5 + "5";\nconsole.log("5 + \\"5\\" is " + mixed);',
        notes: {
          0: 'Never reassigned, so const is the right choice.',
          1: 'This value changes later, so it must be let.',
          6: 'Allowed, because openTickets was declared with let.',
          9: 'A number plus a string gives "55". JavaScript converted rather than complained.'
        },
        terms: ['Variable', 'Type Coercion', 'Scope'],
        challenge: {
          prompt: 'Make the last line print the number 10 instead of the text "55".',
          check: { outputContains: '10' },
          hint: 'Use Number("5") so both sides are numbers before adding.'
        }
      },
      {
        id: 'js-functions',
        title: 'Functions and arrow functions',
        goal: 'Write both function forms and pass one into another function.',
        plain: 'JavaScript has the classic function keyword and the shorter arrow form. Both do the same job. Crucially, functions are values: you can store one in a variable, pass it as an argument, or return it from another function. That single property is what makes most modern JavaScript work.',
        why: 'Every time you write a click handler, sort with a custom rule, or transform a list, you are passing a function to another function.',
        analogy: 'Handing someone a set of instructions rather than a finished result, so they can run it whenever they are ready.',
        points: [
          'function name(a, b) { return a + b; }',
          ['const name = (a, b) => a + b;', 'implicit return for one expression'],
          'Functions can be stored, passed, and returned',
          'A function passed to another function is a callback',
          'Arrow functions are shorter but do not have their own this'
        ],
        lang: 'js',
        code: 'function applyTax(amount) {\n  return amount * 1.0825;\n}\n\nconst round2 = (n) => Math.round(n * 100) / 100;\n\nfunction priceLine(label, amount, transform) {\n  const finalAmount = transform(amount);\n  return label + ": " + round2(finalAmount);\n}\n\nconsole.log(priceLine("Widget", 19.99, applyTax));\nconsole.log(priceLine("Bulk",   19.99, (n) => n * 0.8));',
        notes: {
          0: 'A named function declaration.',
          4: 'An arrow function stored in a const. Same idea, shorter shape.',
          6: 'transform is a parameter that happens to hold a function.',
          7: 'Calling the function that was handed in, without knowing which one it is.',
          11: 'Passing applyTax by name. Note there are no brackets, because we are passing it, not calling it.',
          12: 'Passing a brand new function defined right here at the call site.'
        },
        terms: ['Function', 'Callback', 'First-class Function'],
        callout: { kind: 'note', text: 'Line 11 passes applyTax. Line 12 passes a discount. The priceLine function never changes; its behaviour does.' }
      },
      {
        id: 'js-arrays-objects',
        title: 'Arrays and objects',
        goal: 'Model real data with the two core JavaScript structures.',
        plain: 'An array is an ordered list reached by position. An object is a set of named properties reached by key. Almost all real data is a combination: an array of objects. Learn to read that shape and most APIs stop looking mysterious.',
        why: 'Every JSON response you will ever handle is arrays and objects nested inside each other. This is the single most useful data literacy in web work.',
        analogy: 'An array is a numbered queue. An object is a labelled form. An array of objects is a stack of filled-in forms.',
        points: [
          ['[1, 2, 3]', 'an array, positions start at 0'],
          ['{ name: "x", price: 2 }', 'an object with named keys'],
          'obj.key or obj["key"] to read a property',
          'arr.length for the count; arr.push(x) to append',
          'An array of objects is the standard shape of real data'
        ],
        lang: 'js',
        code: 'const cart = [\n  { sku: "BLT-12", qty: 4, price: 0.35 },\n  { sku: "NUT-08", qty: 10, price: 0.12 },\n  { sku: "BRG-22", qty: 1, price: 14.50 }\n];\n\nconsole.log("Lines in cart: " + cart.length);\nconsole.log("First sku: " + cart[0].sku);\n\nlet total = 0;\nfor (let i = 0; i < cart.length; i++) {\n  const line = cart[i];\n  const lineTotal = line.qty * line.price;\n  console.log(line.sku + " x" + line.qty + " = " + lineTotal);\n  total = total + lineTotal;\n}\n\nconsole.log("Cart total: " + total);',
        notes: {
          0: 'An array whose items happen to be objects. This is the standard shape.',
          6: 'length counts the objects, not their contents.',
          7: 'Position 0 gets the first object, then .sku reads a property of it.',
          11: 'Naming the current item makes the next lines far easier to read.',
          15: 'Accumulating into a variable declared outside the loop.'
        },
        terms: ['Array', 'Object', 'JSON', 'Property'],
        challenge: {
          prompt: 'Print only the lines that cost more than 1.00 in total. Expected output mentions BRG-22.',
          check: { outputContains: 'BRG-22' },
          hint: 'Wrap the console.log inside if (lineTotal > 1).'
        }
      },
      {
        id: 'js-loops',
        title: 'Loops and list transformations',
        goal: 'Transform, filter, and total a list.',
        plain: 'Three operations cover most list work. Mapping turns every item into something else. Filtering keeps only the ones that pass a test. Reducing collapses the whole list into a single value. You can do all three with plain loops, and understanding the loop version first makes the shorthand versions obvious later.',
        why: 'Once you see that almost all data work is map, filter, or reduce, unfamiliar code becomes readable because you recognise the shape.',
        analogy: 'A production line: one station reshapes every item, one rejects the bad ones, one weighs whatever is left.',
        points: [
          ['Map', 'same number of items, each transformed'],
          ['Filter', 'fewer items, none changed'],
          ['Reduce', 'one result from many items'],
          'for...of walks values; for...in walks keys',
          'Build a new array rather than editing while looping'
        ],
        lang: 'js',
        code: 'const temps = [18, 24, 31, 12, 27];\n\nconst inF = [];\nfor (const c of temps) {\n  inF.push(c * 9 / 5 + 32);\n}\nconsole.log("Mapped:   " + inF);\n\nconst hot = [];\nfor (const c of temps) {\n  if (c >= 25) hot.push(c);\n}\nconsole.log("Filtered: " + hot);\n\nlet sum = 0;\nfor (const c of temps) {\n  sum = sum + c;\n}\nconsole.log("Reduced:  " + sum);\nconsole.log("Average:  " + sum / temps.length);',
        notes: {
          2: 'A fresh array. The original is never modified.',
          3: 'for...of gives you each value directly, no index needed.',
          9: 'Same loop shape, but with a test controlling whether we keep it.',
          15: 'One accumulator outside, updated on every pass. That is a reduce.'
        },
        terms: ['Iteration', 'Map', 'Filter', 'Reduce'],
        challenge: {
          prompt: 'Print the highest temperature (31).',
          check: { outputContains: '31' },
          hint: 'Track a max variable starting at temps[0] and compare inside the loop.'
        }
      },
      {
        id: 'js-scope',
        title: 'Scope and the call stack',
        goal: 'Predict which variables are visible where.',
        plain: 'A variable is visible inside the block where it was declared, and inside anything nested within it. Inner code can see outward; outer code cannot see inward. When a function is called, a new frame is pushed onto the call stack with its own variables, and it is popped when the function returns.',
        why: 'Almost every "x is not defined" error is a scope question, and almost every stack trace is a call stack printed out. Reading both correctly turns a scary error into a two-second fix.',
        analogy: 'Nested rooms with one-way glass. From inside you see out. From outside you cannot see in.',
        points: [
          ['Block scope', 'let and const live inside their { }'],
          'Inner sees outer; outer never sees inner',
          'Each call gets a fresh frame with its own copies',
          'Shadowing is when an inner name hides an outer one',
          'A stack trace is the call stack at the moment things broke, read bottom-up'
        ],
        lang: 'js',
        code: 'const appName = "Bench";\n\nfunction outer(count) {\n  const label = "outer";\n\n  function inner(multiplier) {\n    const result = count * multiplier;\n    return appName + " " + label + " -> " + result;\n  }\n\n  return inner(3);\n}\n\nconsole.log(outer(7));\nconsole.log(outer(2));',
        notes: {
          0: 'Top level. Visible absolutely everywhere below.',
          3: 'Visible inside outer and anything defined inside outer.',
          6: 'inner can reach count and label even though it never received them.',
          10: 'Two frames now exist: outer, and inner on top of it.',
          13: 'A second, completely separate call. count starts fresh at 2.'
        },
        terms: ['Scope', 'Closure', 'Call Stack', 'Shadowing'],
        callout: { kind: 'note', text: 'Scrub this one. The call stack panel shows global, then outer, then inner, then unwinds. That stack is exactly what an error trace prints.' }
      },
      {
        id: 'js-async',
        title: 'Why JavaScript waits without freezing',
        goal: 'Explain the difference between blocking and asynchronous work.',
        plain: 'A browser has one thread for your code. If you sat and waited for a network response, the page would freeze completely. Instead JavaScript hands slow work to the environment, carries on, and runs your callback later when the result arrives. That is why code after a request often runs before the response.',
        why: 'The classic bug is printing a variable right after starting a request and finding it empty. Nothing is broken; the answer simply had not arrived yet.',
        analogy: 'Ordering at a counter with a buzzer. You do not stand at the till blocking the queue. You sit down, and the buzzer calls you back.',
        points: [
          'One thread, so blocking it freezes the whole page',
          'Slow work is handed off and a callback runs later',
          'Code after the request usually runs first',
          'Promises and async/await are nicer syntax for the same waiting',
          'Order in the file is not order of execution'
        ],
        lang: 'js',
        code: 'function fetchPrice(sku, whenReady) {\n  console.log("2. asking the server for " + sku);\n  whenReady(sku, 14.5);\n}\n\nfunction showPrice(sku, price) {\n  console.log("4. the answer arrived: " + sku + " = " + price);\n}\n\nconsole.log("1. before the request");\nfetchPrice("BRG-22", showPrice);\nconsole.log("3. after the request (this really does run early in real code)");',
        notes: {
          0: 'whenReady is a callback: a function to run once the answer exists.',
          5: 'This is defined now but does not run now.',
          9: 'Runs first.',
          10: 'Starts the work and hands over what to do afterwards.',
          11: 'In a real network call this line runs BEFORE the answer arrives.'
        },
        terms: ['Asynchronous', 'Callback', 'Promise', 'Event Loop'],
        callout: { kind: 'warn', text: 'This sample runs the callback immediately so you can trace it. Over a real network, step 4 would land after step 3, which is the whole lesson.' }
      }
    ]
  },

  /* ============================================================ 04 */
  {
    id: 'html', code: 'CS-04', title: 'HTML',
    tag: 'The web',
    blurb: 'Structure and meaning. Not appearance. That comes next.',
    lessons: [
      {
        id: 'html-structure',
        title: 'The shape of every page',
        goal: 'Write a valid HTML document from memory.',
        plain: 'An HTML document has a doctype, an html element, a head for information about the page, and a body for what people see. Elements are written as an opening tag, content, and a closing tag. Some elements are empty and close themselves.',
        why: 'Every web page in the world has this skeleton. Once it is automatic, you can spend your attention on the content instead of the container.',
        analogy: 'A parcel. The head is the shipping label nobody unpacks; the body is what is inside.',
        points: [
          ['<!doctype html>', 'tells the browser to use modern rules'],
          ['<head>', 'title, character set, stylesheets, metadata'],
          ['<body>', 'everything the visitor actually sees'],
          '<meta charset="utf-8"> prevents mangled characters',
          'The viewport meta tag is what makes mobile layout behave'
        ],
        lang: 'html',
        preview: true,
        code: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Safi Hardware</title>\n</head>\n<body>\n  <h1>Safi Hardware</h1>\n  <p>Fasteners, fixings and bearings since 1994.</p>\n  <hr>\n  <p>Open Monday to Saturday.</p>\n</body>\n</html>',
        notes: {
          0: 'Not a tag exactly, but a required instruction to the browser.',
          1: 'lang helps screen readers pronounce the page correctly.',
          3: 'Without this, accented characters and symbols can break.',
          4: 'Removing this line is why some sites look tiny on phones.',
          10: 'A self-closing element. There is no </hr>.'
        },
        terms: ['HTML', 'Element', 'Tag', 'Document'],
        challenge: {
          prompt: 'Add a second heading and a list of three products below the paragraph.',
          check: { htmlContains: ['<ul', '<li'] },
          hint: 'Use <h2>Products</h2> then a <ul> containing three <li> items.'
        }
      },
      {
        id: 'html-semantics',
        title: 'Semantic elements',
        goal: 'Choose elements by meaning rather than by appearance.',
        plain: 'A div means nothing. A nav, main, article, or footer tells the browser, search engines, and screen readers what a region actually is. Picking the meaningful element is free, and it makes the page work for people who cannot see it.',
        why: 'Accessibility and search visibility both come almost entirely from using the right element. A page built from nothing but divs is invisible to assistive technology.',
        analogy: 'Labelled drawers versus a pile of identical unmarked boxes. Both hold things; only one is usable by someone else.',
        points: [
          '<header>, <nav>, <main>, <article>, <aside>, <footer>',
          'One <main> per page, containing the primary content',
          'Headings must descend in order: h1, then h2, then h3',
          'Use <button> for actions and <a> for navigation',
          'Every <img> needs alt text, or alt="" if purely decorative'
        ],
        lang: 'html',
        preview: true,
        code: '<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>Parts catalogue</title></head>\n<body>\n\n  <header>\n    <h1>Parts catalogue</h1>\n    <nav>\n      <a href="#bolts">Bolts</a> ·\n      <a href="#bearings">Bearings</a>\n    </nav>\n  </header>\n\n  <main>\n    <article id="bolts">\n      <h2>Bolts</h2>\n      <p>Grade 8 hex bolts in imperial and metric.</p>\n    </article>\n\n    <article id="bearings">\n      <h2>Bearings</h2>\n      <p>Sealed and shielded, 6000 through 6300 series.</p>\n    </article>\n  </main>\n\n  <footer>\n    <p>Paris, Texas · (903) 555-0100</p>\n  </footer>\n\n</body>\n</html>',
        notes: {
          5: 'Identifies the top region. Screen readers can jump straight past it.',
          7: 'Marks these links as the site navigation, not just links in a paragraph.',
          13: 'The primary content. Assistive tech offers a "skip to main" jump.',
          14: 'id lets a link target this exact section.',
          25: 'Contact and legal information belongs here.'
        },
        terms: ['Semantic HTML', 'Accessibility', 'ARIA', 'SEO'],
        callout: { kind: 'tip', text: 'A fast test: hide your stylesheet. If the page still reads sensibly top to bottom, your HTML is doing its job.' }
      },
      {
        id: 'html-text',
        title: 'Text, links, and images',
        goal: 'Mark up content correctly, including alt text.',
        plain: 'Headings create the document outline. Paragraphs hold prose. Lists hold sequences, ordered when the order matters. Links navigate. Images need alt text describing what they show, because that text is what a blind visitor receives and what appears when the file fails to load.',
        why: 'Alt text is legally required in many contexts and is trivially easy. Skipping it excludes real people from your page for no benefit.',
        analogy: 'Alt text is reading the picture aloud to someone on the phone.',
        points: [
          'h1 once per page, then h2 and h3 in order',
          '<ul> for unordered, <ol> when sequence matters',
          '<a href="..."> for navigation, with link text that makes sense alone',
          ['<img src alt>', 'alt describes the content, not the file'],
          'Avoid "click here"; a screen reader may list links out of context'
        ],
        lang: 'html',
        preview: true,
        code: '<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>Fitting a bearing</title></head>\n<body>\n  <h1>Fitting a sealed bearing</h1>\n\n  <p>Takes about ten minutes with the right tools.</p>\n\n  <h2>You will need</h2>\n  <ul>\n    <li>Bearing puller</li>\n    <li>Soft-faced mallet</li>\n    <li>Clean grease</li>\n  </ul>\n\n  <h2>Steps</h2>\n  <ol>\n    <li>Clean and inspect the housing.</li>\n    <li>Press the new bearing in squarely.</li>\n    <li>Check it spins freely before reassembly.</li>\n  </ol>\n\n  <p>See the <a href="/torque-specs">torque specification chart</a> before final tightening.</p>\n</body>\n</html>',
        notes: {
          4: 'The one h1. It describes the whole page.',
          8: 'An h2 under the h1. Never skip straight to h3.',
          9: 'Unordered, because the tools have no required sequence.',
          15: 'Ordered, because doing step 3 first would be wrong.',
          21: 'The link text describes the destination and works read out of context.'
        },
        terms: ['Heading', 'Hyperlink', 'Alt Text', 'Accessibility'],
        challenge: {
          prompt: 'Add a fourth step to the ordered list.',
          check: { htmlContains: ['<li'] },
          hint: 'Add one more <li>...</li> inside the <ol>.'
        }
      },
      {
        id: 'html-forms',
        title: 'Forms and inputs',
        goal: 'Build an accessible form that a server could actually receive.',
        plain: 'A form collects input and sends it somewhere. Every input needs a label tied to it by matching the label\'s for attribute to the input\'s id, so clicking the label focuses the field and a screen reader announces it. The name attribute is the key the server receives.',
        why: 'Unlabelled inputs are the most common accessibility failure on the web, and a missing name attribute means the field silently never reaches the server.',
        analogy: 'A paper form where each blank has a printed caption. Remove the captions and nobody knows what to write.',
        points: [
          '<label for="x"> paired with <input id="x">',
          'name= is the key sent to the server',
          'type= drives the mobile keyboard and free validation',
          'required, min, max, pattern give validation with no code',
          'Never trust the browser; validate again on the server'
        ],
        lang: 'html',
        preview: true,
        code: '<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>Quote request</title></head>\n<body>\n  <h1>Request a quote</h1>\n\n  <form action="/quote" method="post">\n\n    <p>\n      <label for="name">Your name</label><br>\n      <input id="name" name="name" type="text" required>\n    </p>\n\n    <p>\n      <label for="email">Email</label><br>\n      <input id="email" name="email" type="email" required>\n    </p>\n\n    <p>\n      <label for="qty">Quantity</label><br>\n      <input id="qty" name="qty" type="number" min="1" max="500" value="10">\n    </p>\n\n    <p>\n      <label for="notes">Notes</label><br>\n      <textarea id="notes" name="notes" rows="3"></textarea>\n    </p>\n\n    <button type="submit">Send request</button>\n  </form>\n</body>\n</html>',
        notes: {
          6: 'action is where it goes, method is how. Use post for anything that changes data.',
          9: 'for="name" matches the input id below, which links them.',
          10: 'name="name" is the key the server reads. required blocks empty submission.',
          15: 'type="email" gives a free format check and the right phone keyboard.',
          20: 'min and max are enforced by the browser at no cost to you.'
        },
        terms: ['Form', 'Input', 'Validation', 'POST'],
        callout: { kind: 'warn', text: 'Browser validation is a convenience for honest users. Anyone can bypass it with one command. The server must check again.' }
      }
    ]
  },

  /* ============================================================ 05 */
  {
    id: 'css', code: 'CS-05', title: 'CSS',
    tag: 'The web',
    blurb: 'Appearance and layout. The part everyone finds hardest, made concrete.',
    lessons: [
      {
        id: 'css-basics',
        title: 'Selectors and the cascade',
        goal: 'Predict which rule wins when two rules conflict.',
        plain: 'CSS is a list of rules: a selector picking elements, and declarations changing them. When two rules target the same thing, the more specific one wins. An id beats a class, a class beats an element name, and if specificity ties, whichever comes last wins.',
        why: 'Nearly every "why won\'t this change" moment is a specificity problem. Knowing the ranking turns a mystery into arithmetic.',
        analogy: 'Company policy versus department policy versus your manager standing in front of you. The most specific instruction wins.',
        points: [
          ['element { }', 'every element of that type'],
          ['.class { }', 'anything carrying that class'],
          ['#id { }', 'the one element with that id'],
          'Specificity: id > class > element',
          'Equal specificity means the later rule wins',
          '!important overrides everything and is usually a symptom'
        ],
        lang: 'html',
        preview: true,
        code: '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<style>\n  body { font-family: system-ui, sans-serif; padding: 24px; }\n\n  p            { color: #555; }\n  .highlight   { color: #b45309; font-weight: 600; }\n  #headline    { color: #0f766e; font-size: 24px; }\n\n  .card {\n    border: 2px solid #d6d3d1;\n    border-radius: 10px;\n    padding: 16px;\n    max-width: 380px;\n  }\n</style>\n</head>\n<body>\n  <p id="headline" class="highlight">All three rules target me. Which wins?</p>\n  <p class="highlight">Class beats plain element.</p>\n  <p>Just an element rule.</p>\n\n  <div class="card">\n    <p>Paragraph inside a card.</p>\n  </div>\n</body>\n</html>',
        notes: {
          6: 'Lowest specificity. Applies to every paragraph unless overridden.',
          7: 'A class. Beats the plain element rule.',
          8: 'An id. Beats both, so the first paragraph is teal, not amber.',
          19: 'Carries id AND class, but the id rule wins the colour.'
        },
        terms: ['CSS', 'Selector', 'Specificity', 'Cascade'],
        challenge: {
          prompt: 'Make every paragraph inside .card render in italic.',
          check: { htmlContains: ['italic'] },
          hint: 'Add a rule: .card p { font-style: italic; }'
        }
      },
      {
        id: 'css-box',
        title: 'The box model',
        goal: 'Explain why an element is wider than you set it.',
        plain: 'Every element is a box with content, padding inside the border, the border itself, and margin outside pushing other things away. By default, width sets only the content, so padding and border are added on top. Setting box-sizing: border-box makes width mean the whole box, which is almost always what you meant.',
        why: 'The "why is my 300px box 340px wide" question has confused people for twenty years. It is this, every time.',
        analogy: 'A framed picture. The photo is content, the mount is padding, the frame is border, and the gap to the next frame on the wall is margin.',
        points: [
          'content → padding → border → margin, from the inside out',
          'Padding is inside the border; margin is outside it',
          'Default box-sizing adds padding and border on top of width',
          'border-box makes width include padding and border',
          'Vertical margins between siblings collapse into the larger one'
        ],
        lang: 'html',
        preview: true,
        code: '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<style>\n  body { font-family: system-ui, sans-serif; padding: 20px; background: #faf9f7; }\n\n  .box {\n    width: 240px;\n    padding: 20px;\n    border: 6px solid #78716c;\n    margin-bottom: 16px;\n    background: #fef3c7;\n  }\n\n  .fixed {\n    box-sizing: border-box;\n    background: #d1fae5;\n  }\n</style>\n</head>\n<body>\n  <div class="box">width 240, but I actually occupy 292px across.</div>\n  <div class="box fixed">width 240 with border-box, so I occupy exactly 240px.</div>\n</body>\n</html>',
        notes: {
          7: 'This sets the CONTENT width only, by default.',
          8: '20px on each side adds 40px total.',
          9: '6px on each side adds another 12px. 240 + 40 + 12 = 292.',
          15: 'Now width means the whole box. Padding and border eat into the 240 instead of adding to it.'
        },
        terms: ['Box Model', 'Padding', 'Margin', 'Border'],
        callout: { kind: 'tip', text: 'Most real projects put *, *::before, *::after { box-sizing: border-box; } at the very top and never think about it again.' }
      },
      {
        id: 'css-flex',
        title: 'Flexbox',
        goal: 'Lay elements out in a row or column and control the spacing.',
        plain: 'Flexbox arranges children along one axis. Set display: flex on the parent, and the children line up in a row by default. justify-content spaces them along that axis; align-items positions them across it; gap sets the space between without margin tricks.',
        why: 'Flexbox replaced twenty years of float hacks. Navigation bars, toolbars, card rows, and centring are all one line each now.',
        analogy: 'A shelf where you decide how the books are spaced: pushed left, spread evenly, or pinned to both ends.',
        points: [
          'display: flex on the PARENT, not the children',
          'flex-direction: row (default) or column',
          ['justify-content', 'spacing along the main axis'],
          ['align-items', 'position across the other axis'],
          ['gap', 'clean spacing between items'],
          'flex: 1 on a child makes it absorb the leftover space'
        ],
        lang: 'html',
        preview: true,
        code: '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<style>\n  body { font-family: system-ui, sans-serif; padding: 20px; }\n  .bar {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    gap: 12px;\n    background: #1c1917;\n    color: #fafaf9;\n    padding: 12px 16px;\n    border-radius: 8px;\n  }\n  .grow { flex: 1; }\n\n  .row { display: flex; gap: 12px; margin-top: 20px; }\n  .cell {\n    flex: 1;\n    padding: 20px;\n    background: #e7e5e4;\n    border-radius: 8px;\n    text-align: center;\n  }\n  .wide { flex: 2; background: #fed7aa; }\n</style>\n</head>\n<body>\n  <div class="bar">\n    <strong>Safi</strong>\n    <span class="grow">search…</span>\n    <button>Sign in</button>\n  </div>\n\n  <div class="row">\n    <div class="cell">flex 1</div>\n    <div class="cell wide">flex 2: twice the leftover space</div>\n    <div class="cell">flex 1</div>\n  </div>\n</body>\n</html>',
        notes: {
          7: 'Turns .bar into a flex container. Its children now line up.',
          8: 'Pushes the first item left and the last right.',
          9: 'Centres them vertically, so the button lines up with the text.',
          16: 'This child absorbs all the leftover width.',
          26: 'flex: 2 takes twice the share of the leftover space that flex: 1 does.'
        },
        terms: ['Flexbox', 'Layout', 'Alignment'],
        challenge: {
          prompt: 'Change the .row so the three cells stack vertically instead of sitting in a line.',
          check: { htmlContains: ['column'] },
          hint: 'Add flex-direction: column to .row.'
        }
      },
      {
        id: 'css-grid',
        title: 'Grid and responsive layout',
        goal: 'Build a layout that reflows on a narrow screen.',
        plain: 'Grid works in two dimensions at once, rows and columns together. You define the tracks on the parent and the children drop into place. Combined with a media query, or with auto-fit and minmax, the layout can rearrange itself for small screens without you writing separate pages.',
        why: 'Most traffic is on phones. A layout that only works at desktop width is broken for the majority of your visitors.',
        analogy: 'A pegboard. You define the holes, and the tools hang wherever they fit.',
        points: [
          'display: grid with grid-template-columns to define tracks',
          'fr is a fraction of the leftover space',
          'repeat(3, 1fr) means three equal columns',
          'auto-fit with minmax reflows with no media query at all',
          '@media (max-width: 700px) targets narrow screens',
          'gap works in grid exactly as it does in flex'
        ],
        lang: 'html',
        preview: true,
        code: '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<style>\n  body { font-family: system-ui, sans-serif; padding: 20px; }\n\n  .auto {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));\n    gap: 12px;\n  }\n\n  .page {\n    display: grid;\n    grid-template-columns: 200px 1fr;\n    gap: 12px;\n    margin-top: 20px;\n  }\n\n  @media (max-width: 700px) {\n    .page { grid-template-columns: 1fr; }\n  }\n\n  .tile { background: #e0f2fe; padding: 18px; border-radius: 8px; }\n  .side { background: #fce7f3; padding: 18px; border-radius: 8px; }\n</style>\n</head>\n<body>\n  <div class="auto">\n    <div class="tile">Bolts</div>\n    <div class="tile">Nuts</div>\n    <div class="tile">Washers</div>\n    <div class="tile">Bearings</div>\n  </div>\n\n  <div class="page">\n    <div class="side">Sidebar</div>\n    <div class="tile">Main content area</div>\n  </div>\n</body>\n</html>',
        notes: {
          9: 'Fit as many columns as possible, each at least 150px, sharing the rest equally. This is responsive with zero media queries.',
          15: 'A fixed 200px sidebar and a main column taking everything left.',
          20: 'Below 700px wide, collapse to a single column so the sidebar stacks on top.'
        },
        terms: ['CSS Grid', 'Responsive Design', 'Media Query', 'Mobile First'],
        callout: { kind: 'tip', text: 'Drag the preview divider narrower and watch the auto-fit row reflow. No media query is doing that.' }
      }
    ]
  },

  /* ============================================================ 06 */
  {
    id: 'dom', code: 'CS-06', title: 'The DOM',
    tag: 'The web',
    blurb: 'Where HTML, CSS, and JavaScript finally meet and the page starts responding.',
    lessons: [
      {
        id: 'dom-select',
        title: 'Finding and changing elements',
        goal: 'Select an element and change its content from JavaScript.',
        plain: 'When a page loads, the browser turns your HTML into a tree of objects called the DOM. JavaScript can search that tree, read from it, and change it, and the screen updates immediately. Your HTML file is the starting state; the DOM is what is live right now.',
        why: 'Understanding that the DOM is a live tree, not your file, explains why editing HTML in DevTools does not save, and why a refresh throws your changes away.',
        analogy: 'The HTML file is the blueprint. The DOM is the actual building, which you can knock walls through while people are inside.',
        points: [
          ['document.querySelector("#id")', 'the first match, using CSS syntax'],
          ['document.querySelectorAll(".class")', 'every match'],
          '.textContent sets text safely',
          '.innerHTML parses HTML and is unsafe with untrusted input',
          'Changing the DOM does not change your file'
        ],
        lang: 'html',
        preview: true,
        code: '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<style>\n  body { font-family: system-ui, sans-serif; padding: 24px; }\n  .stat { font-size: 28px; font-weight: 700; color: #0f766e; }\n</style>\n</head>\n<body>\n  <h1 id="title">Loading…</h1>\n  <p>Bolts in stock: <span id="count" class="stat">0</span></p>\n  <ul id="list"></ul>\n\n  <script>\n    const title = document.querySelector("#title");\n    const count = document.querySelector("#count");\n    const list  = document.querySelector("#list");\n\n    title.textContent = "Stock report";\n    count.textContent = "1,284";\n\n    const parts = ["Hex bolt M8", "Hex bolt M10", "Carriage bolt"];\n    for (const part of parts) {\n      const li = document.createElement("li");\n      li.textContent = part;\n      list.appendChild(li);\n    }\n  <\/script>\n</body>\n</html>',
        notes: {
          10: 'The starting text. It is replaced before you ever see it.',
          15: 'Searching the live tree using the same syntax as a CSS selector.',
          19: 'The heading on screen changes the instant this line runs.',
          24: 'Creating a brand new element that exists only in memory so far.',
          26: 'Attaching it to the tree is what makes it appear.'
        },
        terms: ['DOM', 'Element', 'Selector', 'Node'],
        challenge: {
          prompt: 'Add a fourth part to the list.',
          check: { htmlContains: ['parts'] },
          hint: 'Add one more string to the parts array.'
        }
      },
      {
        id: 'dom-events',
        title: 'Events',
        goal: 'Run code in response to something the user does.',
        plain: 'An event is something that happened: a click, a keypress, a form submission. You register a listener saying which element, which event, and what to run. The browser calls your function and hands it an event object describing what occurred.',
        why: 'This is the moment a page becomes an application. Everything interactive on the web is elements, events, and functions that change the DOM.',
        analogy: 'A doorbell. You wire it once and then get on with your day. The wiring calls you when someone arrives.',
        points: [
          'element.addEventListener("click", handler)',
          'The handler receives an event object with details',
          'event.preventDefault() stops the browser default, like a form reloading the page',
          'Events bubble up to parents, which lets one listener cover many children',
          'Read the current value from the element inside the handler, not before'
        ],
        lang: 'html',
        preview: true,
        code: '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<style>\n  body { font-family: system-ui, sans-serif; padding: 24px; }\n  button { padding: 10px 14px; font: inherit; cursor: pointer; }\n  #out { margin-top: 16px; font-size: 22px; font-weight: 700; }\n</style>\n</head>\n<body>\n  <h1>Order counter</h1>\n\n  <button id="minus">−1</button>\n  <button id="plus">+1</button>\n  <button id="reset">Reset</button>\n\n  <div id="out">0</div>\n\n  <script>\n    let quantity = 0;\n    const out = document.querySelector("#out");\n\n    function render() {\n      out.textContent = quantity;\n    }\n\n    document.querySelector("#plus").addEventListener("click", () => {\n      quantity = quantity + 1;\n      render();\n    });\n\n    document.querySelector("#minus").addEventListener("click", () => {\n      if (quantity > 0) quantity = quantity - 1;\n      render();\n    });\n\n    document.querySelector("#reset").addEventListener("click", () => {\n      quantity = 0;\n      render();\n    });\n  <\/script>\n</body>\n</html>',
        notes: {
          19: 'The single source of truth. The screen is derived from this, never the reverse.',
          22: 'One function that redraws from state. Every handler ends by calling it.',
          26: 'Wire the button once. The arrow function runs on every click afterwards.',
          31: 'The rule lives here, so the count can never go negative.'
        },
        terms: ['Event', 'Event Listener', 'State', 'Bubbling'],
        callout: { kind: 'note', text: 'Change state, then re-render from state. That single pattern is the seed of React, Vue, and every framework you will meet.' }
      },
      {
        id: 'dom-forms',
        title: 'Reading form input',
        goal: 'Take what a user typed and respond to it.',
        plain: 'A form submission normally reloads the page. Calling preventDefault stops that so you can handle it in JavaScript instead: read the values, validate them, and update the page. This is the front half of every web app that has ever asked you for anything.',
        why: 'Without preventDefault the page reloads, your JavaScript state resets, and it looks like nothing happened. It is a five-minute bug that eats afternoons.',
        analogy: 'Intercepting the mail before it goes in the postbox, so you can check it first.',
        points: [
          'listen for "submit" on the form, not "click" on the button',
          'event.preventDefault() stops the page reloading',
          'input.value is always a string, even for type="number"',
          'Number(x) converts; check for NaN afterwards',
          'Show errors near the field, not in an alert box'
        ],
        lang: 'html',
        preview: true,
        code: '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<style>\n  body { font-family: system-ui, sans-serif; padding: 24px; max-width: 420px; }\n  label { display: block; font-weight: 600; margin-top: 12px; }\n  input { width: 100%; padding: 8px; font: inherit; margin-top: 4px; }\n  button { margin-top: 14px; padding: 10px 14px; font: inherit; }\n  #result { margin-top: 18px; padding: 14px; background: #ecfdf5; border-radius: 8px; }\n  .error { color: #b91c1c; font-weight: 600; }\n</style>\n</head>\n<body>\n  <h1>Bolt quantity calculator</h1>\n\n  <form id="calc">\n    <label for="qty">Bolts needed</label>\n    <input id="qty" type="number" value="120">\n\n    <label for="box">Per box</label>\n    <input id="box" type="number" value="25">\n\n    <button type="submit">Calculate</button>\n  </form>\n\n  <div id="result">Enter numbers and press Calculate.</div>\n\n  <script>\n    const form   = document.querySelector("#calc");\n    const result = document.querySelector("#result");\n\n    form.addEventListener("submit", (event) => {\n      event.preventDefault();\n\n      const qty = Number(document.querySelector("#qty").value);\n      const box = Number(document.querySelector("#box").value);\n\n      if (!qty || !box || box <= 0) {\n        result.innerHTML = "<span class=\'error\'>Enter two positive numbers.<\/span>";\n        return;\n      }\n\n      const boxes = Math.ceil(qty / box);\n      result.textContent = boxes + " boxes covers " + qty + " bolts (" + (boxes * box - qty) + " spare)";\n    });\n  <\/script>\n</body>\n</html>',
        notes: {
          32: 'Without this line the page reloads and your result vanishes instantly.',
          34: '.value is a string. Number() converts it so the maths works.',
          37: 'Validate before calculating, and return early on bad input.',
          42: 'ceil rounds up, because you cannot buy most of a box.'
        },
        terms: ['Form', 'Event', 'Validation', 'Type Coercion'],
        challenge: {
          prompt: 'Also show the total cost if each box is $4.50.',
          check: { htmlContains: ['4.5'] },
          hint: 'Multiply boxes by 4.5 and add it to the result text.'
        }
      }
    ]
  }
  );
})(window);
