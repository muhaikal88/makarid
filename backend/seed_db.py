"""
Database Seed Script for Makar.id
=================================
Jalankan script ini untuk mengisi database dengan data awal.

Usage:
  python3 seed_db.py              # Seed semua data (skip jika sudah ada)
  python3 seed_db.py --force      # Hapus semua data lama & seed ulang
  python3 seed_db.py --status     # Cek status database saja

Environment variables yang diperlukan:
  MONGO_URL  - MongoDB connection string
  DB_NAME    - Nama database
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load .env
load_dotenv(Path(__file__).parent / '.env')

SEED_DIR = Path(__file__).parent / 'seed_data'

# Collections to seed (in order to respect dependencies)
SEED_COLLECTIONS = [
    'superadmins',
    'companies',
    'company_admins',
    'employees',
    'users',
    'jobs',
    'form_fields',
    'applications',
    'system_settings',
]


async def get_db():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    return client, db


async def check_status():
    client, db = await get_db()
    print("\n=== Database Status ===")
    print(f"MongoDB URL: {os.environ.get('MONGO_URL', 'NOT SET')}")
    print(f"Database: {os.environ.get('DB_NAME', 'NOT SET')}")
    print()
    
    for coll_name in SEED_COLLECTIONS:
        count = await db[coll_name].count_documents({})
        print(f"  {coll_name}: {count} documents")
    
    total = sum([await db[c].count_documents({}) for c in SEED_COLLECTIONS])
    print(f"\n  Total: {total} documents")
    
    if total == 0:
        print("\n  Database KOSONG. Jalankan: python3 seed_db.py")
    else:
        print("\n  Database sudah terisi.")
    
    client.close()


async def seed_data(force=False):
    client, db = await get_db()
    
    print("\n=== Seeding Database ===")
    print(f"Database: {os.environ.get('DB_NAME')}")
    print(f"Force mode: {'YES' if force else 'NO'}")
    print()
    
    for coll_name in SEED_COLLECTIONS:
        seed_file = SEED_DIR / f'{coll_name}.json'
        
        if not seed_file.exists():
            print(f"  SKIP {coll_name} - file tidak ditemukan")
            continue
        
        with open(seed_file) as f:
            docs = json.load(f)
        
        if not docs:
            print(f"  SKIP {coll_name} - data kosong")
            continue
        
        existing_count = await db[coll_name].count_documents({})
        
        if existing_count > 0 and not force:
            print(f"  SKIP {coll_name} - sudah ada {existing_count} documents (gunakan --force untuk overwrite)")
            continue
        
        if force and existing_count > 0:
            await db[coll_name].delete_many({})
            print(f"  CLEAR {coll_name} - {existing_count} documents dihapus")
        
        await db[coll_name].insert_many(docs)
        print(f"  SEED {coll_name} - {len(docs)} documents ditambahkan")
    
    print("\nSeeding selesai!")
    print("\nLogin credentials:")
    
    # Show superadmin credentials
    superadmin_file = SEED_DIR / 'superadmins.json'
    if superadmin_file.exists():
        admins = json.load(open(superadmin_file))
        for a in admins:
            print(f"  Super Admin: {a['email']} (password sesuai yang di-set sebelumnya)")
    
    client.close()


if __name__ == '__main__':
    if '--status' in sys.argv:
        asyncio.run(check_status())
    elif '--force' in sys.argv:
        print("WARNING: Ini akan MENGHAPUS semua data lama dan menggantinya dengan seed data!")
        confirm = input("Ketik 'yes' untuk lanjut: ")
        if confirm.lower() == 'yes':
            asyncio.run(seed_data(force=True))
        else:
            print("Dibatalkan.")
    else:
        asyncio.run(seed_data(force=False))
