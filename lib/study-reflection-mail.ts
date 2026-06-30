import fs from "fs";
import path from "path";
import type { Request } from "express";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const STUDY_REFLECTION_MAIL_TO =
  process.env.STUDY_REFLECTION_MAIL_TO || "450400469@qq.com";
const REQUEST_LOG = path.join(process.cwd(), "data", "study-reflections.jsonl");

let transporterPromise: Promise<Transporter> | null = null;

function getTransporter(): Promise<Transporter> | null {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.qq.com",
        port: Number(process.env.SMTP_PORT || 465),
        secure: String(process.env.SMTP_SECURE || "true") === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    );
  }
  return transporterPromise;
}

async function appendRequestLog(entry: Record<string, unknown>) {
  await fs.promises.mkdir(path.dirname(REQUEST_LOG), { recursive: true });
  await fs.promises.appendFile(
    REQUEST_LOG,
    `${JSON.stringify(entry)}\n`,
    "utf8"
  );
}

function getClientIp(req: Request) {
  return String(
    req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.socket.remoteAddress ||
      ""
  )
    .split(",")[0]
    .trim();
}

export async function sendStudyReflectionEmail({
  name,
  comment,
  title,
  req,
}: {
  name: string;
  comment: string;
  title: string;
  req: Request;
}) {
  const submittedAt = new Date().toISOString();
  const ip = getClientIp(req);
  const entry = { name, comment, title, submittedAt, ip, to: STUDY_REFLECTION_MAIL_TO };

  const transporter = await getTransporter();
  if (!transporter) {
    await appendRequestLog({ ...entry, mailed: false, error: "smtp_not_configured" });
    throw new Error("邮件服务未配置，请联系管理员");
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from,
    to: STUDY_REFLECTION_MAIL_TO,
    subject: "[红帆领航] 互动研学角 · 思想感悟提交",
    text: [
      "收到一条互动研学角思想感悟：",
      "",
      `姓名与支部职务：${name}`,
      `关联期刊/文章：${title}`,
      `提交时间：${submittedAt}`,
      `来源 IP：${ip || "-"}`,
      "",
      "—— 思想感悟正文 ——",
      comment,
    ].join("\n"),
  });

  await appendRequestLog({ ...entry, mailed: true });
}
