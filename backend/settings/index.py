import json
import os
import base64
import uuid
import boto3
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p71111086_zenith_development_1')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def check_admin(event: dict) -> bool:
    headers = event.get('headers') or {}
    provided = headers.get('X-Admin-Password') or headers.get('x-admin-password', '')
    return provided == os.environ.get('ADMIN_PASSWORD', '')

def upload_file(s3, b64: str, prefix: str, ext: str, content_type: str) -> str:
    data = base64.b64decode(b64)
    key = f"{prefix}/{uuid.uuid4()}.{ext}"
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=content_type)
    ak = os.environ['AWS_ACCESS_KEY_ID']
    return f"https://cdn.poehali.dev/projects/{ak}/bucket/{key}"

def handler(event: dict, context) -> dict:
    """Настройки сайта: загрузка GIF и фонового баннера, заголовок и подпись."""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    # GET — вернуть все настройки
    if method == 'GET':
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"SELECT key, value FROM {SCHEMA}.site_settings")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({r[0]: r[1] for r in rows})}

    # POST — обновить настройки (только админ)
    if method == 'POST':
        if not check_admin(event):
            return {'statusCode': 403, 'headers': CORS, 'body': json.dumps({'error': 'Forbidden'})}

        body = json.loads(event.get('body') or '{}')
        updates = {}

        s3 = get_s3()

        # GIF (слева, формат 9:16)
        if body.get('gif_data'):
            ext = (body.get('gif_name', 'file.gif')).rsplit('.', 1)[-1].lower()
            ct_map = {'gif': 'image/gif', 'mp4': 'video/mp4', 'webm': 'video/webm', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png'}
            url = upload_file(s3, body['gif_data'], 'hero', ext, ct_map.get(ext, 'image/gif'))
            updates['hero_gif_url'] = url

        # Баннер фон (справа)
        if body.get('banner_data'):
            ext = (body.get('banner_name', 'file.jpg')).rsplit('.', 1)[-1].lower()
            ct_map = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp', 'gif': 'image/gif'}
            url = upload_file(s3, body['banner_data'], 'hero', ext, ct_map.get(ext, 'image/jpeg'))
            updates['hero_banner_url'] = url

        # Текстовые поля
        for field in ('hero_title', 'hero_subtitle'):
            if field in body:
                updates[field] = str(body[field])

        if updates:
            conn = get_db()
            cur = conn.cursor()
            for k, v in updates.items():
                cur.execute(f"INSERT INTO {SCHEMA}.site_settings (key, value) VALUES (%s, %s) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", (k, v))
            conn.commit(); cur.close(); conn.close()

        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True, **updates})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}
