import zipfile
import xml.etree.ElementTree as ET
import os

def docx_to_txt(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            paragraphs = []
            for paragraph in root.iter('{' + ns['w'] + '}p'):
                texts = []
                for node in paragraph.iter('{' + ns['w'] + '}t'):
                    if node.text:
                        texts.append(node.text)
                paragraphs.append(''.join(texts))
            return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error reading {docx_path}: {e}"

# Process all files in VSIRDOCUMENT
vsir_dir = '/Users/prathamnagarmote/Downloads/libreludo-main/VSIRDOCUMENT'
output_dir = '/Users/prathamnagarmote/Downloads/libreludo-main/scratch'
os.makedirs(output_dir, exist_ok=True)

for fname in os.listdir(vsir_dir):
    if fname.endswith('.docx'):
        path = os.path.join(vsir_dir, fname)
        text = docx_to_txt(path)
        out_name = fname.replace('.docx', '.txt')
        out_path = os.path.join(output_dir, out_name)
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Extracted {fname} -> {out_name}")
