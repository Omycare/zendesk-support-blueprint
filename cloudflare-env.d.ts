declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    CREDENTIAL_ENCRYPTION_KEY?: string;
    AGENT_TRAINING_CODE?: string;
    ADMIN_TRAINING_CODE?: string;
  }
}
