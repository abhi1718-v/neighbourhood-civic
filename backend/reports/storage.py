import os
from django.conf import settings
from supabase import create_client

def upload_to_supabase(uploaded_file):
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    safe_name = os.path.basename(uploaded_file.name).replace(" ", "_")
    path = f"reports/{__import__('uuid').uuid4().hex}_{safe_name}"
    content = uploaded_file.read()
    client.storage.from_(settings.SUPABASE_BUCKET).upload(
        path, content, {"content-type": uploaded_file.content_type or "application/octet-stream", "upsert": "false"}
    )
    # Public URL is useful only if the bucket is public. For a private bucket, the app stores the path
    # and local deployments should use local media. This MVP expects a public bucket for direct display.
    return client.storage.from_(settings.SUPABASE_BUCKET).get_public_url(path)
