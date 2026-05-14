import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/integration/domain";
import { logger } from "@/utils/logger";

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID ?? "tenant_demo";
const MAX_UPLOAD_BYTES = Number(process.env.MEDIA_MAX_UPLOAD_BYTES ?? 25 * 1024 * 1024);
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function s3Client() {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export class MediaUploadService {
  async createPresignedUpload(input: {
    ownerType: "work_order" | "elevator" | "incident";
    ownerId: string;
    category: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    requestId?: string;
    userId?: string;
  }) {
    if (!ALLOWED_CONTENT_TYPES.has(input.contentType))
      throw new DomainError("UPLOAD_ERROR", "Недопустимый тип файла", 415, {
        allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
      });
    if (
      !Number.isFinite(input.sizeBytes) ||
      input.sizeBytes <= 0 ||
      input.sizeBytes > MAX_UPLOAD_BYTES
    )
      throw new DomainError("UPLOAD_ERROR", "Недопустимый размер файла", 413, {
        maxUploadBytes: MAX_UPLOAD_BYTES,
      });

    const bucket = process.env.S3_BUCKET_MEDIA;
    if (!bucket)
      throw new DomainError("UPLOAD_ERROR", "S3_BUCKET_MEDIA не настроен", 500);

    const mediaId = randomUUID();
    const extension = input.fileName.split(".").pop()?.toLowerCase() ?? "bin";
    const key = `tenant/${DEFAULT_TENANT_ID}/${input.ownerType}/${input.ownerId}/${mediaId}.${extension}`;

    const media = await prisma.mediaFile.create({
      data: {
        id: mediaId,
        tenantId: DEFAULT_TENANT_ID,
        workOrderId: input.ownerType === "work_order" ? input.ownerId : undefined,
        elevatorId: input.ownerType === "elevator" ? input.ownerId : undefined,
        kind: input.category,
        status: "LOCAL_PENDING",
        s3Key: key,
        metadata: {
          fileName: input.fileName,
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
          uploadPolicy: "presigned-put",
        } as Prisma.InputJsonObject,
      },
    });

    const expiresIn = Number(process.env.S3_UPLOAD_URL_TTL_SECONDS ?? 300);
    const uploadUrl = await getSignedUrl(
      s3Client(),
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: input.contentType,
        ContentLength: input.sizeBytes,
        Metadata: {
          mediaId,
          ownerType: input.ownerType,
          ownerId: input.ownerId,
        },
      }),
      { expiresIn },
    );

    logger.info(
      {
        requestId: input.requestId,
        userId: input.userId,
        endpoint: "/api/v1/media/upload-url",
        operationType: "media.presign_upload",
        upload: {
          mediaId,
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
        },
      },
      "presigned upload URL created",
    );

    return {
      media,
      uploadUrl,
      method: "PUT" as const,
      expiresIn,
      headers: { "content-type": input.contentType },
      confirmUrl: "/api/v1/media/confirm",
      maxUploadBytes: MAX_UPLOAD_BYTES,
    };
  }
}

export const mediaUploadService = new MediaUploadService();
