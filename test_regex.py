import re
with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Let's find const SEED_DATA
start_idx = html_content.find("const SEED_DATA = {")
print("start_idx:", start_idx)

# Find the end of SEED_DATA assignment.
# It ends with `};` right before `// ============================================================`
# or some other function. Let's see the context after `const SEED_DATA =`
import sys
if start_idx != -1:
    # Just find the next const or let or function after SEED_DATA
    # In JS, the global SEED_DATA might be followed by variables
    m = re.search(r'const SEED_DATA = \{[\s\S]*?\};\n\nlet _currentCountry', html_content)
    if m:
        print("Found with regex!")
    else:
        print("Not found with regex.")
        # Let's print the tail of the SEED_DATA object
        # Find the next declaration
        next_decl = html_content.find("\nlet ", start_idx)
        print("next_decl:", next_decl)
        print("Tail of SEED_DATA:")
        print(html_content[next_decl-100:next_decl+50])
