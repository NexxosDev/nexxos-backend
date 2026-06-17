# NEXXOS — Configuración AWS S3

Configuración creada en la cuenta AWS **Nexxos (960583974070)** el 17/06/2026.

## Bucket S3
- **Nombre del bucket:** `nexxos-storage-app`
  - Nota: el nombre solicitado `nexxos-storage` ya existía en us-east-2 y, tras eliminarlo, AWS no liberó el nombre a tiempo (error "conflicting conditional operation"). Por decisión del usuario (opción 2) se usó `nexxos-storage-app`.
- **Región:** `us-east-1` (US East — N. Virginia)
- **Object Ownership:** ACLs deshabilitadas
- **Block all public access:** Desactivado (OFF)
- **Cifrado:** SSE-S3 (por defecto)

### Bucket Policy (lectura pública de la carpeta /public)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadForPublicFolder",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::nexxos-storage-app/public/*"
        }
    ]
}
```

## IAM Policy
- **Nombre:** `NexxosS3Policy`
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "NexxosS3Access",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": [
                "arn:aws:s3:::nexxos-storage-app",
                "arn:aws:s3:::nexxos-storage-app/*"
            ]
        }
    ]
}
```

## IAM User
- **Usuario:** `nexxos-app`
- **Acceso a consola:** Deshabilitado
- **Política adjunta:** `NexxosS3Policy` (directamente)
- **ARN:** `arn:aws:iam::960583974070:user/nexxos-app`

## Llaves de acceso (Access Keys)
> ⚠️ El Secret Access Key solo se muestra una vez. Guárdalo de forma segura. No lo subas a Git.

- **AWS_ACCESS_KEY_ID:** `AKIA57J2EHS3AIKNICQD`
- **AWS_SECRET_ACCESS_KEY:** `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`
- **AWS_REGION:** `us-east-1`
- **AWS_S3_BUCKET:** `nexxos-storage-app`

## Variables de entorno sugeridas (.env — backend NestJS)
```env
AWS_ACCESS_KEY_ID=AKIA57J2EHS3AIKNICQD
AWS_SECRET_ACCESS_KEY=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
AWS_REGION=us-east-1
AWS_S3_BUCKET=nexxos-storage-app
```
