import os
import re

def update_js_paths():
    js_files = []
    for root, dirs, files in os.walk('static'):
        for file in files:
            if file.endswith('.js'):
                js_files.append(os.path.join(root, file))
    
    for js_file in js_files:
        with open(js_file, 'r', encoding='utf-8') as f:
            content = f.read()
        new_content = re.sub(r'\.\./\.\./graphics/', '/static/graphics/', content)
        
        if content != new_content:
            with open(js_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {js_file}")

if __name__ == '__main__':
    update_js_paths()