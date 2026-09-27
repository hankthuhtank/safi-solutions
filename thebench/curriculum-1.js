/* Curriculum part 1 — Orientation, C++, Java */
(function (W) {
  W.CURRICULUM = W.CURRICULUM || { modules: [] };
  W.CURRICULUM.modules.push(

  /* ============================================================ 00 */
  {
    id: 'orientation', code: 'CS-00', title: 'Orientation',
    tag: 'Start here',
    blurb: 'What a program actually is, how one runs, and how to read the screen when it breaks.',
    lessons: [
      {
        id: 'what-is-code',
        title: 'What code actually is',
        goal: 'Describe any program as data, rules, and output.',
        plain: 'A program is a list of instructions a machine follows exactly. It holds values, transforms them with rules, decides between paths, repeats work, and hands back a result. Every language you will ever learn is a different way of writing those same five moves.',
        why: 'When a language looks like noise, this is the reduction that saves you: find the data, find the rule, find the output. Syntax is the last thing that matters, not the first.',
        analogy: 'A recipe card. Ingredients are data, steps are rules, the plated dish is output. The machine is a cook who never guesses and never skips a step.',
        points: [
          ['Input', 'information arriving from a person, a file, or another system'],
          ['State', 'what the program currently remembers'],
          ['Logic', 'rules that transform or judge that state'],
          ['Output', 'what a person or another system finally sees'],
          'Everything else you will learn is a way to organise those four'
        ],
        lang: 'cpp',
        code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n  string name = "Hank";\n  int visits = 3;\n  string message = name + " has visited " + to_string(visits) + " times";\n  cout << message << endl;\n  return 0;\n}',
        notes: {
          5: 'State. A labelled box holding the text "Hank".',
          6: 'More state. A box holding a whole number.',
          7: 'Logic. Two values combined into a third. Nothing is printed yet.',
          8: 'Output. Only now does a human see anything.'
        },
        terms: ['Variable', 'Function', 'Compiler'],
        challenge: {
          prompt: 'Change the program so it prints: Ana has visited 12 times',
          check: { output: 'Ana has visited 12 times' },
          hint: 'You only need to change the two values on lines 6 and 7.'
        }
      },
      {
        id: 'how-a-program-runs',
        title: 'How a program actually runs',
        goal: 'Explain the difference between compiled and interpreted execution.',
        plain: 'C++ is compiled: a compiler translates your whole file into machine code before anything runs, so mistakes are caught early and the result is fast. JavaScript is interpreted: a runtime reads and executes it as it goes, so it starts instantly but only discovers some mistakes when that exact line runs. Java sits between them, compiling to bytecode that a virtual machine then runs anywhere.',
        why: 'This single difference explains why C++ yells at you before you run anything, why a JavaScript typo can sit quietly in production for a month, and why Java needs a JVM installed.',
        analogy: 'Compiling is translating a whole book before handing it over. Interpreting is a live translator speaking one sentence at a time. Bytecode is translating into a shared shorthand that any trained reader can pick up.',
        points: [
          ['Compiled (C++, Rust, Go)', 'errors surface before running; output is a native binary'],
          ['Bytecode (Java, C#)', 'compile once, run on any machine with the virtual machine'],
          ['Interpreted (JavaScript, Python)', 'runs immediately; some errors only appear when reached'],
          'None of these are "better". They trade startup speed against safety and portability.'
        ],
        lang: 'java',
        code: 'public class Main {\n  public static void main(String[] args) {\n    int filesChecked = 0;\n\n    filesChecked = filesChecked + 1;\n    System.out.println("Checked " + filesChecked + " file");\n\n    filesChecked = filesChecked + 1;\n    System.out.println("Checked " + filesChecked + " files");\n  }\n}',
        notes: {
          1: 'Java always starts here. The virtual machine looks for main and runs it first.',
          2: 'A box created and set to 0 before anything else happens.',
          4: 'The old value is read, 1 is added, the result is stored back.',
          7: 'Same instruction, different result, because the state changed in between.'
        },
        terms: ['Compiler', 'Runtime', 'Bytecode'],
        callout: { kind: 'note', text: 'Step through this with the scrubber and watch filesChecked change. Same line, different value: that is state.' }
      },
      {
        id: 'reading-errors',
        title: 'Reading an error instead of fearing it',
        goal: 'Extract the four useful facts from any error message.',
        plain: 'An error message is a bug report the machine wrote for you. It almost always contains four things: what kind of failure, a plain description, the file, and the line number. Read those four before you change a single character.',
        why: 'Most people delete code at random when something breaks. The error already told them where to look. Reading it carefully is the single highest-return habit in programming.',
        analogy: 'A smoke alarm tells you which room. It does not tell you which pan. But knowing the room saves you searching the whole house.',
        points: [
          ['Type', 'is it a syntax error, a type error, or a runtime error?'],
          ['Message', 'the plain-English complaint'],
          ['Location', 'file and line number, which is where it was noticed, not always where it started'],
          ['Trace', 'the chain of calls that got there, read bottom-up'],
          'Syntax errors happen before running. Runtime errors happen during.'
        ],
        lang: 'cpp',
        code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int scores[3] = {90, 85, 78};\n\n  for (int i = 0; i <= 3; i++) {\n    cout << scores[i] << endl;\n  }\n  return 0;\n}',
        notes: {
          4: 'Three slots exist: positions 0, 1 and 2.',
          6: 'The bug. <= lets i reach 3, which is one past the end.',
          7: 'The array access fails here in this trainer. The loop condition above allowed the invalid index.'
        },
        callout: { kind: 'note', text: 'This teaching runtime reports an out-of-bounds read. In production C++, reading past a built-in array has undefined behavior: a helpful error is not guaranteed. Fix the loop bound rather than relying on a crash.' },
        expectError: true,
        terms: ['Stack Trace', 'Runtime Error', 'Off-by-one'],
        challenge: {
          prompt: 'Fix the loop so it prints all three scores and stops cleanly.',
          check: { output: '90\n85\n78' },
          hint: 'With 3 items, the last valid position is 2. Which comparison operator stops at 2?'
        }
      },
      {
        id: 'the-toolchain',
        title: 'The tools sitting between you and the machine',
        goal: 'Name what each tool in a normal project actually does.',
        plain: 'You write text. A long chain of programs turns that text into something running. An editor gives you the text. A compiler or runtime executes it. A package manager fetches code other people wrote. Version control records every change. A build tool wires it together, and a host puts it on the internet.',
        why: 'Beginners often think "learning to code" means learning a language. In practice most confusion comes from the tools around the language, not the language itself.',
        analogy: 'A workshop. The language is the material you cut. Everything else is the saw, the bench, the tape measure, and the truck that delivers it.',
        points: [
          ['Editor / IDE', 'where you type (VS Code, IntelliJ, Vim)'],
          ['Compiler or runtime', 'turns text into behaviour (g++, javac + JVM, Node)'],
          ['Package manager', 'installs libraries (npm, Maven, vcpkg)'],
          ['Version control', 'records history and enables undo (Git)'],
          ['Build tool', 'automates the chain (make, Gradle, Vite)'],
          ['Host', 'runs it somewhere the public can reach (a server, a CDN)']
        ],
        lang: 'none',
        codeBlock: 'my-app/\n├─ src/\n│  ├─ main.cpp          the code you write\n│  └─ helpers.cpp       more of it, split by job\n├─ include/             shared declarations\n├─ tests/               proof it still works\n├─ build/               compiler output, never edited by hand\n├─ .gitignore           what version control should ignore\n├─ Makefile             the recipe that runs the compiler\n└─ README.md            how a human starts this project',
        terms: ['Package Manager', 'Build Tool', 'Repository'],
        callout: { kind: 'tip', text: 'The build folder is generated. If you ever edit something there, you are editing a copy that will be overwritten.' }
      }
    ]
  },

  /* ============================================================ 01 */
  {
    id: 'cpp', code: 'CS-01', title: 'C++',
    tag: 'Language',
    blurb: 'Close to the metal. Explicit types, manual control, and the language that explains what every other language is hiding.',
    lessons: [
      {
        id: 'cpp-first',
        title: 'Your first C++ program',
        goal: 'Write, run, and explain a complete C++ program.',
        plain: 'Every C++ program starts at a function called main. Before it, #include lines pull in tools written by other people. cout is the standard output stream, and << pushes values into it. The semicolon ends a statement the way a full stop ends a sentence.',
        why: 'This skeleton never changes. Once these six lines feel boring, every C++ file you open will have a familiar shape.',
        analogy: 'A letter. The includes are the stationery you gather, main is the body, and cout is dropping it in the postbox.',
        points: [
          ['#include <iostream>', 'brings in input and output tools'],
          ['using namespace std;', 'lets you write cout instead of std::cout'],
          ['int main()', 'the one function that runs automatically'],
          ['cout << value', 'sends a value to the screen'],
          ['endl', 'ends the line'],
          ['return 0;', 'tells the operating system it finished cleanly']
        ],
        lang: 'cpp',
        code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello from C++" << endl;\n  cout << "Two plus two is " << 2 + 2 << endl;\n  return 0;\n}',
        notes: {
          0: 'Loads the input/output library. Without it, cout does not exist.',
          1: 'Saves you typing std:: before every standard name.',
          3: 'Execution begins here. int means it hands a number back when done.',
          4: 'Push text into the output stream, then end the line.',
          5: 'The maths runs first, then the result is pushed. Order matters.',
          6: 'Zero means success. Any other number means something went wrong.'
        },
        terms: ['Function', 'Compiler', 'Standard Library'],
        challenge: {
          prompt: 'Make it print your own greeting on the first line and the result of 7 * 6 on the second.',
          check: { outputContains: '42' },
          hint: 'Change the text in quotes, and change 2 + 2 to 7 * 6.'
        }
      },
      {
        id: 'cpp-types',
        title: 'Types, and why C++ insists on them',
        goal: 'Choose the right type and predict integer division.',
        plain: 'C++ makes you declare what kind of value a box holds before you put anything in it. An int holds whole numbers. A double holds decimals. A char holds one character. A bool holds true or false. A string holds text. The compiler uses this to catch mistakes before you ever run the program.',
        why: 'Integer division is the classic trap: 7 / 2 is 3 in C++, not 3.5, because both sides are whole numbers so the answer is forced to be whole too. This bug has shipped in real banking software.',
        analogy: 'Labelled containers in a workshop. You cannot pour paint into the screw drawer, and the label tells everyone what to expect without opening it.',
        points: [
          ['int', 'whole numbers, roughly ±2 billion'],
          ['double', 'decimals, about 15 digits of precision'],
          ['char', 'a single character in single quotes'],
          ['bool', 'true or false only'],
          ['string', 'text (needs #include <string>)'],
          'Integer ÷ integer gives an integer. Make one side a decimal to fix it.'
        ],
        lang: 'cpp',
        code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n  int whole = 7;\n  double precise = 7.0;\n  char initial = \'H\';\n  bool isReady = true;\n  string label = "items";\n\n  cout << "int / int   = " << whole / 2 << endl;\n  cout << "double / int = " << precise / 2 << endl;\n  cout << initial << " " << isReady << " " << label << endl;\n  return 0;\n}',
        notes: {
          5: 'Whole number. No decimal point anywhere.',
          6: 'The .0 is what makes this a double instead of an int.',
          7: 'Single quotes for one character. Double quotes would make it a string.',
          8: 'Prints as 1, not "true". C++ shows bools as 1 and 0 by default.',
          11: 'Both sides are whole, so the result is truncated to 3.',
          12: 'One side is a double, so the whole calculation becomes decimal.'
        },
        terms: ['Data Type', 'Integer', 'Type Safety'],
        challenge: {
          prompt: 'Make the program print an average of exactly 4.5 from the values 9 and 2.',
          starter: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int total = 9;\n  int count = 2;\n  cout << total / count << endl;\n  return 0;\n}',
          check: { output: '4.5' },
          hint: 'Cast one side to a double: (double)total / count.'
        }
      },
      {
        id: 'cpp-conditionals',
        title: 'Making decisions',
        goal: 'Branch on a condition and chain multiple cases correctly.',
        plain: 'An if statement runs a block only when a condition is true. else if adds another test, and else catches everything left over. The tests are checked top to bottom and the first one that matches wins, so order is part of the logic.',
        why: 'Ordering bugs are silent. If you test "score > 50" before "score > 90", nobody ever gets an A, and nothing crashes to tell you.',
        analogy: 'A sorting line. Each parcel drops through the first chute it fits. Put the wide chute first and nothing reaches the narrow ones.',
        points: [
          '== compares. A single = assigns, and is a classic bug.',
          '&& means both must be true; || means at least one',
          '! flips true to false',
          'else if chains are checked in order, first match wins',
          'Braces are optional for one line, but always use them anyway'
        ],
        lang: 'cpp',
        code: '#include <iostream>\nusing namespace std;\n\nstring grade(int score) {\n  if (score >= 90) {\n    return "A";\n  } else if (score >= 80) {\n    return "B";\n  } else if (score >= 70) {\n    return "C";\n  } else {\n    return "F";\n  }\n}\n\nint main() {\n  int marks[4] = {95, 83, 71, 40};\n  for (int i = 0; i < 4; i++) {\n    cout << marks[i] << " -> " << grade(marks[i]) << endl;\n  }\n  return 0;\n}',
        notes: {
          4: 'Checked first. Because 90 is the highest bar, this order is correct.',
          6: 'Only reached if the test above was false, so score is already under 90.',
          10: 'The catch-all. No condition, because there is nothing left to test.',
          17: 'Each score is passed in and the returned letter is printed.'
        },
        terms: ['Conditional', 'Boolean', 'Control Flow'],
        challenge: {
          prompt: 'Add a "D" band for scores of 60 or above, so 65 prints D and 40 still prints F.',
          check: { outputContains: 'D' },
          hint: 'Insert one more else if between the C branch and the else.'
        }
      },
      {
        id: 'cpp-loops',
        title: 'Loops',
        goal: 'Use for and while loops and avoid the endless kind.',
        plain: 'A for loop is for when you know how many times: it bundles the start, the test, and the step into one line. A while loop is for when you do not: it just keeps going while a condition holds. A do/while always runs at least once before it checks.',
        why: 'Every loop needs something that changes and eventually makes the condition false. Forget that and the program hangs forever, which is the most common beginner crash.',
        analogy: 'A for loop is climbing a set number of stairs. A while loop is climbing until you reach the top, however many there are.',
        points: [
          ['for (start; test; step)', 'the counter pattern'],
          ['while (test)', 'repeat until a condition changes'],
          ['do { } while (test);', 'always runs the body once first'],
          'break exits the loop immediately',
          'continue skips to the next round',
          'Something inside the loop must move the condition toward false'
        ],
        lang: 'cpp',
        code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Countdown: ";\n  for (int i = 5; i > 0; i--) {\n    cout << i << " ";\n  }\n  cout << endl;\n\n  int total = 0;\n  int n = 1;\n  while (total < 20) {\n    total += n;\n    n++;\n  }\n  cout << "Summed to " << total << " after " << n - 1 << " terms" << endl;\n  return 0;\n}',
        notes: {
          5: 'Start at 5, keep going while above 0, subtract 1 each round.',
          11: 'The condition depends on total, so total must change inside.',
          12: 'This is the line that eventually stops the loop.',
          13: 'n grows so each round adds more than the last.'
        },
        terms: ['Loop', 'Iteration', 'Infinite Loop'],
        challenge: {
          prompt: 'Print only the even numbers from 1 to 10 on one line: 2 4 6 8 10',
          starter: '#include <iostream>\nusing namespace std;\n\nint main() {\n  for (int i = 1; i <= 10; i++) {\n    cout << i << " ";\n  }\n  cout << endl;\n  return 0;\n}',
          check: { output: '2 4 6 8 10' },
          hint: 'Use if (i % 2 == 0) inside the loop, or start at 2 and step by 2.'
        }
      },
      {
        id: 'cpp-functions',
        title: 'Functions',
        goal: 'Write a function with parameters and a return value.',
        plain: 'A function is a named block of work. The return type says what comes back, the parameters say what goes in, and the body does the job. Calling it pauses the current work, runs the function, and resumes with the result in hand.',
        why: 'Functions are how you stop repeating yourself and how you make a program testable. A 400-line main is unreadable; ten 40-line functions is a program you can reason about.',
        analogy: 'A vending machine. You put in coins (arguments), it does something inside you cannot see, and a snack comes out (the return value).',
        points: [
          'returnType name(parameters) { body }',
          'void means it returns nothing and is called for its effect',
          'Arguments are copied in by default, so changing them does not affect the caller',
          'return ends the function immediately',
          'Define a function above where you call it, or declare it first'
        ],
        lang: 'cpp',
        code: '#include <iostream>\nusing namespace std;\n\nint area(int width, int height) {\n  return width * height;\n}\n\nbool fitsOnPallet(int w, int h) {\n  return area(w, h) <= 100;\n}\n\nint main() {\n  cout << "8x9  area " << area(8, 9) << endl;\n  cout << "8x9  fits? " << fitsOnPallet(8, 9) << endl;\n  cout << "20x9 fits? " << fitsOnPallet(20, 9) << endl;\n  return 0;\n}',
        notes: {
          3: 'Takes two ints, hands one int back. Nothing is printed here.',
          7: 'A function calling another function. This is how programs stay small.',
          12: 'The call runs first, its result becomes part of the line being printed.'
        },
        terms: ['Function', 'Parameter', 'Return Value', 'Call Stack'],
        callout: { kind: 'note', text: 'Step through this one. Watch the call stack panel grow to three frames when fitsOnPallet calls area, then shrink back.' },
        challenge: {
          prompt: 'Add a function perimeter(w, h) and print the perimeter of an 8 by 9 rectangle (34).',
          check: { outputContains: '34' },
          hint: 'Perimeter is 2 * (width + height).'
        }
      },
      {
        id: 'cpp-arrays',
        title: 'Arrays and vectors',
        goal: 'Store many values and walk through them safely.',
        plain: 'An array is a fixed run of slots numbered from 0. You get and set by position. A vector is the flexible version: it grows and shrinks, knows its own size, and is what you should reach for most of the time in modern C++.',
        why: 'Position numbering starts at 0, so an array of 5 has valid positions 0 to 4. Reading position 5 is undefined behaviour in C++, which means it might print garbage rather than crash. That is worse than crashing.',
        analogy: 'An array is a row of numbered post office boxes bolted to the wall. A vector is a shelf you can add more boxes to.',
        points: [
          ['int a[5];', 'five slots, positions 0 to 4'],
          'a[0] is the first item, a[4] is the last',
          'vector<int> v; then v.push_back(x) to add',
          'v.size() gives the current count',
          'Arrays do not know their own length; vectors do',
          'Going past the end is not checked. Guard your loops.'
        ],
        lang: 'cpp',
        code: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n  int fixed[4] = {10, 20, 30, 40};\n  int total = 0;\n  for (int i = 0; i < 4; i++) {\n    total += fixed[i];\n  }\n  cout << "Array total: " << total << endl;\n\n  vector<int> flexible;\n  flexible.push_back(5);\n  flexible.push_back(15);\n  flexible.push_back(25);\n  cout << "Vector holds " << flexible.size() << " items" << endl;\n  for (int value : flexible) {\n    cout << value << " ";\n  }\n  cout << endl;\n  return 0;\n}',
        notes: {
          5: 'Four slots, filled at once. The size 4 is baked in permanently.',
          7: 'i < 4 not i <= 4. The last valid position is 3.',
          12: 'Starts completely empty with size 0.',
          13: 'push_back adds to the end and grows the vector automatically.',
          17: 'Range-based for. Reads "for each value in flexible".'
        },
        terms: ['Array', 'Index', 'Vector', 'Off-by-one'],
        challenge: {
          prompt: 'Find and print the largest value in the fixed array. Expected output includes 40.',
          check: { outputContains: '40' },
          hint: 'Keep a variable holding the biggest seen so far and update it inside the loop.'
        }
      },
      {
        id: 'cpp-strings',
        title: 'Working with text',
        goal: 'Build, measure, and slice strings.',
        plain: 'A C++ string holds text and knows its own length. You join with +, measure with .length(), pull out a piece with .substr(), and reach a single character with square brackets. Text is just an array of characters with helpful methods bolted on.',
        why: 'Almost every real program is mostly text handling: names, addresses, file paths, JSON, log lines. Being fluent here removes a whole category of friction.',
        analogy: 'A tape measure with scissors. You can measure it, cut a section out, and tape two lengths together.',
        points: [
          ['s.length() or s.size()', 'number of characters'],
          ['s[0]', 'the first character'],
          ['s.substr(start, count)', 'a piece of it'],
          ['s.find("x")', 'position of a substring, or a huge number if absent'],
          '+ joins two strings; to_string() converts a number into one'
        ],
        lang: 'cpp',
        code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n  string full = "Hank Thomas";\n\n  cout << "Length: " << full.length() << endl;\n  cout << "First:  " << full[0] << endl;\n  cout << "Slice:  " << full.substr(0, 4) << endl;\n\n  string greeting = "Hi, " + full + "!";\n  cout << greeting << endl;\n\n  int spaceAt = full.find(" ");\n  cout << "Space at position " << spaceAt << endl;\n  cout << "Surname: " << full.substr(spaceAt + 1) << endl;\n  return 0;\n}',
        notes: {
          5: 'Eleven characters including the space.',
          6: 'Position 0 is H. There is no position 11.',
          7: 'Start at 0, take 4 characters. Gives "Hank".',
          9: 'Joining creates a brand new string; full is untouched.',
          13: 'find returns the position where the match starts.',
          15: 'Leaving out the count means "take everything to the end".'
        },
        terms: ['String', 'Concatenation', 'Substring'],
        challenge: {
          prompt: 'Print the initials of "Hank Thomas" as H.T.',
          check: { outputContains: 'H.T' },
          hint: 'full[0] gives H. The letter after the space is full[spaceAt + 1].'
        }
      },
      {
        id: 'cpp-classes',
        title: 'Classes and objects',
        goal: 'Bundle data and behaviour into one type.',
        plain: 'A class is a blueprint. It says what data an object holds and what it can do. Creating one from the blueprint gives you an object, and each object has its own copy of the data. The constructor runs once at creation and sets the starting state.',
        why: 'Once a program has more than a handful of related variables, passing them around separately gets fragile. A class keeps the data and the rules that protect it in the same place.',
        analogy: 'A blueprint for a house versus the houses built from it. One drawing, many buildings, each with its own furniture.',
        points: [
          ['class Name { ... };', 'note the semicolon at the end'],
          'public: members anyone can reach; private: members only the class can touch',
          'The constructor has the same name as the class and no return type',
          'Each object gets its own copy of the fields',
          'Methods are functions that live inside the class'
        ],
        lang: 'cpp',
        code: '#include <iostream>\n#include <string>\nusing namespace std;\n\nclass Account {\npublic:\n  string owner;\n  double balance;\n\n  Account(string name, double startingBalance) {\n    owner = name;\n    balance = startingBalance;\n  }\n\n  void deposit(double amount) {\n    balance = balance + amount;\n  }\n\n  bool canAfford(double price) {\n    return balance >= price;\n  }\n};\n\nint main() {\n  Account a("Hank", 100.0);\n  Account b("Ana", 40.0);\n\n  a.deposit(25.5);\n\n  cout << a.owner << " has " << a.balance << endl;\n  cout << b.owner << " has " << b.balance << endl;\n  cout << "Can Ana afford 50? " << b.canAfford(50.0) << endl;\n  return 0;\n}',
        notes: {
          4: 'The blueprint begins. Nothing exists in memory yet.',
          9: 'The constructor. Runs automatically when an object is made.',
          14: 'A method. It can read and change this object\'s own balance.',
          24: 'Two separate objects. Changing one never touches the other.',
          27: 'a.balance is now 125.5, but b.balance is still 40.'
        },
        terms: ['Class', 'Object', 'Constructor', 'Encapsulation'],
        callout: { kind: 'note', text: 'Scrub through and watch the variable panel: a and b appear as separate objects with their own fields.' },
        challenge: {
          prompt: 'Add a withdraw(amount) method that only subtracts if the balance is high enough, then withdraw 500 from Ana and print her balance (still 40).',
          check: { outputContains: '40' },
          hint: 'Inside withdraw, wrap the subtraction in if (canAfford(amount)).'
        }
      },
      {
        id: 'cpp-references',
        title: 'Copies, references, and pointers',
        goal: 'Predict whether a change inside a function survives.',
        plain: 'By default C++ copies arguments into a function, so changes inside are thrown away. Add & to a parameter and the function works on the original instead. A pointer stores an address rather than a value, and * reads what is at that address.',
        why: 'This is where C++ stops feeling like other languages. Understanding copy-versus-reference removes most "why did nothing change?" and "why did everything change?" confusion, in every language.',
        analogy: 'A copy is a photocopy of a form. A reference is the original on your desk. A pointer is a sticky note with the drawer number written on it.',
        points: [
          ['int x', 'a copy, safe to change, caller unaffected'],
          ['int& x', 'a reference to the original, changes stick'],
          ['const int& x', 'read the original without copying and without changing it'],
          ['int* p', 'holds an address; *p reads the value there'],
          'Big objects are usually passed by const reference to avoid copying cost'
        ],
        lang: 'cpp',
        code: '#include <iostream>\nusing namespace std;\n\nvoid tryToChange(int value) {\n  value = 999;\n}\n\nvoid actuallyChange(int& value) {\n  value = 999;\n}\n\nint main() {\n  int score = 10;\n\n  tryToChange(score);\n  cout << "After copy pass:      " << score << endl;\n\n  actuallyChange(score);\n  cout << "After reference pass: " << score << endl;\n  return 0;\n}',
        notes: {
          3: 'No ampersand. This gets a private copy.',
          4: 'Sets the copy to 999. The copy dies when the function ends.',
          7: 'The ampersand means "this IS the caller\'s variable, not a copy".',
          14: 'Still 10. Nothing survived.',
          17: 'Now 999. The function reached the original.'
        },
        terms: ['Reference', 'Pointer', 'Pass by Value', 'Memory'],
        callout: { kind: 'warn', text: 'The single & is the entire difference between these two functions. This is why C++ reviewers read parameter lists so carefully.' }
      },
      {
        id: 'cpp-memory',
        title: 'Memory: stack and heap',
        goal: 'Explain where a variable lives and when it disappears.',
        plain: 'Local variables live on the stack: fast, automatic, and destroyed the instant their function ends. Anything you create with new lives on the heap: it survives until you delete it, which means you are responsible for it. Modern C++ prefers smart pointers and containers so you rarely manage this by hand.',
        why: 'A memory leak is heap memory you allocated and never released. A dangling pointer is an address to something already destroyed. Both are invisible until they are catastrophic.',
        analogy: 'The stack is a desk that gets cleared every time you leave the room. The heap is a storage unit that keeps charging you until you cancel it.',
        points: [
          ['Stack', 'automatic, fast, freed when the function returns'],
          ['Heap', 'manual, flexible, freed only when you say so'],
          'Every new needs a matching delete',
          'Losing the last pointer to heap memory is a leak',
          'Prefer vector, string, and smart pointers so the cleanup is automatic'
        ],
        lang: 'cpp',
        code: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<int> buildBatch(int count) {\n  vector<int> batch;\n  for (int i = 1; i <= count; i++) {\n    batch.push_back(i * 10);\n  }\n  return batch;\n}\n\nint main() {\n  int onStack = 42;\n  vector<int> result = buildBatch(4);\n\n  cout << "Stack value: " << onStack << endl;\n  cout << "Batch size:  " << result.size() << endl;\n  for (int v : result) cout << v << " ";\n  cout << endl;\n  return 0;\n}',
        notes: {
          5: 'batch manages its own heap storage internally.',
          9: 'Returned safely. The vector moves its contents out rather than copying.',
          12: 'Lives on the stack. Gone the moment main ends.',
          13: 'result now owns the data, and cleans it up automatically.'
        },
        terms: ['Stack', 'Heap', 'Memory Leak', 'RAII'],
        callout: { kind: 'tip', text: 'The rule of thumb in modern C++: if you are typing new and delete by hand in application code, there is usually a container that would do it for you.' }
      },
      {
        id: 'cpp-algorithm',
        title: 'Putting it together: a sort',
        goal: 'Read and trace a complete multi-step algorithm.',
        plain: 'Bubble sort compares neighbouring pairs and swaps them if they are out of order, sweeping through the list repeatedly until nothing needs swapping. It is slow for large data but it is the clearest possible demonstration of nested loops, swapping, and array indexing working together.',
        why: 'The point is not that you will use bubble sort. The point is that you can now read a real algorithm and trace exactly what happens to memory on every pass.',
        analogy: 'Straightening a row of books by repeatedly comparing each pair side by side and swapping the ones in the wrong order.',
        points: [
          'The outer loop counts the passes',
          'The inner loop does the comparisons within one pass',
          'A swap needs a temporary variable, or the first value is lost',
          'After pass n, the largest n items are already in place',
          'n-i-1 in the inner condition skips the settled tail'
        ],
        lang: 'cpp',
        code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int data[6] = {5, 1, 4, 2, 8, 0};\n  int n = 6;\n\n  for (int pass = 0; pass < n - 1; pass++) {\n    for (int i = 0; i < n - pass - 1; i++) {\n      if (data[i] > data[i + 1]) {\n        int temp = data[i];\n        data[i] = data[i + 1];\n        data[i + 1] = temp;\n      }\n    }\n  }\n\n  for (int i = 0; i < n; i++) {\n    cout << data[i] << " ";\n  }\n  cout << endl;\n  return 0;\n}',
        notes: {
          7: 'Five passes are enough for six items.',
          8: 'Shrinks each pass, because the tail is already sorted.',
          9: 'The only comparison in the whole algorithm.',
          10: 'Without temp, line 11 would overwrite the value we still need.',
          12: 'The saved value goes into the other slot. The swap is complete.'
        },
        terms: ['Algorithm', 'Sorting', 'Nested Loop', 'Time Complexity'],
        callout: { kind: 'note', text: 'This one is worth scrubbing slowly. Watch the array in the variable panel reorder itself one swap at a time.' }
      },
      {
        id: 'cpp-input',
        title: 'Reading input',
        goal: 'Take values from a user and respond to them.',
        plain: 'cin reads from standard input, pulling one whitespace-separated value at a time into a variable using >>. The program pauses until something arrives. On this page, whatever you type into the Input box is what cin receives.',
        why: 'A program that only ever prints the same thing is a document. Reading input is the point where it becomes a tool.',
        analogy: 'A form at a counter. The program hands over a blank, waits, and works with whatever comes back.',
        points: [
          ['cin >> variable', 'read one value'],
          'The arrows point the way the data flows: cin >> x pulls in, cout << x pushes out',
          'Reading stops at whitespace, so "Hank Thomas" reads as two values',
          'Always tell the user what you expect before you ask for it',
          'Real programs must handle input that is the wrong shape'
        ],
        lang: 'cpp',
        stdin: '8 5',
        code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  int width, height;\n\n  cout << "Enter width and height: ";\n  cin >> width;\n  cin >> height;\n\n  cout << endl;\n  cout << "Area:      " << width * height << endl;\n  cout << "Perimeter: " << 2 * (width + height) << endl;\n  return 0;\n}',
        notes: {
          4: 'Two boxes declared at once, both currently holding garbage.',
          6: 'Prompt first. A program that waits silently looks frozen.',
          7: 'Reads the first value from the Input box into width.',
          8: 'Reads the next one. Whitespace separates them.'
        },
        terms: ['Standard Input', 'Stream', 'Validation'],
        callout: { kind: 'tip', text: 'Change the numbers in the Input box beside the editor, then run again. The program does not change; its input does.' }
      }
    ]
  },

  /* ============================================================ 02 */
  {
    id: 'java', code: 'CS-02', title: 'Java',
    tag: 'Language',
    blurb: 'Strict, verbose, and everywhere. The language that made object-oriented design the industry default.',
    lessons: [
      {
        id: 'java-first',
        title: 'Your first Java program',
        goal: 'Explain every word in a Java hello world.',
        plain: 'Java puts everything inside a class. The virtual machine looks for a method called main with an exact signature and runs it. That signature is long because each word is doing a job: public means reachable from outside, static means it belongs to the class rather than an object, void means it returns nothing, and String[] args holds command line arguments.',
        why: 'Beginners are told to "just type it and ignore it". Understanding the six words instead removes a mystery that otherwise lingers for years.',
        analogy: 'A building with one clearly marked front door. The security guard only opens a door with exactly that label.',
        points: [
          'Every Java file contains at least one class',
          ['public', 'accessible from anywhere'],
          ['static', 'belongs to the class, not to an instance'],
          ['void', 'returns nothing'],
          ['main(String[] args)', 'the exact name and shape the JVM looks for'],
          'System.out.println prints a line'
        ],
        lang: 'java',
        code: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from Java");\n\n    String tool = "compiler";\n    int year = 1995;\n    System.out.println("Java shipped in " + year + " with a " + tool);\n  }\n}',
        notes: {
          0: 'The class. In real projects the file must be named Main.java to match.',
          1: 'The exact signature the virtual machine hunts for.',
          2: 'System is a class, out is an output stream inside it, println is the method.',
          6: 'The + joins strings. The number is converted to text automatically.'
        },
        terms: ['Class', 'Method', 'JVM', 'Static'],
        challenge: {
          prompt: 'Print two lines: your name, then the number 2026.',
          check: { outputContains: '2026' },
          hint: 'Add a second System.out.println line inside main.'
        }
      },
      {
        id: 'java-types',
        title: 'Types and the primitive/object split',
        goal: 'Choose between primitives and objects, and predict integer division.',
        plain: 'Java has eight primitive types written in lowercase (int, double, boolean, char and friends) which hold raw values. Everything else is an object, written with a capital letter, and String is the one you will meet constantly. Primitives are fast and simple; objects can be null and carry methods.',
        why: 'The lowercase/uppercase distinction confuses everyone at first. int cannot be null, Integer can. That difference causes real crashes when data is missing.',
        analogy: 'A primitive is a raw number written on a card. An object is a folder that contains the number plus everything else you might want to do with it.',
        points: [
          ['int, double, boolean, char', 'primitives, lowercase, never null'],
          ['String, Integer, ArrayList', 'objects, capitalised, can be null'],
          'Integer ÷ integer truncates, exactly like C++',
          'Java prints doubles with a decimal: 4.0 not 4',
          'final marks a value that must never be reassigned'
        ],
        lang: 'java',
        code: 'public class Main {\n  public static void main(String[] args) {\n    int whole = 7;\n    double precise = 7.0;\n    boolean isReady = true;\n    char initial = \'H\';\n    String label = "units";\n    final int MAX = 100;\n\n    System.out.println("int / int    = " + (whole / 2));\n    System.out.println("double / int = " + (precise / 2));\n    System.out.println(isReady + " " + initial + " " + label);\n    System.out.println("Ceiling is " + MAX);\n  }\n}',
        notes: {
          2: 'Lowercase int. A raw whole number, never null.',
          6: 'Capital S. This is an object with methods like .length() and .trim().',
          7: 'final means any attempt to reassign MAX is a compile error.',
          9: 'The brackets matter. Without them the + would join text instead of dividing.',
          10: 'Prints 3.5, because one side is a double.'
        },
        terms: ['Primitive', 'Object', 'Data Type', 'Null'],
        challenge: {
          prompt: 'Print the average of 9 and 2 as 4.5.',
          starter: 'public class Main {\n  public static void main(String[] args) {\n    int total = 9;\n    int count = 2;\n    System.out.println(total / count);\n  }\n}',
          check: { output: '4.5' },
          hint: 'Cast one side: (double) total / count.'
        }
      },
      {
        id: 'java-control',
        title: 'Conditionals and loops',
        goal: 'Combine branching and repetition in one program.',
        plain: 'Java uses the same if / else if / else and for / while shapes as C++. The enhanced for loop, written for (int n : numbers), walks a collection without you managing an index. It is safer because you cannot run off the end.',
        why: 'Index-based loops are where off-by-one bugs live. When you do not need the position, the enhanced for removes the possibility of the bug entirely.',
        analogy: 'A counted loop is reading page numbers. An enhanced for is just turning pages until there are none left.',
        points: [
          ['for (int i = 0; i < n; i++)', 'when you need the position'],
          ['for (Type item : collection)', 'when you only need each value'],
          ['while (condition)', 'when the count is unknown'],
          'break exits, continue skips to the next round',
          'switch handles many discrete cases cleanly'
        ],
        lang: 'java',
        code: 'public class Main {\n  public static void main(String[] args) {\n    int[] temps = {18, 24, 31, 12, 27};\n\n    int hotDays = 0;\n    for (int t : temps) {\n      if (t >= 25) {\n        hotDays++;\n      }\n    }\n    System.out.println("Hot days: " + hotDays);\n\n    for (int i = 0; i < temps.length; i++) {\n      String tag;\n      if (temps[i] >= 30) tag = "scorching";\n      else if (temps[i] >= 25) tag = "hot";\n      else if (temps[i] >= 15) tag = "mild";\n      else tag = "cold";\n      System.out.println("Day " + (i + 1) + ": " + temps[i] + " " + tag);\n    }\n  }\n}',
        notes: {
          5: 'No index needed, so no chance of an out-of-range mistake.',
          7: 'The ++ adds one. Shorthand for hotDays = hotDays + 1.',
          12: '.length is a field on arrays, with no brackets. Strings use .length() with brackets.',
          14: 'First match wins, so the highest threshold has to be tested first.',
          18: 'i + 1 because humans count days from 1, not 0.'
        },
        terms: ['Control Flow', 'Loop', 'Conditional'],
        challenge: {
          prompt: 'Also print the average temperature. Expected output contains 22.',
          check: { outputContains: '22' },
          hint: 'Sum the array, then divide by temps.length. Cast to double if you want decimals.'
        }
      },
      {
        id: 'java-methods',
        title: 'Methods',
        goal: 'Write static methods and understand overloading.',
        plain: 'A method is Java\'s word for a function. A static method belongs to the class and can be called without creating an object. Java also allows overloading: several methods with the same name but different parameter lists, and the compiler picks the right one by the arguments you pass.',
        why: 'Overloading is why Math.max works with both ints and doubles. It is also why an unexpected type can quietly select a different method than you meant.',
        analogy: 'A tool with several attachments that share one handle. You pick the head by what you are holding.',
        points: [
          'modifier returnType name(params) { }',
          'static means no object needed to call it',
          'void means it returns nothing',
          'Overloading = same name, different parameter types or counts',
          'A method should do one job you can name in a short phrase'
        ],
        lang: 'java',
        code: 'public class Main {\n\n  static int add(int a, int b) {\n    return a + b;\n  }\n\n  static double add(double a, double b) {\n    return a + b;\n  }\n\n  static String describe(int total) {\n    if (total > 100) return "large order";\n    return "small order";\n  }\n\n  public static void main(String[] args) {\n    System.out.println(add(4, 5));\n    System.out.println(add(4.5, 5.25));\n    System.out.println(describe(add(60, 55)));\n  }\n}',
        notes: {
          2: 'Two ints in, one int out.',
          6: 'Same name, different types. Java treats these as separate methods.',
          16: 'Whole numbers, so the int version is chosen. Prints 9.',
          17: 'Decimals, so the double version runs. Prints 9.75.',
          18: 'The inner call finishes first, then its result is passed outward.'
        },
        terms: ['Method', 'Overloading', 'Return Value'],
        callout: { kind: 'note', text: 'Step through line 18 and watch the call stack reach three frames deep: main, then add, then describe.' }
      },
      {
        id: 'java-strings',
        title: 'Strings in Java',
        goal: 'Manipulate text and know why == is the wrong comparison.',
        plain: 'A Java String is an object and it is immutable: every operation returns a new string rather than editing the old one. Comparing with == asks whether two variables point at the same object in memory, which is not the same question as whether the text matches. Use .equals() for that.',
        why: 'The == trap is the single most common Java beginner bug. It sometimes appears to work, because Java reuses identical literals, and then fails the moment the string comes from user input.',
        analogy: 'Two identical printed pages. == asks "is this the same sheet of paper?" and .equals() asks "does it say the same thing?"',
        points: [
          ['.length()', 'with brackets, unlike arrays'],
          ['.substring(start, end)', 'end is exclusive'],
          '.equals() compares content; == compares identity',
          '.trim(), .toUpperCase(), .contains(), .split()',
          'Strings never change; every method hands back a new one'
        ],
        lang: 'java',
        code: 'public class Main {\n  public static void main(String[] args) {\n    String raw = "  Coding School  ";\n    String clean = raw.trim();\n\n    System.out.println("[" + raw + "]");\n    System.out.println("[" + clean + "]");\n    System.out.println("Length: " + clean.length());\n    System.out.println("Upper:  " + clean.toUpperCase());\n    System.out.println("First word: " + clean.substring(0, 6));\n\n    String typed = "Coding School";\n    System.out.println("equals(): " + clean.equals(typed));\n    System.out.println("contains School: " + clean.contains("School"));\n  }\n}',
        notes: {
          2: 'Two spaces at each end, which is what real form input looks like.',
          3: 'trim returns a NEW string. raw is completely unchanged.',
          5: 'Brackets added so you can actually see the whitespace.',
          9: 'Start at 0, stop before 6. Gives "Coding".',
          12: 'The correct comparison. This is true because the text matches.'
        },
        terms: ['String', 'Immutability', 'Equality'],
        challenge: {
          prompt: 'Print the second word of clean ("School") using substring.',
          check: { outputContains: 'School' },
          hint: 'clean.indexOf(" ") gives the space position. Start one past it.'
        }
      },
      {
        id: 'java-arrays',
        title: 'Arrays and ArrayList',
        goal: 'Choose between a fixed array and a growable list.',
        plain: 'An array has a size fixed at creation and uses .length. An ArrayList grows on demand, uses .size(), and you add with .add() and read with .get(). Because ArrayList holds objects rather than primitives, you write ArrayList<Integer> not ArrayList<int>.',
        why: 'Most real data has an unknown length: rows from a database, lines from a file, items in a cart. Arrays fight you there; lists do not.',
        analogy: 'An array is an egg carton with a set number of dents. An ArrayList is a shopping bag.',
        points: [
          ['int[] a = new int[5];', 'fixed at 5, all zeros'],
          ['a.length', 'a field, no brackets'],
          'ArrayList<Integer> list = new ArrayList<>();',
          'list.add(x), list.get(i), list.size(), list.remove(i)',
          'Angle brackets hold the element type and must be an object type'
        ],
        lang: 'java',
        code: 'import java.util.ArrayList;\n\npublic class Main {\n  public static void main(String[] args) {\n    int[] fixed = new int[4];\n    fixed[0] = 10;\n    fixed[1] = 20;\n    System.out.println("Fixed: " + fixed[0] + ", " + fixed[2] + ", len " + fixed.length);\n\n    ArrayList<String> tasks = new ArrayList<>();\n    tasks.add("write code");\n    tasks.add("run tests");\n    tasks.add("ship it");\n\n    System.out.println("Tasks: " + tasks.size());\n    for (int i = 0; i < tasks.size(); i++) {\n      System.out.println((i + 1) + ". " + tasks.get(i));\n    }\n\n    tasks.remove(1);\n    System.out.println("After removing one: " + tasks);\n  }\n}',
        notes: {
          4: 'Four slots, automatically filled with 0.',
          7: 'fixed[2] was never set, so it prints 0, not garbage. Java guarantees this.',
          9: 'Empty list, size 0. The <> on the right is inferred from the left.',
          19: 'Removes by position. Everything after it shifts down one.'
        },
        terms: ['Array', 'ArrayList', 'Collection', 'Generics'],
        challenge: {
          prompt: 'Add a fourth task and print the total count as 4.',
          check: { outputContains: '4' },
          hint: 'One more tasks.add(...) before the size is printed.'
        }
      },
      {
        id: 'java-classes',
        title: 'Classes and objects',
        goal: 'Model a real thing as a class with fields and methods.',
        plain: 'A class defines what an object knows (fields) and what it can do (methods). The constructor runs at creation. Fields are usually private so the outside world must go through methods, which lets the class enforce its own rules instead of trusting everyone.',
        why: 'Encapsulation is not bureaucracy. A private balance with a public deposit method means no code anywhere can set a balance to a negative number by accident.',
        analogy: 'A cash register. Anyone can press the buttons; nobody can reach inside and move the till by hand.',
        points: [
          'private fields, public methods is the default posture',
          'The constructor shares the class name and has no return type',
          'this refers to the object the method is running on',
          'Getters read, setters write, and setters can validate',
          'Each object holds its own independent copy of the fields'
        ],
        lang: 'java',
        code: 'class Book {\n  private String title;\n  private int copies;\n\n  Book(String title, int copies) {\n    this.title = title;\n    this.copies = copies;\n  }\n\n  String getTitle() {\n    return title;\n  }\n\n  boolean borrow() {\n    if (copies > 0) {\n      copies--;\n      return true;\n    }\n    return false;\n  }\n\n  String status() {\n    return title + ": " + copies + " left";\n  }\n}\n\npublic class Main {\n  public static void main(String[] args) {\n    Book a = new Book("Clean Code", 2);\n\n    System.out.println(a.status());\n    System.out.println("Borrowed? " + a.borrow());\n    System.out.println("Borrowed? " + a.borrow());\n    System.out.println("Borrowed? " + a.borrow());\n    System.out.println(a.status());\n  }\n}',
        notes: {
          1: 'private means no code outside Book can touch this directly.',
          5: 'this.title is the field; title alone is the parameter. Same name, different things.',
          13: 'The rule lives inside the class, so it cannot be bypassed.',
          14: 'Only decreases when a copy actually exists.',
          32: 'Third attempt fails and returns false. Copies never goes negative.'
        },
        terms: ['Class', 'Object', 'Encapsulation', 'Constructor'],
        callout: { kind: 'note', text: 'The variable panel shows a as Book { title: "Clean Code", copies: 2 }. Scrub and watch copies fall to 0 and then stop.' }
      },
      {
        id: 'java-inheritance',
        title: 'Inheritance and polymorphism',
        goal: 'Share behaviour between related classes and override it.',
        plain: 'A subclass extends a parent, inheriting its fields and methods, and may override any method to behave differently. Polymorphism is the payoff: code written against the parent type keeps working when you hand it a subclass, and the right version runs automatically.',
        why: 'This is how frameworks let you plug in your own behaviour without them knowing anything about your code in advance.',
        analogy: 'A generic "vehicle" form. Every vehicle has wheels and a top speed, but each type answers "how do you start?" differently.',
        points: [
          'class Child extends Parent',
          'super(...) calls the parent constructor and must come first',
          'Overriding replaces the parent version for that subclass',
          'super.method() calls the parent version explicitly',
          'Favour composition over deep inheritance chains'
        ],
        lang: 'java',
        code: 'class Employee {\n  String name;\n  double baseRate;\n\n  Employee(String name, double baseRate) {\n    this.name = name;\n    this.baseRate = baseRate;\n  }\n\n  double payFor(int hours) {\n    return baseRate * hours;\n  }\n\n  String summary(int hours) {\n    return name + " earns " + payFor(hours);\n  }\n}\n\nclass Contractor extends Employee {\n  Contractor(String name, double baseRate) {\n    super(name, baseRate);\n  }\n\n  double payFor(int hours) {\n    return baseRate * hours * 1.5;\n  }\n}\n\npublic class Main {\n  public static void main(String[] args) {\n    Employee staff = new Employee("Ana", 20.0);\n    Contractor hired = new Contractor("Ben", 20.0);\n\n    System.out.println(staff.summary(10));\n    System.out.println(hired.summary(10));\n  }\n}',
        notes: {
          17: 'Contractor gets name, baseRate and summary for free.',
          19: 'super passes the values up so the parent constructor can store them.',
          22: 'Same name and shape as the parent method, so it replaces it.',
          33: 'summary was never rewritten, yet it calls the Contractor version of payFor. That is polymorphism.'
        },
        terms: ['Inheritance', 'Polymorphism', 'Override', 'Abstraction'],
        challenge: {
          prompt: 'Add an Intern class paid at half rate and print their pay for 10 hours (100.0).',
          check: { outputContains: '100' },
          hint: 'Copy the Contractor shape and change 1.5 to 0.5.'
        }
      },
      {
        id: 'java-exceptions',
        title: 'Exceptions',
        goal: 'Catch a failure and respond instead of crashing.',
        plain: 'When something goes wrong, Java throws an exception, which travels up the call stack until something catches it. If nothing does, the program stops and prints a stack trace. try/catch lets you handle the failure at the level that actually knows what to do about it.',
        why: 'Failure is normal: files go missing, networks drop, users type letters into number boxes. The question is never whether things break, only whether your program has a plan.',
        analogy: 'A dropped plate. try is carrying it carefully, catch is the mat that stops it shattering, finally is sweeping up either way.',
        points: [
          ['try', 'the risky work'],
          ['catch (Type e)', 'what to do when that specific failure happens'],
          ['finally', 'always runs, success or not, used for cleanup'],
          'throw raises one deliberately',
          'Catch the specific exception, not everything, or you hide real bugs'
        ],
        lang: 'java',
        code: 'public class Main {\n\n  static int divide(int a, int b) {\n    if (b == 0) {\n      throw new ArithmeticException("cannot divide by zero");\n    }\n    return a / b;\n  }\n\n  public static void main(String[] args) {\n    int[] pairs = {10, 2, 7, 0};\n\n    for (int i = 0; i < pairs.length; i += 2) {\n      int a = pairs[i];\n      int b = pairs[i + 1];\n      System.out.println(a + " / " + b + " = " + divide(a, b));\n    }\n  }\n}',
        notes: {
          3: 'Guard clause. Check the bad case first and refuse early.',
          4: 'Raising an exception ends this method immediately.',
          12: 'i += 2 steps two at a time, reading pairs.',
          15: 'The second pair is 7 and 0, which triggers the throw.'
        },
        expectError: true,
        terms: ['Exception', 'Error Handling', 'Stack Trace'],
        challenge: {
          prompt: 'Wrap the printing line in try/catch so the program prints an error message for 7/0 and finishes without crashing.',
          check: { outputContains: '/' },
          hint: 'try { System.out.println(...); } catch (ArithmeticException e) { System.out.println("skipped: " + e); }'
        }
      },
      {
        id: 'java-collections',
        title: 'Collections that carry meaning',
        goal: 'Pick the right collection for the shape of your data.',
        plain: 'A List keeps order and allows duplicates. A Set holds unique items with no meaningful order. A Map stores key-to-value pairs, which is the right shape whenever you find yourself keeping two lists side by side.',
        why: 'Choosing the wrong collection is why code ends up with nested loops searching for matches. The right one makes the lookup a single call.',
        analogy: 'A list is a queue, a set is a guest list where nobody appears twice, a map is a phone book.',
        points: [
          ['List', 'ordered, duplicates allowed, indexed'],
          ['Set', 'unique items, membership test is instant'],
          ['Map', 'keys mapped to values, no duplicate keys'],
          'Reach for a Map whenever you are looking things up by a name or id',
          'Choosing right often removes an entire loop'
        ],
        lang: 'java',
        code: 'import java.util.ArrayList;\n\npublic class Main {\n  public static void main(String[] args) {\n    ArrayList<String> orders = new ArrayList<>();\n    orders.add("bolt");\n    orders.add("nut");\n    orders.add("bolt");\n    orders.add("washer");\n\n    System.out.println("Order log: " + orders);\n    System.out.println("Total lines: " + orders.size());\n\n    ArrayList<String> unique = new ArrayList<>();\n    for (String item : orders) {\n      if (!unique.contains(item)) {\n        unique.add(item);\n      }\n    }\n    System.out.println("Distinct parts: " + unique);\n\n    int boltCount = 0;\n    for (String item : orders) {\n      if (item.equals("bolt")) boltCount++;\n    }\n    System.out.println("Bolts ordered: " + boltCount);\n  }\n}',
        notes: {
          7: 'A duplicate. A List allows it; a Set would silently reject it.',
          15: 'contains scans the whole list, which is exactly what a Set avoids.',
          23: 'Counting by scanning. A Map from part name to count would do this in one pass.'
        },
        terms: ['Collection', 'List', 'Set', 'Map', 'Hash Table'],
        callout: { kind: 'tip', text: 'If you write "loop through everything looking for a match" more than once, that is your signal to reach for a Map or a Set.' }
      },
      {
        id: 'java-project',
        title: 'Putting it together: an inventory',
        goal: 'Combine classes, collections, and loops into one working program.',
        plain: 'This is a small but complete program: a class modelling one item, a list holding many, methods that answer questions, and a loop that reports. It is the shape of most real business software, just smaller.',
        why: 'Individual features are easy. The skill worth practising is assembling them into something that does a job end to end.',
        analogy: 'A stockroom clipboard. One row per item, a running total, and a flag on anything running low.',
        points: [
          'One class per real-world noun',
          'A collection for the many',
          'Methods that answer a question rather than expose raw fields',
          'A single reporting loop at the end',
          'Totals computed, never stored, so they cannot drift out of date'
        ],
        lang: 'java',
        code: 'import java.util.ArrayList;\n\nclass Part {\n  String sku;\n  int quantity;\n  double unitPrice;\n\n  Part(String sku, int quantity, double unitPrice) {\n    this.sku = sku;\n    this.quantity = quantity;\n    this.unitPrice = unitPrice;\n  }\n\n  double lineValue() {\n    return quantity * unitPrice;\n  }\n\n  boolean isLow() {\n    return quantity < 5;\n  }\n}\n\npublic class Main {\n  public static void main(String[] args) {\n    ArrayList<Part> stock = new ArrayList<>();\n    stock.add(new Part("BLT-12", 40, 0.35));\n    stock.add(new Part("NUT-08", 3, 0.12));\n    stock.add(new Part("WSH-04", 120, 0.04));\n    stock.add(new Part("BRG-22", 2, 14.50));\n\n    double total = 0;\n    System.out.println("SKU       QTY   VALUE   FLAG");\n\n    for (Part p : stock) {\n      total += p.lineValue();\n      String flag = p.isLow() ? "REORDER" : "ok";\n      System.out.println(p.sku + "   " + p.quantity + "   " + p.lineValue() + "   " + flag);\n    }\n\n    System.out.println("Inventory value: " + total);\n  }\n}',
        notes: {
          13: 'Derived, never stored. It cannot disagree with quantity and price.',
          17: 'The reorder rule lives in one place, so changing 5 changes it everywhere.',
          31: 'One pass does both the totalling and the reporting.',
          33: 'The ternary picks between two values inline.'
        },
        terms: ['Class', 'Collection', 'Business Logic'],
        challenge: {
          prompt: 'Also print how many distinct parts are flagged REORDER (the answer is 2).',
          check: { outputContains: '2' },
          hint: 'Add a counter before the loop and increment it inside when p.isLow() is true.'
        }
      }
    ]
  }
  );
})(window);
