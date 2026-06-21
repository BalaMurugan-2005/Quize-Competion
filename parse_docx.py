import zipfile, xml.etree.ElementTree as ET, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with zipfile.ZipFile('datas/AntiDrug_Quiz_105Q_Mixed.docx') as docx:
    doc_xml = docx.read('word/document.xml')
    root = ET.fromstring(doc_xml)
    texts = []
    for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
        para_text = []
        for text_node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
            if text_node.text:
                para_text.append(text_node.text)
        texts.append("".join(para_text).strip())
    lines = [t for t in texts if t]

    # Show round headers and question numbers
    for i, line in enumerate(lines):
        if re.match(r'Round\s+', line, re.IGNORECASE):
            print(f'ROUND: {i}: {line}')
        elif re.match(r'Q\d+\.', line):
            print(f'Q: {i}: {line[:120]}')
    print(f'--- Total lines: {len(lines)} ---')
