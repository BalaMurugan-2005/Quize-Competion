import os
import zipfile
import xml.etree.ElementTree as ET
import re
from django.core.management.base import BaseCommand
from django.conf import settings
from quiz.models import User, Round, Question

class Command(BaseCommand):
    help = 'Seeds initial rounds, questions, and superuser from docx files/env vars if database is empty.'

    def extract_docx_text(self, docx_path):
        if not os.path.exists(docx_path):
            raise FileNotFoundError(f"DOCX file not found at: {docx_path}")
            
        with zipfile.ZipFile(docx_path) as docx:
            doc_xml = docx.read('word/document.xml')
            root = ET.fromstring(doc_xml)
            texts = []
            for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                para_text = []
                for text_node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                    if text_node.text:
                        para_text.append(text_node.text)
                texts.append("".join(para_text).strip())
        return [t for t in texts if t]

    def handle(self, *args, **options):
        # 1. Handle Superuser Seeding
        if not User.objects.filter(is_superuser=True).exists():
            admin_password = os.environ.get('ADMIN_PASSWORD')
            if admin_password:
                admin_reg = os.environ.get('ADMIN_REGISTER_NO', 'admin')
                admin_email = os.environ.get('ADMIN_EMAIL', 'admin@college.edu')
                admin_name = os.environ.get('ADMIN_NAME', 'Admin Organizer')
                admin_dept = os.environ.get('ADMIN_DEPARTMENT', 'Admin')
                
                self.stdout.write(f"Creating superuser '{admin_reg}'...")
                try:
                    User.objects.create_superuser(
                        register_no=admin_reg,
                        password=admin_password,
                        email=admin_email,
                        name=admin_name,
                        department=admin_dept
                    )
                    self.stdout.write(self.style.SUCCESS(f"Superuser '{admin_reg}' created successfully."))
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"Error creating superuser: {e}"))
            else:
                self.stderr.write(self.style.WARNING("ADMIN_PASSWORD environment variable not set. Skipping superuser creation."))
        else:
            self.stdout.write("Superuser already exists. Skipping.")

        # 2. Handle Questions & Rounds Seeding
        if Question.objects.count() > 0:
            self.stdout.write(self.style.SUCCESS('Questions already exist in database. Skipping seeding.'))
            return

        self.stdout.write('Database has no questions. Starting seeding process...')

        candidate_path = os.path.join(settings.BASE_DIR.parent, 'datas', 'AntiDrug_Candidate_Version.docx')
        admin_path = os.path.join(settings.BASE_DIR.parent, 'datas', 'AntiDrug_Admin_Key.docx')

        self.stdout.write(f"Reading Candidate questions from: {candidate_path}")
        self.stdout.write(f"Reading Admin answers from: {admin_path}")

        try:
            candidate_lines = self.extract_docx_text(candidate_path)
            admin_lines = self.extract_docx_text(admin_path)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error reading docx files: {e}"))
            return

        # Parse answers
        answers = {}
        for line in admin_lines:
            match = re.match(r'Q(\d+)\s*->\s*([A-D])', line, re.IGNORECASE)
            if match:
                q_num = int(match.group(1))
                ans = match.group(2).upper()
                answers[q_num] = ans
                
        self.stdout.write(f"Parsed {len(answers)} answers from admin key.")

        # Parse questions
        questions_data = []
        current_round = None
        
        i = 0
        while i < len(candidate_lines):
            line = candidate_lines[i]
            
            round_match = re.match(r'Round\s+(\d+)', line, re.IGNORECASE)
            if round_match:
                current_round = int(round_match.group(1))
                i += 1
                continue
                
            q_match = re.match(r'Q(\d+)\.\s*(.*)', line, re.IGNORECASE)
            if q_match:
                q_num = int(q_match.group(1))
                q_text = q_match.group(2).strip()
                
                options = {}
                j = i + 1
                while j < len(candidate_lines) and len(options) < 4:
                    opt_line = candidate_lines[j]
                    opt_match = re.match(r'([A-D])\.\s*(.*)', opt_line, re.IGNORECASE)
                    if opt_match:
                        opt_letter = opt_match.group(1).upper()
                        opt_val = opt_match.group(2).strip()
                        options[opt_letter] = opt_val
                        j += 1
                    else:
                        break
                
                if len(options) == 4:
                    questions_data.append({
                        'number': q_num,
                        'question': q_text,
                        'option_a': options['A'],
                        'option_b': options['B'],
                        'option_c': options['C'],
                        'option_d': options['D'],
                        'round': current_round,
                        'correct_answer': answers.get(q_num, 'A')
                    })
                    i = j
                    continue
            i += 1

        self.stdout.write(f"Parsed {len(questions_data)} questions.")

        if not questions_data:
            self.stderr.write(self.style.WARNING("No questions parsed! Check the format of docx files."))
            return

        # Ensure default rounds exist with correct initial statuses
        r1, _ = Round.objects.get_or_create(id=1, defaults={'name': 'Round 1', 'status': 'ACTIVE'})
        r2, _ = Round.objects.get_or_create(id=2, defaults={'name': 'Round 2', 'status': 'NOT_STARTED'})
        r3, _ = Round.objects.get_or_create(id=3, defaults={'name': 'Final Round', 'status': 'NOT_STARTED'})

        # If rounds already exist, ensure the name is correct
        if r3.name != 'Final Round':
            r3.name = 'Final Round'
            r3.save()

        round_mapping = {
            1: r1,
            2: r2,
            3: r3
        }

        created_count = 0
        for q_item in questions_data:
            r_obj = round_mapping.get(q_item['round'])
            if not r_obj:
                self.stderr.write(self.style.WARNING(f"Round {q_item['round']} not found. Skipping question {q_item['number']}."))
                continue
                
            Question.objects.create(
                round=r_obj,
                question=q_item['question'],
                option_a=q_item['option_a'],
                option_b=q_item['option_b'],
                option_c=q_item['option_c'],
                option_d=q_item['option_d'],
                correct_answer=q_item['correct_answer']
            )
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} questions into the database!"))
