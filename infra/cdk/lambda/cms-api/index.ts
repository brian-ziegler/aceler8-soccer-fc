import {
  DynamoDBClient,
  QueryCommand,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const ddb = new DynamoDBClient({});
const ssm = new SSMClient({});
const s3 = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME!;
const GITHUB_OWNER = process.env.GITHUB_OWNER!;
const GITHUB_REPO = process.env.GITHUB_REPO!;
const GITHUB_TOKEN_PARAM = process.env.GITHUB_TOKEN_PARAM!;
const MEDIA_BUCKET = process.env.MEDIA_BUCKET!;
const MEDIA_REGION = process.env.MEDIA_REGION || 'us-east-1';

const VALID_ENTITY_TYPES = new Set(['coaches', 'players', 'teams', 'hero_slides']);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

function respond(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    body: JSON.stringify(body),
  };
}

function respondError(statusCode: number, message: string): APIGatewayProxyResult {
  return respond(statusCode, { error: message });
}

// ── DynamoDB entity handlers ──────────────────────────────────────────────────

async function listEntities(entityType: string): Promise<APIGatewayProxyResult> {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'entityType = :et',
      ExpressionAttributeValues: marshall({ ':et': entityType }),
    }),
  );
  const items = (result.Items ?? []).map((item) => unmarshall(item));
  items.sort((a, b) => ((a['order'] as number) ?? 0) - ((b['order'] as number) ?? 0));
  return respond(200, items);
}

async function getEntity(entityType: string, id: string): Promise<APIGatewayProxyResult> {
  const result = await ddb.send(
    new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ entityType, id }),
    }),
  );
  if (!result.Item) return respondError(404, 'Not found');
  return respond(200, unmarshall(result.Item));
}

async function putEntity(
  entityType: string,
  id: string,
  body: string | null,
): Promise<APIGatewayProxyResult> {
  const data: Record<string, unknown> =
    typeof body === 'string' ? (JSON.parse(body) as Record<string, unknown>) : {};
  const item = { ...data, entityType, id };
  await ddb.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(item, { removeUndefinedValues: true }),
    }),
  );
  return respond(200, item);
}

async function deleteEntity(entityType: string, id: string): Promise<APIGatewayProxyResult> {
  await ddb.send(
    new DeleteItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ entityType, id }),
    }),
  );
  return respond(200, { deleted: true });
}

// ── Media (S3) handlers ───────────────────────────────────────────────────────

function mediaUrl(key: string): string {
  return `https://${MEDIA_BUCKET}.s3.${MEDIA_REGION}.amazonaws.com/${key}`;
}

async function listMedia(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const prefix = event.queryStringParameters?.prefix ?? '';
  const result = await s3.send(
    new ListObjectsV2Command({ Bucket: MEDIA_BUCKET, Prefix: prefix, Delimiter: '/' }),
  );
  const folders = (result.CommonPrefixes ?? []).map((p) => p.Prefix!);
  const files = (result.Contents ?? [])
    .filter((obj) => obj.Key !== prefix)
    .map((obj) => ({
      key: obj.Key!,
      url: mediaUrl(obj.Key!),
      lastModified: obj.LastModified?.toISOString(),
      size: obj.Size,
    }));
  files.sort((a, b) => (b.lastModified ?? '').localeCompare(a.lastModified ?? ''));
  return respond(200, { folders, files });
}

async function presignUpload(body: string | null): Promise<APIGatewayProxyResult> {
  const data =
    typeof body === 'string'
      ? (JSON.parse(body) as { filename?: string; contentType?: string; folder?: string })
      : {};
  if (!data.filename) return respondError(400, 'filename is required');

  const sanitized = data.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const folderPrefix = data.folder ? data.folder.replace(/\/+$/, '') + '/' : '';
  const key = `${folderPrefix}${Date.now()}-${sanitized}`;
  const contentType = data.contentType || 'image/jpeg';

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: MEDIA_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 },
  );

  return respond(200, { uploadUrl, publicUrl: mediaUrl(key), key });
}

