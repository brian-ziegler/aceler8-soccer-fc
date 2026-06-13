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
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const ddb = new DynamoDBClient({});
const ssm = new SSMClient({});
const s3 = new S3Client({});
const cognito = new CognitoIdentityProviderClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const GITHUB_OWNER = process.env.GITHUB_OWNER!;
const GITHUB_REPO = process.env.GITHUB_REPO!;
const GITHUB_TOKEN_PARAM = process.env.GITHUB_TOKEN_PARAM!;
const MEDIA_BUCKET = process.env.MEDIA_BUCKET!;
const MEDIA_REGION = process.env.MEDIA_REGION || 'us-east-1';
const USER_POOL_ID = process.env.USER_POOL_ID!;
const NEXT_SITE_URL = process.env.NEXT_SITE_URL!;
const LIVE_SITE_URL = process.env.LIVE_SITE_URL!;

const VALID_ROLES = new Set(['admin', 'editor']);

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
    .filter((obj) => obj.Key !== prefix && !obj.Key!.endsWith('.keep'))
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

async function createFolder(body: string | null): Promise<APIGatewayProxyResult> {
  const data =
    typeof body === 'string' ? (JSON.parse(body) as { folder?: string }) : {};
  if (!data.folder) return respondError(400, 'folder is required');
  const folder = data.folder.replace(/\/+$/, '');
  await s3.send(
    new PutObjectCommand({ Bucket: MEDIA_BUCKET, Key: `${folder}/.keep`, Body: '', ContentType: 'application/octet-stream' }),
  );
  return respond(200, { created: true, folder: `${folder}/` });
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

// ── User management handlers ──────────────────────────────────────────────────

function getCallerGroups(event: APIGatewayProxyEvent): string[] {
  const auth = event.headers.Authorization ?? event.headers.authorization ?? '';
  if (!auth) return [];
  try {
    const payload = auth.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString()) as Record<string, unknown>;
    return Array.isArray(decoded['cognito:groups']) ? (decoded['cognito:groups'] as string[]) : [];
  } catch {
    return [];
  }
}

async function listUsers(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!getCallerGroups(event).includes('admin')) return respondError(403, 'Forbidden');
  const result = await cognito.send(new ListUsersCommand({ UserPoolId: USER_POOL_ID }));
  const users = await Promise.all(
    (result.Users ?? []).map(async (u) => {
      const groups = await cognito.send(
        new AdminListGroupsForUserCommand({ UserPoolId: USER_POOL_ID, Username: u.Username! }),
      );
      return {
        username: u.Username,
        email: u.Attributes?.find((a) => a.Name === 'email')?.Value,
        name: u.Attributes?.find((a) => a.Name === 'name')?.Value,
        status: u.UserStatus,
        enabled: u.Enabled,
        role: groups.Groups?.[0]?.GroupName ?? null,
      };
    }),
  );
  return respond(200, users);
}

async function createUser(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!getCallerGroups(event).includes('admin')) return respondError(403, 'Forbidden');
  const data =
    typeof event.body === 'string'
      ? (JSON.parse(event.body) as { email?: string; role?: string; name?: string })
      : {};
  if (!data.email) return respondError(400, 'email is required');
  if (!data.role || !VALID_ROLES.has(data.role)) return respondError(400, 'role must be admin or editor');

  const attrs = [
    { Name: 'email', Value: data.email },
    { Name: 'email_verified', Value: 'true' },
    ...(data.name ? [{ Name: 'name', Value: data.name }] : []),
  ];
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: data.email,
      UserAttributes: attrs,
      DesiredDeliveryMediums: ['EMAIL'],
    }),
  );
  await cognito.send(
    new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: data.email, GroupName: data.role }),
  );
  return respond(201, { created: true });
}

async function deleteUser(event: APIGatewayProxyEvent, username: string): Promise<APIGatewayProxyResult> {
  if (!getCallerGroups(event).includes('admin')) return respondError(403, 'Forbidden');
  await cognito.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: username }));
  return respond(200, { deleted: true });
}

