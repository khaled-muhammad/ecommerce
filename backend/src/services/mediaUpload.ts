import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { backendRoot, env } from "../config/env.js";

const HACKCLUB_UPLOAD_URL = "https://cdn.hackclub.com/api/v4/upload";
const LOCAL_UPLOAD_ROOT = path.join(backendRoot, "uploads");

export function isS3Configured(): boolean {
  return Boolean(
    env.S3_BUCKET.trim() && env.S3_ACCESS_KEY.trim() && env.S3_SECRET_KEY.trim(),
  );
}

function hackclubBearer(): string {
  const b = env.HACKCLUB_CDN_BEARER.trim();
  if (b) return b;
  return env.HACKCLUB_CDN_KEY.trim();
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").replace(/[^\w.\-()+]/g, "_");
  return base.slice(0, 180) || "upload";
}

function publicUrlForS3Key(key: string): string {
  const prefix = env.S3_PUBLIC_BASE_URL.trim();
  if (prefix) {
    return `${prefix.replace(/\/$/, "")}/${key}`;
  }
  const endpoint = env.S3_ENDPOINT.trim();
  const bucket = env.S3_BUCKET.trim();
  if (endpoint) {
    return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
  }
  const region = env.S3_REGION.trim() || "us-east-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

type MulterFile = { buffer: Buffer; mimetype: string; originalname: string };

function requestPublicBase(req: { get(name: string): string | undefined }): string {
  const xfProto = req.get("x-forwarded-proto");
  const xfHost = req.get("x-forwarded-host");
  const proto = (xfProto ?? "http").split(",")[0]?.trim() || "http";
  const host = (xfHost ?? req.get("host") ?? `localhost:${env.PORT}`).split(",")[0]?.trim();
  return `${proto}://${host}`;
}

async function saveToLocalDisk(
  file: MulterFile,
  req: { get(name: string): string | undefined },
): Promise<{ url: string }> {
  const safeName = `${randomUUID()}-${sanitizeFilename(file.originalname)}`;
  const relDir = path.join("catalog");
  const dir = path.join(LOCAL_UPLOAD_ROOT, relDir);
  await fs.mkdir(dir, { recursive: true });
  const diskPath = path.join(dir, safeName);
  await fs.writeFile(diskPath, file.buffer);

  const webPath = `/uploads/catalog/${safeName}`;
  const override = env.UPLOAD_PUBLIC_BASE_URL.trim();
  if (override) {
    return { url: `${override.replace(/\/$/, "")}${webPath}` };
  }
  const base = requestPublicBase(req);
  return { url: `${base.replace(/\/$/, "")}${webPath}` };
}

export async function uploadMediaFile(
  file: MulterFile,
  req: { get(name: string): string | undefined },
): Promise<{ url: string }> {
  const mime = file.mimetype || "application/octet-stream";
  const key = `catalog/${randomUUID()}-${sanitizeFilename(file.originalname)}`;

  if (isS3Configured()) {
    const client = new S3Client({
      region: env.S3_REGION.trim() || "us-east-1",
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY.trim(),
        secretAccessKey: env.S3_SECRET_KEY.trim(),
      },
      ...(env.S3_ENDPOINT.trim()
        ? {
            endpoint: env.S3_ENDPOINT.trim(),
            forcePathStyle: true,
          }
        : {}),
    });
    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET.trim(),
        Key: key,
        Body: file.buffer,
        ContentType: mime,
      }),
    );
    return { url: publicUrlForS3Key(key) };
  }

  const bearer = hackclubBearer();
  if (bearer) {
    const blob = new Blob([new Uint8Array(file.buffer)], { type: mime });
    const formData = new FormData();
    formData.append("file", blob, sanitizeFilename(file.originalname));

    const res = await fetch(HACKCLUB_UPLOAD_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer}` },
      body: formData,
    });

    const text = await res.text();
    let data: { url?: string } = {};
    try {
      data = text ? (JSON.parse(text) as { url?: string }) : {};
    } catch {
      data = {};
    }

    if (!res.ok) {
      throw new Error(text?.slice(0, 280) || `CDN upload failed (${res.status})`);
    }
    if (!data.url) {
      throw new Error("CDN response missing url");
    }
    return { url: data.url };
  }

  return saveToLocalDisk(file, req);
}
