import sys
import random

sys.path.insert(0, '.')
from app.database import SessionLocal
from app.models import User, Organisation, OrgEmployee
from app.security import get_password_hash

db = SessionLocal()
members = [
    {
        'full_name': 'Harshada Karche',
        'department': 'HR',
        'designation': 'HR',
        'email': 'harshada.karche@shoption.in',
        'role': 'warrior'
    },
    {
        'full_name': 'Pooja Aniket Sapkal',
        'department': 'HR',
        'designation': 'HR',
        'email': 'pooja.gaikwad@shoption.in',
        'role': 'warrior'
    }
]

password = 'Shoption@123'
password_hash = get_password_hash(password)

org = db.query(Organisation).filter(Organisation.name.ilike('%shoption%')).first()
if not org:
    print('Error: Shoption Pvt Ltd organisation not found!')
    sys.exit(1)

print(f'Using Organisation: {org.name} ({org.id})')

existing_system_ids = set(r[0] for r in db.query(User.system_id).all() if r[0])
existing_system_ids.update(r[0] for r in db.query(OrgEmployee.system_id).all() if r[0])

created_users = []

for m in members:
    email = m['email'].strip().lower()
    full_name = m['full_name'].strip()
    department = m['department'].strip()
    role = m['role']

    # Ensure OrgEmployee record exists
    emp = db.query(OrgEmployee).filter(OrgEmployee.org_id == org.id, OrgEmployee.email == email).first()

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()

    if not emp:
        # Generate unique system_id if user doesn't already have one
        if existing_user and existing_user.system_id:
            sys_id = existing_user.system_id
        else:
            while True:
                sys_id = f'{random.randint(100000, 999999)}'
                if sys_id not in existing_system_ids:
                    existing_system_ids.add(sys_id)
                    break

        emp = OrgEmployee(
            system_id=sys_id,
            employee_id=email,
            email=email,
            department=department,
            org_id=org.id,
            is_tracking_needed=True
        )
        db.add(emp)
        db.commit()
        db.refresh(emp)

    if existing_user:
        print(f'User {email} already exists with ID {existing_user.id}. Updating...')
        existing_user.full_name = full_name
        existing_user.department = department
        existing_user.password_hash = password_hash
        existing_user.role = role
        existing_user.is_approved = True
        existing_user.is_active = True
        existing_user.system_id = emp.system_id
        existing_user.organisation_id = org.id
        db.commit()
        created_users.append((existing_user.id, email, full_name, existing_user.system_id, 'Updated'))
        continue

    user = User(
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        role=role,
        is_approved=True,
        is_active=True,
        is_tracking_active=False,
        system_id=emp.system_id,
        organisation_id=org.id,
        department=department
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    created_users.append((user.id, email, full_name, user.system_id, 'Created'))

print('\n=== SUMMARY OF USER CREATION ===')
for uid, email, name, sysid, status in created_users:
    print(f'[{status}] Name: {name} | Email: {email} | System ID: {sysid} | User ID: {uid}')