async function resendInvite(event: APIGatewayProxyEvent, username: string): Promise<APIGatewayProxyResult> {
  if (!getCallerGroups(event).includes('admin')) return respondError(403, 'Forbidden');
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      MessageAction: 'RESEND',
      DesiredDeliveryMediums: ['EMAIL'],
    }),
  );
  return respond(200, { resent: true });
}

async function updateUserRole(event: APIGatewayProxyEvent, username: string): Promise<APIGatewayProxyResult> {
  if (!getCallerGroups(event).includes('admin')) return respondError(403, 'Forbidden');
  const data =
    typeof event.body === 'string' ? (JSON.parse(event.body) as { role?: string }) : {};
  if (!data.role || !VALID_ROLES.has(data.role)) return respondError(400, 'role must be admin or editor');

  for (const group of ['admin', 'editor']) {
    try {
      await cognito.send(
        new AdminRemoveUserFromGroupCommand({ UserPoolId: USER_POOL_ID, Username: username, GroupName: group }),
      );
    } catch { /* user may not be in this group */ }
  }
  await cognito.send(
    new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: username, GroupName: data.role }),
  );
  return respond(200, { updated: true });
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

// ── Deploy status handler ─────────────────────────────────────────────────────

interface GhRun {
  status: string;
  conclusion: string | null;
  created_at: string;
  html_url: string;
}

async function deployStatus(): Promise<APIGatewayProxyResult> {
  const token = await getGithubToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/deploy.yml/runs`;

  const [nextRes, liveRes] = await Promise.all([
    fetch(`${baseUrl}?branch=next&per_page=1`, { headers }),
    fetch(`${baseUrl}?branch=main&per_page=1`, { headers }),
  ]);

  const [nextData, liveData] = await Promise.all([
    nextRes.json() as Promise<{ workflow_runs?: GhRun[] }>,
    liveRes.json() as Promise<{ workflow_runs?: GhRun[] }>,
  ]);

  function parseRun(data: { workflow_runs?: GhRun[] }) {
    const run = data.workflow_runs?.[0];
    if (!run) return null;
    return { status: run.status, conclusion: run.conclusion, createdAt: run.created_at, htmlUrl: run.html_url };
  }

  return respond(200, {
    next: parseRun(nextData),
    live: parseRun(liveData),
    nextUrl: NEXT_SITE_URL,
    liveUrl: LIVE_SITE_URL,
  });
}

// ── Router ────────────────────────────────────────────────────────────────────

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const pathStr = event.path ?? '';
  const parts = pathStr.replace(/^\//, '').split('/');

  if (parts[0] !== 'api') return respondError(404, 'Not found');

  const segment = parts[1];

  if (segment === 'publish' && method === 'POST') return publish(event.body);
  if (segment === 'deploy-status' && method === 'GET') return deployStatus();

  if (segment === 'users') {
    const username = parts[2] ? decodeURIComponent(parts[2]) : undefined;
    const action = parts[3];
    if (method === 'GET' && !username) return listUsers(event);
    if (method === 'POST' && !username) return createUser(event);
    if (method === 'DELETE' && username && !action) return deleteUser(event, username);
    if (method === 'PUT' && username && !action) return updateUserRole(event, username);
    if (method === 'POST' && username && action === 'resend') return resendInvite(event, username);
    return respondError(404, 'Not found');
  }

  if (segment === 'media') {
    const sub = parts[2];
    if (method === 'GET' && !sub) return listMedia(event);
    if (method === 'POST' && sub === 'presign') return presignUpload(event.body);
    if (method === 'POST' && sub === 'delete') return deleteMedia(event.body);
    if (method === 'POST' && sub === 'move') return moveMedia(event.body);
    if (method === 'POST' && sub === 'folder') return createFolder(event.body);
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