async function deleteMedia(body: string | null): Promise<APIGatewayProxyResult> {
  const data =
    typeof body === 'string' ? (JSON.parse(body) as { key?: string }) : {};
  if (!data.key) return respondError(400, 'key is required');
  await s3.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: data.key }));
  return respond(200, { deleted: true });
}

async function moveMedia(body: string | null): Promise<APIGatewayProxyResult> {
  const data =
    typeof body === 'string'
      ? (JSON.parse(body) as { sourceKey?: string; destFolder?: string })
      : {};
  if (!data.sourceKey) return respondError(400, 'sourceKey is required');

  const basename = data.sourceKey.includes('/')
    ? data.sourceKey.split('/').pop()!
    : data.sourceKey;
  const destFolder = (data.destFolder ?? '').replace(/\/+$/, '');
  const destKey = destFolder ? `${destFolder}/${basename}` : basename;

  if (data.sourceKey === destKey) return respond(200, { moved: false });

  await s3.send(
    new CopyObjectCommand({
      Bucket: MEDIA_BUCKET,
      CopySource: `${MEDIA_BUCKET}/${data.sourceKey}`,
      Key: destKey,
    }),
  );
  await s3.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: data.sourceKey }));
  return respond(200, { moved: true, key: destKey, url: mediaUrl(destKey) });
}

// ── Publish handler ───────────────────────────────────────────────────────────

async function getGithubToken(): Promise<string> {
  const result = await ssm.send(
    new GetParameterCommand({ Name: GITHUB_TOKEN_PARAM, WithDecryption: true }),
  );
  if (!result.Parameter?.Value) throw new Error('GitHub token not found in SSM');
  return result.Parameter.Value;
}

async function publish(body: string | null): Promise<APIGatewayProxyResult> {
  const data =
    typeof body === 'string' ? (JSON.parse(body) as Record<string, unknown>) : {};
  const env = data?.env as string | undefined;
  if (env !== 'next' && env !== 'live') {
    return respondError(400, "env must be 'next' or 'live'");
  }
  const branch = env === 'live' ? 'main' : 'next';
  const token = await getGithubToken();
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/deploy.yml/dispatches`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ ref: branch }),
  });
  if (!res.ok) {
    const text = await res.text();
    return respondError(502, `GitHub API error: ${res.status} ${text}`);
  }
  return respond(200, { dispatched: true, branch, env });
}

// ── Router ────────────────────────────────────────────────────────────────────

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const pathStr = event.path ?? '';
  const parts = pathStr.replace(/^\//, '').split('/');

  if (parts[0] !== 'api') return respondError(404, 'Not found');

  const segment = parts[1];

  if (segment === 'publish' && method === 'POST') return publish(event.body);

  if (segment === 'media') {
    const sub = parts[2];
    if (method === 'GET' && !sub) return listMedia(event);
    if (method === 'POST' && sub === 'presign') return presignUpload(event.body);
    if (method === 'POST' && sub === 'delete') return deleteMedia(event.body);
    if (method === 'POST' && sub === 'move') return moveMedia(event.body);
    return respondError(404, 'Not found');
  }

  const entityType = segment;
  if (!entityType || !VALID_ENTITY_TYPES.has(entityType)) {
    return respondError(
      400,
      `Invalid entity type. Must be one of: ${[...VALID_ENTITY_TYPES].join(', ')}`,
    );
  }

  const id = parts[2];

  if (!id) {
    if (method === 'GET') return listEntities(entityType);
    return respondError(405, 'Method not allowed');
  }

  if (method === 'GET') return getEntity(entityType, id);
  if (method === 'PUT') return putEntity(entityType, id, event.body);
  if (method === 'DELETE') return deleteEntity(entityType, id);

  return respondError(405, 'Method not allowed');
};
