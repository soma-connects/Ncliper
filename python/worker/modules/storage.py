"""
Cloud Storage Module
Handles uploads to Cloudflare R2
"""

import boto3
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
env_path = os.path.join(project_root, '.env')
load_dotenv(dotenv_path=env_path)

class R2Storage:
    """Cloudflare R2 storage client (S3-compatible)"""
    
    def __init__(self):
        """Initialize R2 client with credentials from environment"""
        account_id = os.getenv('R2_ACCOUNT_ID')
        access_key = os.getenv('R2_ACCESS_KEY_ID')
        secret_key = os.getenv('R2_SECRET_ACCESS_KEY')
        
        if not all([account_id, access_key, secret_key]):
            raise ValueError("R2 credentials missing from environment variables")
        
        # Initialize S3-compatible client for R2
        self.client = boto3.client(
            's3',
            endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='auto'  # R2 uses 'auto' for region
        )
        
        self.bucket = os.getenv('R2_BUCKET_NAME', 'ncliper-clips')
        self.public_url = os.getenv('R2_PUBLIC_URL')
        
        if not self.public_url:
            raise ValueError("R2_PUBLIC_URL not set in environment variables")
    
    def upload_clip(
        self,
        file_path: str,
        job_id: str,
        clip_index: int,
        content_type: str = 'video/mp4'
    ) -> str:
        """
        Upload clip to R2 and return public URL
        
        Args:
            file_path: Local path to clip file
            job_id: Job ID for organization
            clip_index: Clip number
            content_type: MIME type (default: video/mp4)
            
        Returns:
            Public HTTPS URL to uploaded clip
        """
        # Generate object key (path in bucket)
        object_key = f"clips/{job_id}/clip_{clip_index}.mp4"
        
        print(f"[R2Storage] Uploading {file_path} to {object_key}...")
        
        try:
            # Upload file to R2
            with open(file_path, 'rb') as f:
                self.client.upload_fileobj(
                    f,
                    self.bucket,
                    object_key,
                    ExtraArgs={
                        'ContentType': content_type,
                        'CacheControl': 'public, max-age=31536000',  # Cache for 1 year
                    }
                )
            
            # Construct public URL
            public_url = f"{self.public_url}/{object_key}"
            
            print(f"[R2Storage] ✅ Uploaded successfully!")
            print(f"[R2Storage] Public URL: {public_url}")
            
            return public_url
            
        except Exception as e:
            print(f"[R2Storage] ❌ Upload failed: {e}")
            raise Exception(f"Failed to upload clip to R2: {str(e)}")
    
    def delete_clip(self, job_id: str, clip_index: int) -> bool:
        """
        Delete a clip from R2 (for cleanup/retries)
        
        Args:
            job_id: Job ID
            clip_index: Clip number
            
        Returns:
            True if deleted successfully
        """
        object_key = f"clips/{job_id}/clip_{clip_index}.mp4"
        
        try:
            self.client.delete_object(
                Bucket=self.bucket,
                Key=object_key
            )
            print(f"[R2Storage] Deleted {object_key}")
            return True
        except Exception as e:
            print(f"[R2Storage] Failed to delete {object_key}: {e}")
            return False
    
    def test_connection(self) -> bool:
        """
        Test R2 connection by listing buckets
        
        Returns:
            True if connection successful
        """
        try:
            # Try to list objects (should work even if bucket is empty)
            self.client.list_objects_v2(
                Bucket=self.bucket,
                MaxKeys=1
            )
            print(f"[R2Storage] ✅ Connection successful!")
            return True
        except Exception as e:
            print(f"[R2Storage] ❌ Connection failed: {e}")
            return False


# Test function
if __name__ == "__main__":
    print("\n🧪 Testing R2 Storage Connection\n")
    
    try:
        storage = R2Storage()
        
        # Test connection
        if storage.test_connection():
            print("\n✅ R2 is ready to use!")
            print(f"Bucket: {storage.bucket}")
            print(f"Public URL: {storage.public_url}")
        else:
            print("\n❌ R2 connection failed")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
