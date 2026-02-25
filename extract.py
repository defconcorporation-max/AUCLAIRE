import PyPDF2

def extract(pdf_path, out_path):
    with open(pdf_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        text = ''
        for p in reader.pages:
            t = p.extract_text()
            if t: text += t + '\n'
        with open(out_path, 'w', encoding='utf-8') as out:
            out.write(text)

extract('public/docs/guide_operationnel_ambassadeur.pdf', 'guide.txt')
extract('public/docs/plan_ambassadeurs.pdf', 'plan.txt')
