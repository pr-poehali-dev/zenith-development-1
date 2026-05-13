import json
import os
import base64
import uuid
import boto3
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p71111086_zenith_development_1')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
}

def check_admin(event: dict) -> bool:
    headers = event.get('headers') or {}
    provided = headers.get('X-Admin-Password') or headers.get('x-admin-password', '')
    return provided == os.environ.get('ADMIN_PASSWORD', '')

def upload_file(s3, b64_data: str, prefix: str, ext: str, content_type: str) -> str:
    data = base64.b64decode(b64_data)
    key = f"{prefix}/{uuid.uuid4()}.{ext}"
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=content_type)
    access_key = os.environ['AWS_ACCESS_KEY_ID']
    return f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"

def handler(event: dict, context) -> dict:
    """Управление треками: загрузка аудио, обложки, текста песни в S3, сохранение в БД."""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')

    # POST /verify-password
    if method == 'POST' and path.endswith('/verify-password'):
        body = json.loads(event.get('body') or '{}')
        correct = body.get('password', '') == os.environ.get('ADMIN_PASSWORD', '')
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': correct})}

    # GET — список треков (публичный)
    if method == 'GET':
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, cell_row, cell_col, title, artist, file_url, file_type, duration, color, emoji, lyrics, cover_url
            FROM {SCHEMA}.tracks
            ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        tracks = [
            {
                'id': r[0], 'cell_row': r[1], 'cell_col': r[2],
                'title': r[3], 'artist': r[4], 'file_url': r[5],
                'file_type': r[6], 'duration': r[7], 'color': r[8],
                'emoji': r[9], 'lyrics': r[10] or '', 'cover_url': r[11] or '',
            }
            for r in rows
        ]
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'tracks': tracks})}

    # POST — загрузить трек (только админ)
    if method == 'POST':
        if not check_admin(event):
            return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Forbidden'})}

        body = json.loads(event.get('body') or '{}')

        file_b64    = body.get('file_data', '')
        file_name   = body.get('file_name', 'track')
        file_type   = body.get('file_type', 'audio')
        title       = body.get('title', file_name)
        artist      = body.get('artist', '')
        lyrics      = body.get('lyrics', '')
        cell_row    = int(body.get('cell_row', 0))
        cell_col    = int(body.get('cell_col', 0))
        color       = body.get('color', 'from-purple-900 to-indigo-900')
        emoji       = body.get('emoji', '🎵')
        cover_b64   = body.get('cover_data', '')
        cover_name  = body.get('cover_name', '')

        s3 = get_s3()

        # Upload audio/video
        ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else 'mp3'
        audio_content_type_map = {
            'mp3': 'audio/mpeg', 'mp4': 'video/mp4', 'wav': 'audio/wav',
            'ogg': 'audio/ogg', 'm4a': 'audio/m4a', 'webm': 'video/webm', 'mov': 'video/quicktime',
        }
        file_url = upload_file(s3, file_b64, 'tracks', ext, audio_content_type_map.get(ext, 'application/octet-stream'))

        # Upload cover image (optional)
        cover_url = ''
        if cover_b64:
            cover_ext = cover_name.rsplit('.', 1)[-1].lower() if '.' in cover_name else 'jpg'
            img_content_type_map = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}
            cover_url = upload_file(s3, cover_b64, 'covers', cover_ext, img_content_type_map.get(cover_ext, 'image/jpeg'))

        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.tracks (cell_row, cell_col, title, artist, file_url, file_type, color, emoji, lyrics, cover_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            RETURNING id
        """, (cell_row, cell_col, title, artist, file_url, file_type, color, emoji, lyrics, cover_url))

        row = cur.fetchone()
        if not row:
            cur.execute(f"""
                UPDATE {SCHEMA}.tracks
                SET title=%s, artist=%s, file_url=%s, file_type=%s, color=%s, emoji=%s, lyrics=%s, cover_url=%s, created_at=NOW()
                WHERE cell_row=%s AND cell_col=%s
                RETURNING id
            """, (title, artist, file_url, file_type, color, emoji, lyrics, cover_url, cell_row, cell_col))
            row = cur.fetchone()

        track_id = row[0] if row else None
        conn.commit()
        cur.close()
        conn.close()

        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({
            'id': track_id, 'file_url': file_url, 'title': title,
            'artist': artist, 'cell_row': cell_row, 'cell_col': cell_col,
            'color': color, 'emoji': emoji, 'lyrics': lyrics, 'cover_url': cover_url,
        })}

    # PUT — обновить метаданные (только админ)
    if method == 'PUT':
        if not check_admin(event):
            return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Forbidden'})}

        body = json.loads(event.get('body') or '{}')
        track_id   = body.get('id')
        title      = body.get('title', '')
        artist     = body.get('artist', '')
        lyrics     = body.get('lyrics', '')
        cover_b64  = body.get('cover_data', '')
        cover_name = body.get('cover_name', '')

        cover_url = body.get('cover_url', '')
        if cover_b64:
            s3 = get_s3()
            cover_ext = cover_name.rsplit('.', 1)[-1].lower() if '.' in cover_name else 'jpg'
            img_content_type_map = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}
            cover_url = upload_file(s3, cover_b64, 'covers', cover_ext, img_content_type_map.get(cover_ext, 'image/jpeg'))

        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"""
            UPDATE {SCHEMA}.tracks SET title=%s, artist=%s, lyrics=%s, cover_url=%s WHERE id=%s
        """, (title, artist, lyrics, cover_url, track_id))
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True, 'cover_url': cover_url})}

    # DELETE — удалить трек (только админ)
    if method == 'DELETE':
        if not check_admin(event):
            return {'statusCode': 403, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Forbidden'})}

        params = event.get('queryStringParameters') or {}
        track_id = params.get('id')
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.tracks WHERE id=%s", (track_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}
