import type { LogEntry, LogLevel, LogSource } from "@/types/log"

const authMessages: string[] = [
  "sshd: Failed password for invalid user admin from 203.0.113.44 port 22 ssh2",
  "sshd: Failed password for root from 198.51.100.12 port 22 ssh2",
  "sshd: Accepted publickey for deploy from 10.0.4.18 port 22 ssh2",
  "sudo: pam_unix(sudo:session): session opened for user root by ubuntu",
  "su: FAILED SU (to root) ubuntu on /dev/pts/0",
  "PAM: authentication failure; logname= uid=0 euid=0 tty=/dev/pts/1",
  "sshd: Disconnecting: Too many authentication failures",
  "sshd: User unknown not allowed because not listed in AllowUsers",
  "login: FAILED LOGIN (2) on /dev/tty1 FOR unknown",
  "sshd: reverse mapping checking getaddrinfo for bogon failed",
  "kerberos: Preauthentication failed for svc_scanner@CORP.LOCAL",
  "sshd: pam_unix(sshd:auth): authentication failure; logname=",
]

const firewallMessages: string[] = [
  "BLOCK SRC=185.220.101.4 DST=10.0.1.50 DPT=3389 PROTO=TCP",
  "DROP IN=eth0 OUT= MAC= SRC=192.0.2.55 DST=10.0.1.10 LEN=52 PROTO=TCP",
  "ALLOW IN=eth0 SRC=10.0.0.0/24 DST=10.0.2.5 DPT=443 PROTO=TCP",
  "SPI stateful match: INVALID packet from 45.33.32.156",
  "Port scan detected: 1024 connections in 60s from 198.18.0.9",
  "GEO-BLOCK country=XX hit on inbound SSH to 10.0.0.3:22",
  "IDS ALERT: ET SCAN Possible Nmap OSScan",
  "Connection rate limit exceeded: 10.2.4.88 -> 10.0.1.2:22",
  "RST flood mitigation: throttling 203.0.113.201",
  "ALLOW RELATED,ESTABLISHED packet on WAN",
  "BLOCK SMBv1 exploit signature from 192.0.2.77",
]

const kernelMessages: string[] = [
  "Out of memory: Kill process 8842 (java) score 912 or sacrifice child",
  "TCP: request_sock_TCP: Possible SYN flooding on port 443",
  "ixgbe 0000:03:00.0: NIC Link is Up 10 Gbps, Flow Control: RX",
  "audit: type=1400 audit(1710000001.234:42): apparmor=\"DENIED\"",
  "usb 1-1: USB disconnect, device number 3",
  "NVME: controller reset; I/O queue recovery initiated",
  "EXT4-fs (dm-0): delayed block allocation failed for inode",
  "watchdog: BUG: soft lockup - CPU#2 stuck for 22s",
  "hv_balloon: ballooning to 8192 MiB",
  "KASLR enabled; kernel base randomized",
  "segfault at 0 ip error in libc-2.39.so",
]

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]!
}

function levelForIndex(i: number): LogLevel {
  const r = i % 17
  if (r === 0 || r === 1) return "CRITICAL"
  if (r <= 5) return "ERROR"
  if (r <= 9) return "WARN"
  return "INFO"
}

function sourceForIndex(i: number): LogSource {
  const mod = i % 3
  if (mod === 0) return "Auth"
  if (mod === 1) return "Firewall"
  return "Kernel"
}

function messageFor(i: number, source: LogSource): string {
  if (source === "Auth") return pick(authMessages, i)
  if (source === "Firewall") return pick(firewallMessages, i)
  return pick(kernelMessages, i)
}

function isoMinutesAgo(minutes: number): string {
  const d = new Date(Date.now() - minutes * 60_000)
  return d.toISOString()
}

/** 100 realistic security-style log lines with stable variety. */
export const mockLogs: LogEntry[] = Array.from({ length: 100 }, (_, i) => {
  const source = sourceForIndex(i)
  const level = levelForIndex(i)
  const minutesAgo = (i * 7 + (i % 13) * 3) % 10_080 // up to 7d
  const timestamp = isoMinutesAgo(minutesAgo)
  const message = messageFor(i, source)
  return {
    id: `log-${i + 1}`,
    timestamp,
    level,
    source,
    message,
    details: {
      host: i % 5 === 0 ? "edge-fw-01" : i % 5 === 1 ? "bastion-02" : "app-03",
      pid: 1200 + (i % 8000),
      facility: source === "Kernel" ? "kern" : source === "Auth" ? "auth" : "local0",
      traceId:
        i % 4 === 0
          ? `tr_${(100000 + i).toString(16)}`
          : undefined,
    },
  }
})
